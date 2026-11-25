import { describe, expect, it } from "vitest";
import { executarBusca, type DepsBusca, type SugestaoNova } from "@/lib/busca";
import type { Adaptador } from "@/lib/fontes/comum";
import { PERFIL_PADRAO } from "@/lib/perfil-padrao";
import { chaveDuplicidade } from "@/lib/texto";
import type { ResumoExecucao, VagaBruta } from "@/lib/tipos";

function vaga(campos: Partial<VagaBruta>): VagaBruta {
  return {
    fonte: "gupy",
    idExterno: "1",
    empresa: "Empresa",
    cargo: "Analista de PCP",
    link: "https://exemplo.com",
    cidade: "Rio de Janeiro",
    modalidade: "hibrido",
    localTexto: "Rio de Janeiro",
    descricao: "",
    ...campos,
  };
}

const adaptador = (fonte: VagaBruta["fonte"], vagas: VagaBruta[] | Error): Adaptador => ({
  fonte,
  buscar: async () => {
    if (vagas instanceof Error) throw vagas;
    return vagas;
  },
});

function deps(adaptadores: Adaptador[], extra: Partial<DepsBusca> = {}) {
  const salvas: SugestaoNova[] = [];
  const resumos: ResumoExecucao[] = [];
  const d: DepsBusca = {
    adaptadores,
    perfil: PERFIL_PADRAO,
    chavesExistentes: new Set(),
    idsExistentes: new Set(),
    salvar: async (s) => void salvas.push(...s),
    registrar: async (r) => void resumos.push(r),
    ...extra,
  };
  return { d, salvas, resumos };
}

describe("executarBusca", () => {
  it("uma fonte com erro não derruba as outras", async () => {
    const { d, salvas, resumos } = deps([
      adaptador("gupy", new Error("fora do ar")),
      adaptador("greenhouse", [vaga({ fonte: "greenhouse", idExterno: "a" }), vaga({ fonte: "greenhouse", idExterno: "b", empresa: "Outra" })]),
    ]);
    const r = await executarBusca(d);
    expect(r).toHaveLength(2);
    const gupy = r.find((x) => x.fonte === "gupy")!;
    expect(gupy.erro).toContain("fora do ar");
    expect(gupy.encontradas).toBe(0);
    expect(salvas).toHaveLength(2);
    expect(resumos).toHaveLength(2);
  });

  it("a mesma vaga vinda de duas fontes é salva uma vez", async () => {
    const { d, salvas } = deps([
      adaptador("gupy", [vaga({ idExterno: "1" })]),
      adaptador("greenhouse", [vaga({ fonte: "greenhouse", idExterno: "x" })]),
    ]);
    await executarBusca(d);
    expect(salvas).toHaveLength(1);
  });

  it("vaga cuja chave já existe (lista ou sugestão recente) não é salva", async () => {
    const chave = chaveDuplicidade("Empresa", "Analista de PCP", "Rio de Janeiro");
    const { d, salvas } = deps([adaptador("gupy", [vaga({})])], { chavesExistentes: new Set([chave]) });
    const [r] = await executarBusca(d);
    expect(salvas).toHaveLength(0);
    expect(r.novas).toBe(0);
    expect(r.encontradas).toBe(1);
  });

  it("vaga com id já gravado não é salva de novo", async () => {
    const { d, salvas } = deps([adaptador("gupy", [vaga({ idExterno: "77" })])], { idsExistentes: new Set(["gupy:77"]) });
    await executarBusca(d);
    expect(salvas).toHaveLength(0);
  });

  it("vaga eliminada é salva marcada e contada em eliminadas", async () => {
    const { d, salvas } = deps([adaptador("gupy", [vaga({ cargo: "Estágio em PCP" }), vaga({ idExterno: "2", cargo: "Assistente de PCP" })])]);
    const [r] = await executarBusca(d);
    expect(salvas).toHaveLength(2);
    expect(salvas.find((s) => s.cargo.startsWith("Estágio"))!.resultado.eliminada).toBe(true);
    expect(r.eliminadas).toBe(1);
    expect(r.novas).toBe(1);
  });

  it("vaga fora do Brasil conta como eliminada mas não é gravada", async () => {
    const { d, salvas } = deps([adaptador("ashby", [vaga({ fonte: "ashby", modalidade: "exterior", cidade: "London" })])]);
    const [r] = await executarBusca(d);
    expect(salvas).toHaveLength(0);
    expect(r.eliminadas).toBe(1);
    expect(r.encontradas).toBe(1);
  });

  it("anúncio com mais de 90 dias é eliminado", async () => {
    const agora = new Date("2026-11-25T12:00:00Z").getTime();
    const { d, salvas } = deps(
      [adaptador("gupy", [
        vaga({ idExterno: "velha", cargo: "Assistente de PCP", publicadaEm: "2026-01-06T00:00:00Z" }),
        vaga({ idExterno: "nova", empresa: "Outra", cargo: "Assistente de PCP", publicadaEm: "2026-11-20T00:00:00Z" }),
      ])],
      { agora },
    );
    const [r] = await executarBusca(d);
    const velha = salvas.find((s) => s.idExterno === "velha")!;
    expect(velha.resultado.eliminada).toBe(true);
    expect(velha.resultado.motivoEliminacao).toBe("anúncio com mais de 90 dias");
    expect(salvas.find((s) => s.idExterno === "nova")!.resultado.eliminada).toBe(false);
    expect(r.novas).toBe(1);
  });
});
