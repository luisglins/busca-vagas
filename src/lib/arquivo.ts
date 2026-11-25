export const LIMITE_PDF = 5 * 1024 * 1024; // 5 MB (o bucket do Supabase também barra acima disso)

/** Confere se o arquivo é um PDF de até 5 MB. Devolve a mensagem de erro ou null. */
export function validarPdf(arquivo: { name: string; type: string; size: number }): string | null {
  if (arquivo.size === 0) return "Escolha um arquivo PDF.";
  const ehPdf = arquivo.type === "application/pdf" && arquivo.name.toLowerCase().endsWith(".pdf");
  if (!ehPdf) return "Envie um arquivo PDF.";
  if (arquivo.size > LIMITE_PDF) return "O arquivo passa de 5 MB.";
  return null;
}
