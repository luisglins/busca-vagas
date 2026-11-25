import type { Fonte, Perfil, VagaBruta } from "../tipos";

/** Cada fonte de vagas implementa esta interface. */
export interface Adaptador {
  fonte: Fonte;
  buscar(perfil: Perfil, fetchFn?: typeof fetch): Promise<VagaBruta[]>;
}

const TEMPO_LIMITE_MS = 15_000;

/** GET de JSON com tempo-limite de 15 s. Lança erro se a resposta não for 2xx. */
export async function buscarJson<T>(url: string, fetchFn: typeof fetch = fetch): Promise<T> {
  const resposta = await fetchFn(url, {
    headers: { Accept: "application/json", "User-Agent": "busca-vagas (projeto pessoal)" },
    signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status} em ${url}`);
  return (await resposta.json()) as T;
}

/**
 * Roda uma requisição por item (termo ou empresa) em paralelo.
 * Itens que falham são ignorados; se TODOS falharem, lança o primeiro erro.
 */
export async function coletar<I>(itens: I[], buscarItem: (item: I) => Promise<VagaBruta[]>): Promise<VagaBruta[]> {
  if (itens.length === 0) return [];
  const resultados = await Promise.allSettled(itens.map(buscarItem));
  const ok = resultados.filter((r): r is PromiseFulfilledResult<VagaBruta[]> => r.status === "fulfilled");
  if (ok.length === 0) throw (resultados[0] as PromiseRejectedResult).reason;

  // Mesma vaga pode vir de dois termos: fica uma só.
  const vistas = new Set<string>();
  return ok
    .flatMap((r) => r.value)
    .filter((v) => (vistas.has(v.idExterno) ? false : (vistas.add(v.idExterno), true)));
}
