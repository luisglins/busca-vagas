import { describe, expect, it } from "vitest";
import { composicaoDaNota, marcarPalavras, separarSecoes } from "@/lib/descricao";

describe("separarSecoes", () => {
  it("reconhece títulos de seção comuns e agrupa os itens", () => {
    const texto = [
      "Sobre a empresa",
      "Somos uma indústria de plásticos.",
      "Responsabilidades e atribuições",
      "- Acompanhar a produção",
      "- Atualizar indicadores",
      "Requisitos e qualificações",
      "Excel avançado",
    ].join("\n");
    const s = separarSecoes(texto);
    expect(s.map((x) => x.titulo)).toEqual(["Sobre a empresa", "Responsabilidades e atribuições", "Requisitos e qualificações"]);
    expect(s[1].itens).toEqual(["Acompanhar a produção", "Atualizar indicadores"]);
    expect(s[2].tipo).toBe("requisitos");
    expect(s[1].tipo).toBe("atividades");
  });
  it("texto sem títulos vira uma seção só", () => {
    const s = separarSecoes("Linha 1\nLinha 2");
    expect(s).toHaveLength(1);
    expect(s[0].titulo).toBeNull();
    expect(s[0].itens).toEqual(["Linha 1", "Linha 2"]);
  });
  it("entende títulos em inglês", () => {
    const s = separarSecoes("What you'll do\nBuild things\nRequirements\nEnglish");
    expect(s.map((x) => x.tipo)).toEqual(["atividades", "requisitos"]);
  });
  it("separa título colado no texto (comum na Gupy)", () => {
    const s = separarSecoes("Responsabilidades e atribuiçõesO QUE VOCÊ VAI FAZER\nAcompanhar o PCP");
    expect(s[0].tipo).toBe("atividades");
  });
});

describe("marcarPalavras", () => {
  it("marca palavras do perfil ignorando acento e maiúsculas, preservando o texto original", () => {
    const partes = marcarPalavras("Conhecimento de PCP e Melhoria Contínua no Excel", ["pcp", "melhoria continua", "excel"]);
    expect(partes.filter((p) => p.marcado).map((p) => p.texto)).toEqual(["PCP", "Melhoria Contínua", "Excel"]);
    expect(partes.map((p) => p.texto).join("")).toBe("Conhecimento de PCP e Melhoria Contínua no Excel");
  });
  it("não marca pedaço de palavra", () => {
    const partes = marcarPalavras("farmácia", ["ia"]);
    expect(partes.some((p) => p.marcado)).toBe(false);
  });
});

describe("composicaoDaNota", () => {
  it("lê os motivos e separa positivos, negativos e o resto", () => {
    const c = composicaoDaNota(["RJ híbrido", "processos (+40)", "ferramentas (+12)", "pede experiência (−10)"]);
    expect(c.positivos).toEqual([
      { nome: "processos", pontos: 40 },
      { nome: "ferramentas", pontos: 12 },
    ]);
    expect(c.negativos).toEqual([{ nome: "pede experiência", pontos: 10 }]);
    expect(c.outros).toEqual(["RJ híbrido"]);
  });
});
