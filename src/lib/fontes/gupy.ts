import type { Modalidade, VagaBruta } from "../tipos";
import { buscarJson, coletar, type Adaptador } from "./comum";

// Endpoint NÃO oficial: é o que o portal.gupy.io usa. Pode mudar sem aviso (ver docs/decisoes-brainstorm.md).
const URL_BUSCA = "https://portal.gupy.io/api/job-search/jobs";

interface VagaGupy {
  id: number;
  name: string;
  careerPageName: string;
  jobUrl: string;
  city?: string;
  state?: string;
  workplaceType?: "on-site" | "hybrid" | "remote";
  description?: string;
  publishedDate?: string;
  applicationDeadline?: string | null;
}

const MODALIDADE: Record<string, Modalidade> = { "on-site": "presencial", hybrid: "hibrido", remote: "remoto" };

function converter(v: VagaGupy): VagaBruta {
  const modalidade = MODALIDADE[v.workplaceType ?? ""] ?? "desconhecida";
  const local = [v.city, v.state].filter(Boolean).join(" - ");
  return {
    fonte: "gupy",
    idExterno: String(v.id),
    empresa: v.careerPageName,
    cargo: v.name,
    link: v.jobUrl,
    cidade: v.city || undefined,
    estado: v.state || undefined,
    modalidade,
    localTexto: local || (modalidade === "remoto" ? "Remoto" : ""),
    descricao: (v.description ?? "").trim(),
    publicadaEm: v.publishedDate,
    prazo: v.applicationDeadline ?? undefined,
  };
}

export const gupy: Adaptador = {
  fonte: "gupy",
  buscar: (perfil, fetchFn) =>
    coletar(perfil.termosBusca, async (termo) => {
      const url = `${URL_BUSCA}?${new URLSearchParams({ jobName: termo, limit: "100", offset: "0" })}`;
      const corpo = await buscarJson<{ data: VagaGupy[] }>(url, fetchFn);
      return corpo.data.map(converter);
    }),
};
