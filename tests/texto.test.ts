import { describe, expect, it } from "vitest";
import { chaveDuplicidade, contemPalavra, normalizarTexto } from "@/lib/texto";

describe("normalizarTexto", () => {
  it("tira acentos, maiúsculas e pontuação", () => {
    expect(normalizarTexto("MELHORIA CONTÍNUA!")).toBe("melhoria continua");
  });
  it("junta espaços repetidos", () => {
    expect(normalizarTexto("  Analista   de\nPCP  ")).toBe("analista de pcp");
  });
});

describe("contemPalavra", () => {
  it("acha a palavra ignorando maiúsculas", () => {
    expect(contemPalavra("analista de pcp", "PCP")).toBe(true);
  });
  it("não acha dentro de outra palavra", () => {
    expect(contemPalavra("pcpx sistema", "pcp")).toBe(false);
  });
  it("palavras curtas como IA só casam inteiras", () => {
    expect(contemPalavra("analista de ia", "IA")).toBe(true);
    expect(contemPalavra("farmacia", "ia")).toBe(false);
  });
  it("aceita expressão com acento", () => {
    expect(contemPalavra("vaga de melhoria continua", "melhoria contínua")).toBe(true);
  });
});

describe("chaveDuplicidade", () => {
  it("ignora pontuação, acentos e maiúsculas", () => {
    expect(chaveDuplicidade("Light S.A.", "Analista de PCP I", "Rio de Janeiro")).toBe(
      chaveDuplicidade("light sa", "analista de pcp i", "rio de janeiro"),
    );
  });
  it("cidades diferentes geram chaves diferentes", () => {
    expect(chaveDuplicidade("Light", "Analista", "Niterói")).not.toBe(
      chaveDuplicidade("Light", "Analista", "Rio de Janeiro"),
    );
  });
});
