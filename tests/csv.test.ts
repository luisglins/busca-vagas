import { describe, expect, it } from "vitest";
import { lerCsvVagas } from "@/lib/csv";

describe("lerCsvVagas", () => {
  it("lê CSV do Excel brasileiro: ponto e vírgula, BOM e data DD/MM/AAAA", () => {
    const csv = "﻿Empresa;Cargo;Link;Data;Notas\r\nLight;Analista de PCP;https://x.com/1;24/11/2026;indicação do João\r\n";
    const r = lerCsvVagas(csv);
    expect(r.erros).toEqual([]);
    expect(r.vagas).toEqual([
      { empresa: "Light", cargo: "Analista de PCP", link: "https://x.com/1", data_encontrada: "2026-11-24", notas: "indicação do João", descricao: undefined },
    ]);
  });

  it("também aceita vírgula como separador", () => {
    const r = lerCsvVagas("empresa,cargo\nStone,Analista de Processos\n");
    expect(r.vagas).toHaveLength(1);
    expect(r.vagas[0].cargo).toBe("Analista de Processos");
  });

  it("linha sem empresa vira erro com o número da linha (contando o cabeçalho)", () => {
    const r = lerCsvVagas("Empresa;Cargo\nLight;PCP\n;Analista\n");
    expect(r.vagas).toHaveLength(1);
    expect(r.erros).toEqual(["Linha 3: falta empresa"]);
  });

  it("cabeçalho em maiúsculas e com acento funciona; colunas extras são ignoradas", () => {
    const r = lerCsvVagas("EMPRESA;CARGO;DESCRIÇÃO;Salário\nVale;Trainee;Atuar com Lean;5000\n");
    expect(r.vagas[0]).toMatchObject({ empresa: "Vale", cargo: "Trainee", descricao: "Atuar com Lean" });
  });

  it("sem as colunas empresa e cargo explica o que falta", () => {
    const r = lerCsvVagas("nome;site\nA;B\n");
    expect(r.vagas).toEqual([]);
    expect(r.erros[0]).toContain("empresa");
  });

  it("data em formato inválido é ignorada (vira hoje na importação)", () => {
    const r = lerCsvVagas("empresa;cargo;data\nA;B;ontem\n");
    expect(r.vagas[0].data_encontrada).toBeUndefined();
  });
});
