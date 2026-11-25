import type { Perfil } from "./tipos";

// Perfil inicial do Luís, montado a partir do currículo e das decisões do design (seções 7 e 12b).
// Tudo aqui pode ser editado depois na tela de Configurações.
// Palavras são comparadas sem acento e sem maiúsculas, sempre inteiras.

export const PERFIL_PADRAO: Perfil = {
  termosBusca: [
    "trainee",
    "programa de trainee",
    "trainee engenharia",
    "trainee operações",
    "engenharia de processos",
    "engenheiro de processos júnior",
    "analista de processos",
    "analista de melhoria contínua",
    "excelência operacional",
    "PCP",
    "planejamento de produção",
    "engenharia de produção",
    "analista de operações",
    "analista de qualidade",
    "analista de planejamento",
    "supply chain",
    "logística",
    "analista de dados júnior",
    "business intelligence",
    "automação de processos",
    "inteligência artificial",
  ],
  // Conferidas em 25/11/2026: empresas com vagas no Brasil nessas plataformas (BTG tem sede no Rio).
  empresasGreenhouse: [
    "stone", "quintoandar", "vtex", "ebanx", "wildlifestudios", "gympass",
    "btgpactual", "c6bank", "xpinc", "inter", "getnet", "clara",
  ],
  // Ashby: empresas de IA com vagas no Brasil / América Latina.
  empresasAshby: ["openai", "elevenlabs", "harvey", "cursor", "decagon"],
  empresasBloqueadas: [],
  aceitarOutrasCidades: false,
  traineeQualquerCidade: true,
  salarioMinimo: null,
  palavrasEliminatorias: [
    "estágio", "estagiário", "estagiária", "intern", "internship", "auxiliar",
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
        "trainee", "júnior", "junior", "jr", "analista i", "assistente",
        "entry level", "graduate", "recém formado",
      ],
    },
    {
      // Foco do Luís em programas de trainee: soma além do "nível de entrada".
      id: "trainee",
      peso: 15,
      palavras: ["trainee", "programa de trainee", "graduate program"],
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

/**
 * Perfil salvo antes de uma novidade pode não ter os campos/grupos novos.
 * Completa com o padrão, sem mexer no que o Luís já editou.
 */
export function completarPerfil(salvo: Perfil): Perfil {
  const categorias = [...salvo.categorias];
  for (const c of PERFIL_PADRAO.categorias) if (!categorias.some((x) => x.id === c.id)) categorias.push(c);
  const penalidades = [...salvo.penalidades];
  for (const p of PERFIL_PADRAO.penalidades) if (!penalidades.some((x) => x.id === p.id)) penalidades.push(p);
  return { ...PERFIL_PADRAO, ...salvo, categorias, penalidades };
}
