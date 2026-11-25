// Ajuda o botão "Salvar no meu site": separa cargo e empresa a partir do título da aba.
// Ex.: "Analista de PCP | Light | LinkedIn" → cargo "Analista de PCP", empresa "Light".

const SITES = ["linkedin", "gupy", "indeed", "glassdoor", "catho", "infojobs", "vagas com br", "vagas com", "jooble"];

export function separarTitulo(titulo: string): { cargo: string; empresa: string } {
  const partes = titulo
    .replace(/^\(\d+\)\s*/, "") // "(3) Analista..." (contador de notificações do LinkedIn)
    .split(/\s+[|·–—-]\s+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !SITES.some((s) => p.toLowerCase().replace(/\./g, " ").includes(s)));
  return { cargo: partes[0] ?? "", empresa: partes[1] ?? "" };
}
