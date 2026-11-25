// Fluxo de valor da busca: Interessado → Apliquei → Entrevista → Oferta.

export const ETAPAS = ["interessado", "apliquei", "entrevista", "oferta"] as const;
export type Etapa = (typeof ETAPAS)[number];

export interface Fluxo {
  /** agora = quantas estão nesta etapa hoje; chegaram = quantas passaram por ela em algum momento */
  etapas: { etapa: Etapa; agora: number; chegaram: number }[];
  /** % de quem chegou numa etapa e passou para a seguinte (null se ninguém chegou) */
  passagens: (number | null)[];
  recusadas: { total: number; porEtapa: Record<Exclude<Etapa, "oferta">, number> };
  /** vagas que fecharam no site da empresa (ficam fora do fluxo) */
  encerradas: number;
}

/** Índice da etapa mais avançada pela qual a vaga passou (0 = interessado). */
function maisAvancada(passou: string[]): number {
  return Math.max(0, ...passou.map((s) => ETAPAS.indexOf(s as Etapa)));
}

export function calcularFluxo(vagas: { status: string; passou: string[] }[]): Fluxo {
  const etapas = ETAPAS.map((etapa, i) => ({
    etapa,
    agora: vagas.filter((v) => v.status === etapa).length,
    chegaram: vagas.filter((v) => maisAvancada([v.status, ...v.passou]) >= i).length,
  }));

  const passagens = etapas.slice(0, -1).map((e, i) =>
    e.chegaram === 0 ? null : Math.round((etapas[i + 1].chegaram / e.chegaram) * 100),
  );

  const porEtapa = { interessado: 0, apliquei: 0, entrevista: 0 };
  const recusadas = vagas.filter((v) => v.status === "recusado");
  for (const v of recusadas) {
    const etapa = ETAPAS[Math.min(maisAvancada(v.passou), 2)] as keyof typeof porEtapa;
    porEtapa[etapa]++;
  }

  const encerradas = vagas.filter((v) => v.status === "encerrada").length;
  return { etapas, passagens, recusadas: { total: recusadas.length, porEtapa }, encerradas };
}
