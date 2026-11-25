import { normalizarTexto } from "./texto";

// Ajudantes do "Veja mais": separar a descrição em seções, marcar palavras do perfil
// e ler a composição da nota a partir dos motivos.

export type TipoSecao = "sobre" | "atividades" | "requisitos" | "diferenciais" | "beneficios" | "outro";

export interface Secao {
  titulo: string | null;
  tipo: TipoSecao;
  itens: string[];
}

// Títulos de seção vistos em anúncios reais (Gupy, Greenhouse, Ashby), já sem acento e minúsculos.
const TITULOS: Record<TipoSecao, string[]> = {
  atividades: [
    "responsabilidades", "suas responsabilidades", "atribuicoes", "atividades", "o que voce vai fazer", "o que voce fara",
    "seus desafios", "desafios", "sobre o desafio", "sobre a area e o desafio", "dia a dia", "no dia a dia", "no seu dia a dia",
    "como sera o seu dia a dia", "como sera seu dia a dia", "seu impacto", "a oportunidade", "oportunidade",
    "what you ll do", "what you will do", "what you will work on", "responsibilities", "responsabilities", "your role",
    "in this role", "the role", "about the role", "role overview", "the opportunity", "your impact", "job description",
    "position technical challenges", "here s what you can expect",
  ],
  requisitos: [
    "requisitos", "requisitos e qualificacoes", "qualificacoes", "o que buscamos", "o que estamos buscando",
    "o que esperamos", "o que esperamos de voce", "quem e voce", "pre requisitos", "obrigatorios", "hard skills",
    "competencias", "requirements", "qualifications", "basic qualifications", "additional requirements",
    "what we re looking for", "what we are looking for", "what you bring", "what you have", "who you are",
    "about you", "you have", "you might thrive", "this role may fit if you have",
  ],
  diferenciais: [
    "diferenciais", "desejavel", "sera um diferencial", "voce sera um diferencial", "o que aumenta as suas chances",
    "o que aumenta suas chances", "o que aumentam suas chances", "opcionais", "nice to have", "nice to haves",
    "bonus", "bonus points", "preferred", "preferred skills", "you ll stand out",
  ],
  beneficios: [
    "beneficios", "nossos beneficios", "o que oferecemos", "nosso pacote", "benefits", "our benefits", "perks",
    "what we offer",
  ],
  sobre: ["sobre", "quem somos", "conheca a gente", "about", "get to know us", "why"],
  outro: [
    "informacoes adicionais", "additional information", "etapas do processo", "como e nosso processo", "localizacao",
    "location", "modelo de trabalho", "jornada de trabalho", "importante", "important", "privacidade", "privacy",
    "diversidade", "diversity", "soft skills", "how we work", "growth potential",
  ],
};

function tipoDoTitulo(linha: string): TipoSecao | null {
  if (linha.length > 60 || linha.startsWith("-")) return null;
  const n = normalizarTexto(linha);
  for (const [tipo, chaves] of Object.entries(TITULOS)) {
    if (chaves.some((c) => n === c || n.startsWith(`${c} `))) return tipo as TipoSecao;
  }
  return null;
}

/** Quebra a descrição em seções pelos títulos conhecidos (PT e EN). */
export function separarSecoes(texto: string): Secao[] {
  const linhas = texto
    // Gupy às vezes cola títulos: "atribuiçõesO QUE VOCÊ" → quebra antes das maiúsculas.
    .replace(/([a-zà-ÿ])([A-ZÀ-Ý]{2,})/g, "$1\n$2")
    // ...ou colados num item numerado ("atribuições1-Elaborar") ou num título ("adicionaisDiferenciais").
    .replace(/([a-zà-ÿ])(\d+\s*[-.)])/g, "$1\n$2")
    .replace(/([a-zà-ÿ])(Diferenciais|Requisitos|Responsabilidades|Benefícios|Informações|Qualificações)/g, "$1\n$2")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const secoes: Secao[] = [];
  let atual: Secao | null = null;
  for (const linha of linhas) {
    const tipo = tipoDoTitulo(linha);
    if (tipo) {
      // Dois títulos seguidos do mesmo tipo (ex.: "Responsabilidades" + "O QUE VOCÊ VAI FAZER") viram um só.
      if (atual && atual.titulo && atual.itens.length === 0 && atual.tipo === tipo) continue;
      atual = { titulo: linha.replace(/:$/, ""), tipo, itens: [] };
      secoes.push(atual);
      continue;
    }
    if (!atual) {
      atual = { titulo: null, tipo: "outro", itens: [] };
      secoes.push(atual);
    }
    atual.itens.push(linha.replace(/^[-•*·]\s*/, ""));
  }
  return secoes;
}

export interface Parte {
  texto: string;
  marcado: boolean;
}

/** Divide o texto em partes, marcando as palavras/expressões do perfil (sem ligar para acento). */
export function marcarPalavras(texto: string, palavras: string[]): Parte[] {
  const pedacos = texto.match(/[\p{L}\p{N}+]+|[^\p{L}\p{N}+]+/gu) ?? [];
  const ehPalavra = pedacos.map((p) => /[\p{L}\p{N}]/u.test(p));
  const norm = pedacos.map((p, i) => (ehPalavra[i] ? normalizarTexto(p) : ""));
  const frases = [...new Set(palavras.map((p) => normalizarTexto(p)).filter(Boolean))]
    .map((f) => f.split(" "))
    .sort((a, b) => b.length - a.length); // tenta as expressões mais longas primeiro

  const marcado = new Array(pedacos.length).fill(false);
  for (let i = 0; i < pedacos.length; i++) {
    if (!ehPalavra[i] || marcado[i]) continue;
    for (const frase of frases) {
      let j = i;
      let k = 0;
      const indices: number[] = [];
      while (j < pedacos.length && k < frase.length) {
        if (ehPalavra[j]) {
          const w = frase[k];
          const ultima = k === frase.length - 1;
          if (norm[j] !== w && !(ultima && (norm[j] === `${w}s` || norm[j] === `${w}es`))) break;
          indices.push(j);
          k++;
        } else if (k === 0) break;
        j++;
      }
      if (k === frase.length) {
        for (let x = indices[0]; x <= indices[indices.length - 1]; x++) marcado[x] = true;
        break;
      }
    }
  }

  const partes: Parte[] = [];
  pedacos.forEach((p, i) => {
    const ultima = partes[partes.length - 1];
    if (ultima && ultima.marcado === marcado[i]) ultima.texto += p;
    else partes.push({ texto: p, marcado: marcado[i] });
  });
  return partes;
}

export interface Composicao {
  positivos: { nome: string; pontos: number }[];
  negativos: { nome: string; pontos: number }[];
  outros: string[];
}

/** Lê "processos (+40)" e "pede experiência (−10)" dos motivos da nota. */
export function composicaoDaNota(motivos: string[]): Composicao {
  const c: Composicao = { positivos: [], negativos: [], outros: [] };
  for (const m of motivos) {
    const mais = m.match(/^(.*) \(\+(\d+)\)$/);
    const menos = m.match(/^(.*) \(−(\d+)\)$/);
    if (mais) c.positivos.push({ nome: mais[1], pontos: Number(mais[2]) });
    else if (menos) c.negativos.push({ nome: menos[1], pontos: Number(menos[2]) });
    else c.outros.push(m);
  }
  return c;
}
