import type { Perfil } from "./tipos";

// Perfil inicial do Luís, montado a partir do currículo e das decisões do design (seções 7 e 12b).
// Tudo aqui pode ser editado depois na tela de Configurações.
// Palavras são comparadas sem acento e sem maiúsculas, sempre inteiras.

export const PERFIL_PADRAO: Perfil = {
  termosBusca: [
    "engenharia de processos",
    "analista de processos",
    "melhoria contínua",
    "PCP",
    "trainee engenharia",
    "trainee operações",
    "engenharia de produção",
    "qualidade",
    "logística",
    "automação de processos",
    "inteligência artificial",
  ],
  // Preenchidas e conferidas na etapa dos adaptadores (Tarefa 10).
  empresasGreenhouse: [],
  empresasAshby: [],
  empresasBloqueadas: [],
  aceitarOutrasCidades: false,
  salarioMinimo: null,
  palavrasEliminatorias: [
    "estágio", "estagiário", "estagiária", "intern", "internship",
    "sênior", "senior", "sr",
    "coordenador", "coordenadora", "coordinator",
    "gerente", "manager",
    "especialista", "specialist",
    "head", "diretor", "diretora", "director", "lead",
  ],
  categorias: [
    {
      id: "processos",
      peso: 40,
      palavras: [
        "engenharia de processos", "analista de processos", "processos", "process engineer",
        "process improvement", "melhoria contínua", "continuous improvement",
        "pcp", "planejamento e controle da produção", "production planning",
        "engenharia de produção", "industrial engineering", "produção", "production",
        "qualidade", "quality", "operações", "operations", "logística", "logistics", "lean",
      ],
    },
    {
      id: "ia_alto",
      peso: 40,
      palavras: [
        "inteligência artificial", "ia", "ai", "artificial intelligence", "ia generativa", "generative ai",
        "genai", "automação", "automation", "copilot", "agentes de ia", "ai agents", "agentes",
        "no code", "low code", "nocode", "rpa", "power automate", "n8n",
      ],
    },
    {
      id: "ia_medio",
      peso: 25,
      palavras: [
        "implantação de ia", "implementação de ia", "ai implementation", "customer success",
        "solutions consultant", "consultor de ia", "ai consultant",
        "avaliação de modelos", "treinamento de modelos", "ai trainer", "anotação de dados",
        "data annotation", "rlhf",
      ],
    },
    {
      id: "ia_baixo",
      peso: 15,
      palavras: ["produto de ia", "ai product", "product operations", "product ops", "analista de produto"],
    },
    {
      id: "ferramentas",
      peso: 25,
      palavras: [
        "lean", "six sigma", "dmaic", "smed", "oee", "kaizen", "5s", "kpi", "kpis", "indicadores",
        "power bi", "sql", "python", "excel",
      ],
    },
    {
      id: "contexto",
      peso: 10,
      palavras: [
        "indústria", "industrial", "manufatura", "manufacturing", "fábrica", "injeção", "plásticos",
        "supply chain", "cadeia de suprimentos", "inglês", "english",
      ],
    },
    {
      id: "nivel",
      peso: 10,
      palavras: [
        "trainee", "júnior", "junior", "jr", "analista i", "assistente", "auxiliar",
        "entry level", "graduate", "recém formado",
      ],
    },
  ],
  penalidades: [
    {
      id: "experiencia",
      valor: 10,
      palavras: [
        "3 anos", "4 anos", "5 anos", "6 anos", "3+ years", "4+ years", "5+ years", "3 years", "5 years",
        "experiência comprovada",
      ],
    },
    { id: "crea", valor: 10, palavras: ["crea ativo", "crea"] },
    { id: "pleno", valor: 10, palavras: ["pleno", "pl", "mid level"] },
    {
      id: "ia_programacao",
      valor: 20,
      palavras: [
        "desenvolvedor", "desenvolvedora", "developer", "programador", "programadora",
        "engenheiro de software", "engenheira de software", "software engineer",
        "machine learning engineer", "ml engineer", "engenheiro de machine learning",
        "python avançado", "full stack", "fullstack", "backend", "frontend",
      ],
    },
    { id: "remoto_internacional", valor: 5, palavras: [] },
  ],
};
