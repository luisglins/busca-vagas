import { contemPalavra, normalizarTexto } from "../texto";
import type { Modalidade } from "../tipos";

const REMOTO = ["remote", "remoto", "home office", "anywhere", "100 remoto"];
const BRASIL = ["brazil", "brasil", "br"];
const INTERNACIONAL = ["latam", "latin america", "america latina", "americas", "worldwide", "global", "anywhere"];
const OUTRO_PAIS = [
  "us", "usa", "united states", "eua", "canada", "mexico", "argentina", "chile", "colombia", "peru", "uruguay",
  "europe", "emea", "uk", "united kingdom", "england", "ireland", "germany", "france", "spain", "portugal",
  "netherlands", "switzerland", "india", "japan", "singapore", "korea", "australia", "apac",
  "san francisco", "new york", "seattle", "london", "dublin", "paris", "tokyo", "toronto", "california",
];

/** Verdadeiro se o texto aponta um país que não é o Brasil (ex.: "Mexico City, Mexico"). */
export function foraDoBrasil(texto: string): boolean {
  const t = normalizarTexto(texto);
  const tem = (lista: string[]) => lista.some((p) => contemPalavra(t, p));
  return tem(OUTRO_PAIS) && !tem(BRASIL);
}

/**
 * Descobre a modalidade a partir do texto de local (ex.: "Remote - LatAm", "Rio de Janeiro (Híbrido)").
 * "exterior" = vaga fora do Brasil (presencial ou remota só para outro país).
 */
export function modalidadePorTexto(texto: string): Modalidade {
  const t = normalizarTexto(texto);
  const tem = (lista: string[]) => lista.some((p) => contemPalavra(t, p));
  if (tem(REMOTO)) {
    if (tem(BRASIL)) return "remoto";
    if (tem(INTERNACIONAL)) return "remoto_internacional";
    if (tem(OUTRO_PAIS)) return "exterior";
    return "remoto";
  }
  if (foraDoBrasil(texto)) return "exterior";
  if (tem(["hibrido", "hybrid"])) return "hibrido";
  if (tem(["presencial", "on site", "onsite", "in office"])) return "presencial";
  return "desconhecida";
}

/**
 * Cidade a partir de "São Paulo, São Paulo, Brazil" → "São Paulo".
 * Só o país do Brasil ("Brasil") não diz a cidade → undefined.
 * Outro país sozinho ("Argentina") vira a "cidade", para cair no filtro "fora do RJ".
 */
export function cidadePorTexto(texto: string): string | undefined {
  const primeira = texto.split(/[,|(\-–]/)[0].trim();
  if (!primeira) return undefined;
  const n = normalizarTexto(primeira);
  if (BRASIL.includes(n) || REMOTO.some((r) => n.includes(r))) return undefined;
  return primeira;
}
