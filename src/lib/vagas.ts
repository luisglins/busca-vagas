import type { Status } from "./tipos";

/** Uma linha da tabela `vagas` (com o nome do currículo, quando houver). */
export interface Vaga {
  id: string;
  empresa: string;
  cargo: string;
  link: string | null;
  local: string | null;
  modalidade: string | null;
  descricao: string | null;
  fonte: string;
  data_encontrada: string;
  status: Status;
  notas: string | null;
  nota_aderencia: number | null;
  motivos: string[] | null;
  curriculo_id: string | null;
  proximo_followup: string | null;
  curriculos?: { nome_versao: string } | null;
}

export const STATUS: { valor: Status; rotulo: string }[] = [
  { valor: "interessado", rotulo: "Interessado" },
  { valor: "apliquei", rotulo: "Apliquei" },
  { valor: "entrevista", rotulo: "Entrevista" },
  { valor: "recusado", rotulo: "Recusado" },
  { valor: "oferta", rotulo: "Oferta" },
];

export function ehStatus(valor: unknown): valor is Status {
  return STATUS.some((s) => s.valor === valor);
}

export type Faixa = "verde" | "amarela" | "cinza";

/** Faixa do andon para uma nota: verde ≥ 70, amarela 40–69, cinza < 40. */
export function faixaDaNota(nota: number): Faixa {
  if (nota >= 70) return "verde";
  if (nota >= 40) return "amarela";
  return "cinza";
}

export const COR_DA_FAIXA: Record<Faixa, string> = {
  verde: "text-verde",
  amarela: "text-laranja-escuro",
  cinza: "text-cinza-nota",
};

/** Cor do marca-texto do nome da vaga (classe definida em globals.css). */
export function marcaDaNota(nota: number | null): string {
  if (nota === null) return "marca-amarela";
  return { verde: "marca-verde", amarela: "marca-amarela", cinza: "marca-cinza" }[faixaDaNota(nota)];
}

/** "2026-11-24" → "24/11" */
export function dataCurta(data: string): string {
  const [, mes, dia] = data.split("-");
  return `${dia}/${mes}`;
}

const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
/** "2026-11-25" → "qua, 25/11" */
export function dataComDia(data: string): string {
  const dia = new Date(`${data}T12:00:00Z`).getUTCDay();
  return `${DIAS[dia]}, ${dataCurta(data)}`;
}
