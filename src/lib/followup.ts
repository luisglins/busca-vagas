import type { Status } from "./tipos";

// Datas no formato AAAA-MM-DD, sempre no fuso de São Paulo (design, seção 9).

const DIAS_ATE_FOLLOWUP: Partial<Record<Status, number>> = {
  apliquei: 7,
  entrevista: 3,
};

/** Soma dias a uma data AAAA-MM-DD sem cair em problemas de fuso. */
export function somarDias(data: string, dias: number): string {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Data de hoje em São Paulo, no formato AAAA-MM-DD. */
export function hojeEmSaoPaulo(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);
}

/** Quando fazer o próximo follow-up ao entrar em um status (ou null se não precisa). */
export function proximoFollowup(status: Status, hoje: string): string | null {
  const dias = DIAS_ATE_FOLLOWUP[status];
  return dias === undefined ? null : somarDias(hoje, dias);
}

/** Vagas com follow-up atrasado ou até o próximo domingo, da mais antiga para a mais nova. */
export function followupsDaSemana<T extends { proximo_followup: string | null }>(vagas: T[], hoje: string): T[] {
  const diaDaSemana = new Date(`${hoje}T12:00:00Z`).getUTCDay(); // 0 = domingo
  const domingo = somarDias(hoje, (7 - diaDaSemana) % 7);
  return vagas
    .filter((v) => v.proximo_followup !== null && v.proximo_followup <= domingo)
    .sort((a, b) => a.proximo_followup!.localeCompare(b.proximo_followup!));
}
