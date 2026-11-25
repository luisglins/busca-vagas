import { contemPalavra, normalizarTexto } from "./texto";
import type { Perfil } from "./tipos";

// Indica o currículo mais aderente a uma vaga, sem IA: compara as palavras-chave do perfil
// que aparecem na vaga com as que aparecem no texto de cada currículo.

export interface AderenciaCurriculo {
  id: string;
  nome: string;
  /** % das palavras-chave da vaga que aparecem no currículo (0–100) */
  cobertura: number;
  encontradas: string[];
  faltando: string[];
}

/** Palavras-chave do perfil que aparecem no título ou na descrição da vaga (sem as de nível). */
export function palavrasDaVaga(vaga: { cargo: string; descricao: string | null }, perfil: Perfil): string[] {
  const texto = normalizarTexto(`${vaga.cargo} ${vaga.descricao ?? ""}`);
  const vistas = new Set<string>();
  const palavras: string[] = [];
  for (const categoria of perfil.categorias) {
    if (categoria.id === "nivel") continue; // "trainee", "júnior" não são competências
    for (const p of categoria.palavras) {
      const chave = normalizarTexto(p);
      if (!chave || vistas.has(chave) || !contemPalavra(texto, p)) continue;
      vistas.add(chave);
      palavras.push(p);
    }
  }
  // "ai" dentro de "ai agents", "processos" dentro de "analista de processos": fica só a expressão maior.
  const normal = palavras.map((p) => ` ${normalizarTexto(p)} `);
  return palavras.filter((_, i) => !normal.some((outra, j) => j !== i && outra.length > normal[i].length && outra.includes(normal[i])));
}

/** Compara cada currículo (que tenha texto) com a vaga; o mais aderente vem primeiro. */
export function compararCurriculos(
  curriculos: { id: string; nome: string; texto: string | null }[],
  vaga: { cargo: string; descricao: string | null },
  perfil: Perfil,
): AderenciaCurriculo[] {
  const palavras = palavrasDaVaga(vaga, perfil);
  if (palavras.length === 0) return [];

  return curriculos
    .filter((c): c is { id: string; nome: string; texto: string } => Boolean(c.texto))
    .map((c) => {
      const texto = normalizarTexto(c.texto);
      const encontradas = palavras.filter((p) => contemPalavra(texto, p));
      return {
        id: c.id,
        nome: c.nome,
        cobertura: Math.round((encontradas.length / palavras.length) * 100),
        encontradas,
        faltando: palavras.filter((p) => !encontradas.includes(p)),
      };
    })
    .sort((a, b) => b.cobertura - a.cobertura);
}
