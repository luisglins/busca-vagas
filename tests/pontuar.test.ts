import { describe, expect, it } from "vitest";
import { pontuar } from "@/lib/pontuar";
import { PERFIL_PADRAO } from "@/lib/perfil-padrao";
import type { Perfil, VagaBruta } from "@/lib/tipos";

// Monta uma vaga de teste só com o que importa em cada caso.
function vaga(campos: Partial<VagaBruta>): VagaBruta {
  return {
    fonte: "gupy",
    idExterno: "1",
    empresa: "Empresa Teste",
    cargo: "Cargo",
    link: "https://exemplo.com/vaga",
    cidade: "Rio de Janeiro",
    estado: "Rio de Janeiro",
    modalidade: "presencial",
    localTexto: "Rio de Janeiro - RJ",
    descricao: "",
    ...campos,
  };
}

const perfil: Perfil = PERFIL_PADRAO;

describe("pontuar — vagas reais do teste das fontes", () => {
  it("Farmacêutico Trainee não é eliminado, mas fica na faixa cinza (área errada)", () => {
    const r = pontuar(vaga({ cargo: "Farmacêutico Trainee | Quinta D'Or", empresa: "Rede D'Or" }), perfil);
    expect(r.eliminada).toBe(false);
    expect(r.nota).toBeLessThan(40);
  });

  it("Assistente de PCP no RJ híbrido tem nota alta na área de processos", () => {
    const r = pontuar(
      vaga({ cargo: "Assistente de PCP | Operações", empresa: "AZZAS", modalidade: "hibrido" }),
      perfil,
    );
    expect(r.eliminada).toBe(false);
    expect(r.nota).toBeGreaterThanOrEqual(50);
    expect(r.area).toBe("processos");
    expect(r.motivos).toContain("processos (+40)");
    expect(r.motivos).toContain("RJ híbrido");
  });

  it("vaga sênior é eliminada pelo nível", () => {
    const r = pontuar(
      vaga({
        cargo: "Pessoa Engenheira de Inteligência Artificial (IA) - Senior",
        modalidade: "remoto",
        cidade: undefined,
        estado: undefined,
      }),
      perfil,
    );
    expect(r.eliminada).toBe(true);
    expect(r.motivoEliminacao).toBe('título com "sênior"');
  });

  it("estágio é eliminado", () => {
    const r = pontuar(
      vaga({ cargo: "Estágio em Contabilidade: Dados e Inteligência Artificial", modalidade: "remoto" }),
      perfil,
    );
    expect(r.eliminada).toBe(true);
  });

  it("vaga em inglês de melhoria contínua cai em processos", () => {
    const r = pontuar(
      vaga({ cargo: "Continuous Improvement Analyst", modalidade: "remoto", cidade: undefined, estado: undefined }),
      perfil,
    );
    expect(r.eliminada).toBe(false);
    expect(r.area).toBe("processos");
    expect(r.nota).toBeGreaterThanOrEqual(40);
  });

  it("desenvolvedor pleno de automação recebe as penalidades de programação e pleno", () => {
    const r = pontuar(
      vaga({ cargo: "Desenvolvedor de Automação de Processos Pleno | Foco em Power Apps", modalidade: "remoto" }),
      perfil,
    );
    expect(r.motivos.some((m) => m.startsWith("exige programação"))).toBe(true);
    expect(r.motivos.some((m) => m.startsWith("nível pleno"))).toBe(true);
  });
});

describe("pontuar — local", () => {
  it("presencial em São Paulo é eliminado", () => {
    const r = pontuar(vaga({ cargo: "Analista de Processos", cidade: "São Paulo", estado: "São Paulo" }), perfil);
    expect(r.eliminada).toBe(true);
    expect(r.motivoEliminacao).toBe("fora do RJ");
  });

  it("São Paulo passa quando 'aceitar outras cidades' está ligado", () => {
    const r = pontuar(vaga({ cargo: "Analista de Processos", cidade: "São Paulo", estado: "São Paulo" }), {
      ...perfil,
      aceitarOutrasCidades: true,
    });
    expect(r.eliminada).toBe(false);
  });

  it("Itaguaí (região metropolitana) não é eliminado", () => {
    const r = pontuar(vaga({ cargo: "Analista de Processos", cidade: "Itaguaí" }), perfil);
    expect(r.eliminada).toBe(false);
  });

  it("remoto só para outro país é eliminado", () => {
    const r = pontuar(vaga({ cargo: "Operations Analyst", modalidade: "exterior" }), perfil);
    expect(r.eliminada).toBe(true);
  });

  it("remoto internacional perde 5 pontos e avisa", () => {
    const r = pontuar(vaga({ cargo: "Operations Analyst", modalidade: "remoto_internacional" }), perfil);
    expect(r.eliminada).toBe(false);
    expect(r.motivos).toContain("remoto internacional (−5)");
  });

  it("local desconhecido não elimina e avisa", () => {
    const r = pontuar(
      vaga({ cargo: "Analista de Processos", modalidade: "desconhecida", cidade: undefined, estado: undefined, localTexto: "" }),
      perfil,
    );
    expect(r.eliminada).toBe(false);
    expect(r.motivos).toContain("local não informado");
  });
});

