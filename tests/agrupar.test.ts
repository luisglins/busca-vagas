import { describe, expect, it } from "vitest";
import { agruparSugestoes } from "@/lib/agrupar";

const s = (id: string, empresa: string, cargo: string, nota: number, local = "") => ({ id, empresa, cargo, nota, local });

describe("agruparSugestoes", () => {
  it("junta todas as vagas de trainee da mesma empresa num grupo só, com a de maior nota na frente", () => {
    const g = agruparSugestoes([
      s("1", "Programa Trainee #GrupoSolví", "Trainee | Operações – Aterro", 70, "São Carlos"),
      s("2", "Programa Trainee #GrupoSolví", "Trainee | Engenharia Produção", 77, "São Paulo"),
      s("3", "Programa Trainee #GrupoSolví", "Trainee | Operações Ambientais", 72, "Caieiras"),
      s("4", "Vale", "Trainee de Engenharia", 80, "Rio de Janeiro"),
    ]);
    expect(g).toHaveLength(2);
    const solvi = g.find((x) => x.principal.empresa.includes("Solví"))!;
    expect(solvi.principal.id).toBe("2");
    expect(solvi.membros.map((m) => m.id)).toEqual(["2", "3", "1"]);
  });

  it("vagas comuns só se juntam com o mesmo cargo (cidades diferentes)", () => {
    const g = agruparSugestoes([
      s("a", "Stefanini", "ANALISTA PROCESSOS", 72, "Rio de Janeiro"),
      s("b", "Stefanini", "Analista Processos", 70, "São Paulo"),
      s("c", "Stefanini", "Analista de Dados", 60, "Rio de Janeiro"),
    ]);
    expect(g).toHaveLength(2);
    expect(g.find((x) => x.principal.id === "a")!.membros).toHaveLength(2);
  });

  it("mantém a ordem pela melhor nota de cada grupo", () => {
    const g = agruparSugestoes([s("x", "A", "Analista", 50), s("y", "B", "Analista", 90), s("z", "A", "Analista", 95)]);
    expect(g.map((x) => x.principal.id)).toEqual(["z", "y"]);
  });
});
