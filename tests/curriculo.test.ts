import { describe, expect, it } from "vitest";
import { compararCurriculos, palavrasDaVaga } from "@/lib/curriculo";
import { PERFIL_PADRAO } from "@/lib/perfil-padrao";

const vaga = {
  cargo: "Analista de PCP Jr",
  descricao: "Requisitos: Excel avançado, Power BI e SQL. Desejável: Lean e inglês.",
};

describe("palavrasDaVaga", () => {
  it("pega as palavras do perfil que aparecem na vaga, sem repetir e sem as de nível", () => {
    const p = palavrasDaVaga(vaga, PERFIL_PADRAO);
    expect(p).toEqual(expect.arrayContaining(["pcp", "excel", "power bi", "sql", "lean", "inglês"]));
    expect(p).not.toContain("jr"); // nível não é competência
    expect(new Set(p).size).toBe(p.length);
  });
  it("não conta a palavra curta quando a expressão maior já está na lista", () => {
    const p = palavrasDaVaga({ cargo: "AI Operations", descricao: "Build AI agents for clients" }, PERFIL_PADRAO);
    expect(p).toContain("ai agents");
    expect(p).not.toContain("ai");
  });
});

describe("compararCurriculos", () => {
  const cvs = [
    { id: "a", nome: "Qualidade v1", texto: "Controle de qualidade, Excel intermediário." },
    { id: "b", nome: "Processos v3", texto: "PCP, Lean, SMED, OEE, Power BI, SQL, Python, Excel avançado. Inglês avançado." },
    { id: "c", nome: "Sem texto", texto: null },
  ];

  it("ordena do mais aderente para o menos e ignora quem não tem texto", () => {
    const r = compararCurriculos(cvs, vaga, PERFIL_PADRAO);
    expect(r.map((x) => x.id)).toEqual(["b", "a"]);
    expect(r[0].cobertura).toBe(100);
    expect(r[0].faltando).toEqual([]);
  });

  it("lista as palavras que faltam no currículo", () => {
    const [, qualidade] = compararCurriculos(cvs, vaga, PERFIL_PADRAO);
    expect(qualidade.encontradas).toEqual(["excel"]);
    expect(qualidade.faltando).toEqual(expect.arrayContaining(["pcp", "power bi", "sql"]));
    expect(qualidade.cobertura).toBe(Math.round((1 / 6) * 100));
  });

  it("vaga sem nenhuma palavra do perfil não gera comparação", () => {
    expect(compararCurriculos(cvs, { cargo: "Motorista", descricao: "CNH D" }, PERFIL_PADRAO)).toEqual([]);
  });
});
