import { describe, expect, it } from "vitest";
import { separarTitulo } from "@/lib/pagina";

describe("separarTitulo", () => {
  it("título do LinkedIn", () => {
    expect(separarTitulo("Analista de PCP | Light | LinkedIn")).toEqual({ cargo: "Analista de PCP", empresa: "Light" });
  });
  it("tira o contador de notificações", () => {
    expect(separarTitulo("(3) Trainee 2027 | Vale | LinkedIn").cargo).toBe("Trainee 2027");
  });
  it("título sem separador vira só o cargo", () => {
    expect(separarTitulo("Engenheiro de Processos Jr")).toEqual({ cargo: "Engenheiro de Processos Jr", empresa: "" });
  });
  it("não confunde hífen dentro do nome do cargo", () => {
    expect(separarTitulo("Analista de Pós-Venda - Stone - Gupy")).toEqual({ cargo: "Analista de Pós-Venda", empresa: "Stone" });
  });
});
