import { describe, expect, it } from "vitest";
import { PERFIL_PADRAO } from "@/lib/perfil-padrao";
import { repontuar, type SugestaoGuardada } from "@/lib/repontuar";

const agora = new Date("2026-11-25T12:00:00Z").getTime();

function sug(campos: Partial<SugestaoGuardada>): SugestaoGuardada {
  return {
    id: "1",
    situacao: "nova",
    fonte: "gupy",
    idExterno: "x",
    empresa: "Empresa",
    cargo: "Analista de Processos",
    link: "https://exemplo.com",
    cidade: "Rio de Janeiro",
    modalidade: "hibrido",
    localTexto: "Rio de Janeiro",
    descricao: "",
    publicadaEm: "2026-11-20T00:00:00Z",
    ...campos,
  };
}

describe("repontuar", () => {
  it("vaga eliminada por estar fora do RJ volta quando 'aceitar outras cidades' é ligado", () => {
    const [r] = repontuar([sug({ situacao: "eliminada", cidade: "São Paulo" })], { ...PERFIL_PADRAO, aceitarOutrasCidades: true }, agora);
    expect(r.situacao).toBe("nova");
    expect(r.resultado.eliminada).toBe(false);
  });

  it("descartadas e adicionadas não são tocadas", () => {
    const r = repontuar([sug({ id: "a", situacao: "descartada" }), sug({ id: "b", situacao: "adicionada" }), sug({ id: "c" })], PERFIL_PADRAO, agora);
    expect(r.map((x) => x.id)).toEqual(["c"]);
  });

  it("baixar o peso de processos reduz a nota", () => {
    const antes = repontuar([sug({})], PERFIL_PADRAO, agora)[0].resultado.nota;
    const perfil = { ...PERFIL_PADRAO, categorias: PERFIL_PADRAO.categorias.map((c) => (c.id === "processos" ? { ...c, peso: 20 } : c)) };
    const depois = repontuar([sug({})], perfil, agora)[0].resultado.nota;
    expect(depois).toBe(antes - 20);
  });

  it("nova palavra eliminatória (ex.: afirmativa) elimina a vaga", () => {
    const perfil = { ...PERFIL_PADRAO, palavrasEliminatorias: [...PERFIL_PADRAO.palavrasEliminatorias, "afirmativa"] };
    const [r] = repontuar([sug({ cargo: "Analista de Processos - Afirmativa PcD" })], perfil, agora);
    expect(r.situacao).toBe("eliminada");
    expect(r.resultado.motivoEliminacao).toBe('título com "afirmativa"');
  });

  it("vaga já eliminada sem cidade (local 'Brasil') não vira 'fora do RJ' ao recalcular", () => {
    const [r] = repontuar([sug({ situacao: "eliminada", cidade: undefined, modalidade: "desconhecida", localTexto: "Brasil" })], PERFIL_PADRAO, agora);
    expect(r.resultado.motivoEliminacao).toBeUndefined();
    expect(r.situacao).toBe("nova");
  });
});
