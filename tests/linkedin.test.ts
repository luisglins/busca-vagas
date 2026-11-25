import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { extrairVagasDoEmail } from "@/lib/fontes/linkedin-email";

const html = readFileSync("tests/fixtures/linkedin-alerta.html", "utf-8");

describe("extrairVagasDoEmail (alerta do LinkedIn)", () => {
  const vagas = extrairVagasDoEmail(html);

  it("acha uma vaga por link de vaga, sem repetir (logo e título apontam para a mesma)", () => {
    expect(vagas.map((v) => v.idExterno)).toEqual(["4087654321", "4087650000", "4087611111"]);
  });

  it("pega cargo, empresa e local", () => {
    expect(vagas[0]).toMatchObject({
      fonte: "linkedin",
      cargo: "Engenheiro de Processos Júnior",
      empresa: "Petrobras",
      cidade: "Rio de Janeiro",
      modalidade: "presencial",
    });
    expect(vagas[1]).toMatchObject({ cargo: "Trainee em Excelência Operacional 2027", empresa: "Ambev", cidade: "São Paulo", modalidade: "hibrido" });
    expect(vagas[2]).toMatchObject({ empresa: "Michelin", cidade: "Itatiaia" });
  });

  it("link limpo, sem rastreamento", () => {
    expect(vagas[0].link).toBe("https://www.linkedin.com/jobs/view/4087654321/");
  });

  it("e-mail sem vagas devolve lista vazia", () => {
    expect(extrairVagasDoEmail("<p>Olá</p>")).toEqual([]);
  });
});
