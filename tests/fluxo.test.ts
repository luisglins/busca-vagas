import { describe, expect, it } from "vitest";
import { calcularFluxo } from "@/lib/fluxo";

// Cada vaga: status atual + todos os status pelos quais passou (histórico).
describe("calcularFluxo", () => {
  const vagas = [
    { status: "interessado", passou: ["interessado"] },
    { status: "interessado", passou: ["interessado"] },
    { status: "apliquei", passou: ["interessado", "apliquei"] },
    { status: "entrevista", passou: ["interessado", "apliquei", "entrevista"] },
    { status: "recusado", passou: ["interessado", "apliquei", "entrevista", "recusado"] },
    { status: "recusado", passou: ["interessado", "recusado"] },
  ] as const;

  const f = calcularFluxo(vagas.map((v) => ({ status: v.status, passou: [...v.passou] })));

  it("conta quantas estão hoje em cada etapa", () => {
    expect(f.etapas.map((e) => e.agora)).toEqual([2, 1, 1, 0]);
  });
  it("conta quantas chegaram pelo menos até cada etapa", () => {
    expect(f.etapas.map((e) => e.chegaram)).toEqual([6, 3, 2, 0]);
  });
  it("taxa de passagem entre etapas, em %", () => {
    expect(f.passagens).toEqual([50, 67, 0]);
  });
  it("recusadas por etapa em que pararam", () => {
    expect(f.recusadas).toEqual({ total: 2, porEtapa: { interessado: 1, apliquei: 0, entrevista: 1 } });
  });
  it("sem vagas, taxas ficam nulas em vez de dividir por zero", () => {
    expect(calcularFluxo([]).passagens).toEqual([null, null, null]);
  });
});
