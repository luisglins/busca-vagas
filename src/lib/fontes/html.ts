const ENTIDADES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'",
};

function decodificar(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z0-9#]+);/gi, (m, nome) => ENTIDADES[nome.toLowerCase()] ?? m);
}

/**
 * HTML de descrição de vaga → texto simples.
 * Títulos e parágrafos viram linhas; itens de lista viram "- item".
 * Aceita HTML "escapado" (&lt;p&gt;), como o Greenhouse manda.
 */
export function htmlParaTexto(html: string): string {
  let s = html;
  if (/&lt;\/?[a-z]/i.test(s)) s = decodificar(s); // primeiro desfaz o escape do Greenhouse
  s = s
    .replace(/<\s*li[^>]*>/gi, "\n- ")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|h[1-6]|li|ul|ol|tr|section)\s*>/gi, "\n")
    .replace(/<\s*(p|div|h[1-6]|ul|ol|tr|section)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  s = decodificar(s);
  return s
    .split("\n")
    .map((linha) => linha.replace(/\s+/g, " ").trim())
    .filter((linha) => linha !== "" && linha !== "-")
    .join("\n");
}
