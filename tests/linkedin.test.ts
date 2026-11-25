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

describe("extrairVagasDoTexto (texto de alertas reais do LinkedIn, anonimizado)", async () => {
  const { extrairVagasDoTexto } = await import("@/lib/fontes/linkedin-email");
  const texto = readFileSync("tests/fixtures/linkedin-alerta.txt", "utf-8");
  const vagas = extrairVagasDoTexto(texto);

  it("uma vaga por 'Visualizar vaga', sem repetir a que aparece em duas seções", () => {
    expect(vagas.map((v) => v.idExterno)).toEqual(["4494053448", "4494030900", "4493668692", "4492623551", "4454108472"]);
  });

  it("cargo, empresa e local certos, ignorando conexões e ex-alunos", () => {
    expect(vagas[0]).toMatchObject({ cargo: "Assistente Administrativo - Oficina Pneumática", empresa: "MetrôRio", cidade: "Rio de Janeiro" });
    expect(vagas[1]).toMatchObject({ cargo: "Assistente de Logística - Blume Alimentos", empresa: "Blume Alimentos" });
  });

  it("títulos de seção não viram cargo e o salário é guardado", () => {
    expect(vagas[2]).toMatchObject({ cargo: "Auxiliar de Escritório", empresa: "TRB - Transporte & Logística", salario: "R$ 1,9 mil-R$ 2 mil por mês" });
    expect(vagas[3]).toMatchObject({ cargo: "Assistente técnico de impressoras", empresa: "Alta Impressão" });
  });

  it("local só 'Brasil' fica sem cidade", () => {
    expect(vagas[4]).toMatchObject({ empresa: "TPF Engenharia", localTexto: "Brasil" });
    expect(vagas[4].cidade).toBeUndefined();
  });

  it("link limpo", () => {
    expect(vagas[0].link).toBe("https://www.linkedin.com/jobs/view/4494053448/");
  });
});
