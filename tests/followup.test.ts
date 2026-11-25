import { describe, expect, it } from "vitest";
import { followupsDaSemana, hojeEmSaoPaulo, proximoFollowup } from "@/lib/followup";

describe("proximoFollowup", () => {
  it("apliquei: 7 dias depois", () => {
    expect(proximoFollowup("apliquei", "2026-11-24")).toBe("2026-12-01");
  });
  it("entrevista: 3 dias depois", () => {
    expect(proximoFollowup("entrevista", "2026-11-24")).toBe("2026-11-27");
  });
  it("recusado, oferta e interessado: sem follow-up", () => {
    expect(proximoFollowup("recusado", "2026-11-24")).toBeNull();
    expect(proximoFollowup("oferta", "2026-11-24")).toBeNull();
    expect(proximoFollowup("interessado", "2026-11-24")).toBeNull();
    expect(proximoFollowup("encerrada", "2026-11-24")).toBeNull();
  });
  it("vira o mês e o ano certo", () => {
    expect(proximoFollowup("apliquei", "2026-12-28")).toBe("2027-01-04");
  });
});

describe("followupsDaSemana", () => {
  const vagas = [
    { id: "atrasado", proximo_followup: "2026-11-20" },
    { id: "domingo", proximo_followup: "2026-11-29" },
    { id: "segunda", proximo_followup: "2026-11-30" },
    { id: "sem", proximo_followup: null },
  ];

  it("numa terça inclui atrasados e até o domingo", () => {
    const ids = followupsDaSemana(vagas, "2026-11-24").map((v) => v.id);
    expect(ids).toEqual(["atrasado", "domingo"]);
  });
  it("no próprio domingo inclui o dia", () => {
    const ids = followupsDaSemana(vagas, "2026-11-29").map((v) => v.id);
    expect(ids).toContain("domingo");
    expect(ids).not.toContain("segunda");
  });
  it("ordena do mais antigo para o mais novo", () => {
    const ids = followupsDaSemana([...vagas].reverse(), "2026-11-24").map((v) => v.id);
    expect(ids).toEqual(["atrasado", "domingo"]);
  });
});

describe("hojeEmSaoPaulo", () => {
  it("usa o fuso de São Paulo, não o UTC", () => {
    // 02:00 UTC do dia 25 ainda é dia 24 em São Paulo (UTC-3)
    expect(hojeEmSaoPaulo(new Date("2026-11-25T02:00:00Z"))).toBe("2026-11-24");
  });
});
