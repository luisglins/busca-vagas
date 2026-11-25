import { contemPalavra, normalizarTexto } from "./texto";
import type { Area, IdCategoria, IdPenalidade, Perfil, Resultado, VagaBruta } from "./tipos";

// Região metropolitana do Rio (design, seção 7).
const CIDADES_RJ = [
  "Rio de Janeiro", "Niterói", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu", "Belford Roxo",
  "São João de Meriti", "Nilópolis", "Mesquita", "Queimados", "Japeri", "Paracambi", "Seropédica",
  "Itaguaí", "Magé", "Guapimirim", "Itaboraí", "Tanguá", "Maricá", "Rio Bonito", "Cachoeiras de Macacu",
].map(normalizarTexto);

const ESTADO_RJ = ["rio de janeiro", "rj"];

const NOME_CATEGORIA: Record<IdCategoria, string> = {
  processos: "processos",
  ia_alto: "IA aplicada",
  ia_medio: "IA implantação/avaliação",
  ia_baixo: "IA produto",
  ferramentas: "ferramentas",
  contexto: "contexto",
  nivel: "nível de entrada",
};

const NOME_PENALIDADE: Record<IdPenalidade, string> = {
  experiencia: "pede experiência",
  crea: "pede CREA",
  pleno: "nível pleno",
  ia_programacao: "exige programação",
  remoto_internacional: "remoto internacional",
};

function eliminar(motivo: string): Resultado {
  return { nota: 0, motivos: [], area: null, eliminada: true, motivoEliminacao: motivo };
}

/** Diz se a vaga é no RJ (true), fora (false) ou se não dá para saber (null). */
function ehNoRJ(vaga: VagaBruta): boolean | null {
  if (vaga.cidade) return CIDADES_RJ.includes(normalizarTexto(vaga.cidade));
  if (vaga.estado) return ESTADO_RJ.includes(normalizarTexto(vaga.estado));
  return null;
}

/**
 * Calcula a nota de aderência (0–100) de uma vaga ao perfil, com os motivos.
 * Primeiro aplica os filtros eliminatórios; depois soma categorias e subtrai penalidades.
 */
export function pontuar(vaga: VagaBruta, perfil: Perfil): Resultado {
  const titulo = normalizarTexto(vaga.cargo);
  const descricao = normalizarTexto(vaga.descricao);
  const empresa = normalizarTexto(vaga.empresa);

  // 1. Eliminatórios
  if (perfil.empresasBloqueadas.some((b) => contemPalavra(empresa, b))) {
    return eliminar("empresa bloqueada");
  }
  const nivelErrado = perfil.palavrasEliminatorias.find((p) => contemPalavra(titulo, p));
  if (nivelErrado) return eliminar(`nível: ${nivelErrado}`);
  if (vaga.modalidade === "exterior") return eliminar("fora do Brasil");

  const motivos: string[] = [];
  const remota = vaga.modalidade === "remoto" || vaga.modalidade === "remoto_internacional";
  if (!remota) {
    const noRJ = ehNoRJ(vaga);
    if (noRJ === false && !perfil.aceitarOutrasCidades) return eliminar("fora do RJ");
    if (noRJ === null) motivos.push("local não informado");
    else if (noRJ) {
      if (vaga.modalidade === "presencial") motivos.push("RJ presencial");
      else if (vaga.modalidade === "hibrido") motivos.push("RJ híbrido");
      else motivos.push("RJ");
    } else motivos.push(vaga.cidade ?? vaga.estado ?? "outra cidade");
  } else if (vaga.modalidade === "remoto") {
    motivos.push("remoto");
  }

  // 2. Categorias: peso cheio se aparece no título, metade se só na descrição
  let total = 0;
  const pontosPorCategoria: Partial<Record<IdCategoria, number>> = {};
  for (const cat of perfil.categorias) {
    let pontos = 0;
    if (cat.palavras.some((p) => contemPalavra(titulo, p))) pontos = cat.peso;
    else if (cat.palavras.some((p) => contemPalavra(descricao, p))) pontos = Math.floor(cat.peso / 2);
    if (pontos > 0) {
      pontosPorCategoria[cat.id] = pontos;
      total += pontos;
      motivos.push(`${NOME_CATEGORIA[cat.id]} (+${pontos})`);
    }
  }

  // 3. Penalidades
  for (const pen of perfil.penalidades) {
    const aplica =
      pen.id === "remoto_internacional"
        ? vaga.modalidade === "remoto_internacional"
        : pen.palavras.some((p) => contemPalavra(titulo, p) || contemPalavra(descricao, p));
    if (aplica) {
      total -= pen.valor;
      motivos.push(`${NOME_PENALIDADE[pen.id]} (−${pen.valor})`);
    }
  }

  // 4. Área: processos ou IA, a que somou mais
  const processos = pontosPorCategoria.processos ?? 0;
  const ia =
    (pontosPorCategoria.ia_alto ?? 0) + (pontosPorCategoria.ia_medio ?? 0) + (pontosPorCategoria.ia_baixo ?? 0);
  let area: Area | null = null;
  if (processos > 0 || ia > 0) area = processos >= ia ? "processos" : "ia";

  return {
    nota: Math.max(0, Math.min(100, total)),
    motivos,
    area,
    eliminada: false,
  };
}
