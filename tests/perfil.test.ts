import { describe, expect, it } from "vitest";
import { completarPerfil, PERFIL_PADRAO } from "@/lib/perfil-padrao";
import type { Perfil } from "@/lib/tipos";

describe("completarPerfil", () => {
  it("perfil salvo antes das novidades ganha os campos e grupos que faltam, sem perder o que foi editado", () => {
    const antigo = {
      ...PERFIL_PADRAO,
      empresasBloqueadas: ["Empresa X"],
      categorias: PERFIL_PADRAO.categorias.filter((c) => c.id !== "trainee"),
    } as Partial<Perfil>;
    delete antigo.traineeQualquerCidade;
    const p = completarPerfil(antigo as Perfil);
    expect(p.empresasBloqueadas).toEqual(["Empresa X"]);
    expect(p.traineeQualquerCidade).toBe(true);
    expect(p.categorias.some((c) => c.id === "trainee")).toBe(true);
  });
});