describe("pontuar — regras gerais", () => {
  it("empresa bloqueada é eliminada", () => {
    const r = pontuar(vaga({ cargo: "Analista de PCP I", empresa: "Light" }), {
      ...perfil,
      empresasBloqueadas: ["Light"],
    });
    expect(r.eliminada).toBe(true);
    expect(r.motivoEliminacao).toBe("empresa bloqueada");
  });

  it("palavra só na descrição vale metade do peso", () => {
    const r = pontuar(
      vaga({ cargo: "Analista Júnior", descricao: "Atuar com melhoria contínua na fábrica." }),
      perfil,
    );
    expect(r.motivos).toContain("processos (+20)");
  });

  it("acentos e maiúsculas não atrapalham", () => {
    const a = pontuar(vaga({ cargo: "ANALISTA DE MELHORIA CONTINUA" }), perfil);
    const b = pontuar(vaga({ cargo: "Analista de Melhoria Contínua" }), perfil);
    expect(a.nota).toBe(b.nota);
    expect(a.area).toBe("processos");
  });

  it("vaga sem nada a ver tem área nula e nota 0", () => {
    const r = pontuar(vaga({ cargo: "Motorista de caminhão" }), perfil);
    expect(r.area).toBeNull();
    expect(r.nota).toBe(0);
  });

  it("a nota nunca sai de 0 a 100", () => {
    const cheia = pontuar(
      vaga({
        cargo: "Trainee de Engenharia de Processos e Automação com IA",
        descricao:
          "Lean, Six Sigma, SMED, OEE, Power BI, SQL, Python, Excel, indústria, supply chain, inglês, implantação de IA, avaliação de modelos, produto de IA",
      }),
      perfil,
    );
    expect(cheia.nota).toBeLessThanOrEqual(100);

    const vazia = pontuar(
      vaga({
        cargo: "Desenvolvedor Pleno",
        descricao: "Experiência de 5 anos, CREA ativo, desenvolvedor",
        modalidade: "remoto_internacional",
      }),
      perfil,
    );
    expect(vazia.nota).toBe(0);
  });

  it("plural também conta: Programadoras recebe a penalidade de programação", () => {
    const r = pontuar(vaga({ cargo: "Mulheres Programadoras - Automação de Processos", modalidade: "remoto" }), perfil);
    expect(r.motivos.some((m) => m.startsWith("exige programação"))).toBe(true);
  });

  it("vaga de auxiliar é eliminada", () => {
    const r = pontuar(vaga({ cargo: "Auxiliar de Produção" }), perfil);
    expect(r.eliminada).toBe(true);
  });
});

describe("pontuar — trainee", () => {
  it("trainee em São Paulo não é eliminado e avisa a cidade", () => {
    const r = pontuar(vaga({ cargo: "Programa de Trainee 2027 - Engenharia", cidade: "São Paulo", estado: "São Paulo" }), perfil);
    expect(r.eliminada).toBe(false);
    expect(r.motivos).toContain("trainee em São Paulo");
  });
  it("trainee recebe pontos do grupo trainee", () => {
    const r = pontuar(vaga({ cargo: "Trainee de Operações" }), perfil);
    expect(r.motivos.some((m) => m.startsWith("trainee (+"))).toBe(true);
  });
  it("com a opção desligada, trainee fora do RJ volta a ser eliminado", () => {
    const r = pontuar(vaga({ cargo: "Trainee de Operações", cidade: "Curitiba" }), { ...perfil, traineeQualquerCidade: false });
    expect(r.eliminada).toBe(true);
  });
});

describe("pontuar — vagas do LinkedIn (só o nome da vaga)", () => {
  it("a nota é ampliada porque só o título conta (sem descrição)", () => {
    const r = pontuar(vaga({ fonte: "linkedin", cargo: "Engenheiro de Produção Júnior", descricao: "" }), perfil);
    expect(r.nota).toBe(80); // processos 40 + nível 10 = 50, × 1,6
    expect(r.motivos).toContain("nota pelo nome da vaga");
  });
  it("título fora da área continua baixo", () => {
    const r = pontuar(vaga({ fonte: "linkedin", cargo: "Assistente de Crewing", descricao: "" }), perfil);
    expect(r.nota).toBeLessThan(40);
  });
  it("nunca passa de 100", () => {
    const r = pontuar(vaga({ fonte: "linkedin", cargo: "Trainee de Engenharia de Processos com IA e Power BI", descricao: "" }), perfil);
    expect(r.nota).toBe(100);
  });
});
