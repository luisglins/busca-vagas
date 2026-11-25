// Funções de texto usadas para comparar vagas e palavras-chave.

/** Minúsculas, sem acento, pontuação vira espaço, espaços colapsados. */
export function normalizarTexto(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, " ") // pontuação e quebras de linha viram espaço ("+" fica: "3+ years")
    .trim();
}

/**
 * Verdadeiro se `palavra` aparece inteira em `textoNormalizado`, aceitando plural com "s" ou "es".
 * Ex.: "ia" casa em "analista de ia", mas não em "farmacia"; "programadora" casa em "programadoras".
 */
export function contemPalavra(textoNormalizado: string, palavra: string): boolean {
  const alvo = normalizarTexto(palavra);
  if (!alvo) return false;
  const texto = ` ${textoNormalizado} `;
  return [alvo, `${alvo}s`, `${alvo}es`].some((forma) => texto.includes(` ${forma} `));
}

/** Chave para detectar a mesma vaga vinda de fontes diferentes. */
export function chaveDuplicidade(empresa: string, cargo: string, cidade?: string): string {
  // "S.A." e "sa" devem dar igual: tira pontuação sem virar espaço antes de normalizar.
  const limpa = (s: string) => normalizarTexto(s.replace(/\./g, ""));
  return [limpa(empresa), limpa(cargo), limpa(cidade ?? "")].join("|");
}
