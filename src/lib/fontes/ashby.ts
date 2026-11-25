import type { Modalidade, VagaBruta } from "../tipos";
import { buscarJson, coletar, type Adaptador } from "./comum";
import { modalidadePorTexto } from "./local";

// API pública oficial: https://developers.ashbyhq.com/docs/public-job-posting-api
interface VagaAshby {
  id: string;
  title: string;
  location: string;
  secondaryLocations?: { location: string }[];
  workplaceType?: "Remote" | "Hybrid" | "OnSite" | null;
  address?: { postalAddress?: { addressCountry?: string; addressRegion?: string } };
  descriptionPlain?: string;
  jobUrl: string;
  publishedAt?: string;
  compensation?: { compensationTierSummary?: string };
}

// O Ashby não manda o nome da empresa; para as conhecidas usamos o nome certo.
const NOMES: Record<string, string> = { openai: "OpenAI", elevenlabs: "ElevenLabs", harvey: "Harvey", cursor: "Cursor", decagon: "Decagon" };
const nomeDaEmpresa = (slug: string) => NOMES[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);

function modalidade(v: VagaAshby): Modalidade {
  const pais = v.address?.postalAddress?.addressCountry ?? "";
  const noBrasil = /bra[sz]il/i.test(pais);
  if (v.workplaceType === "Hybrid" || v.workplaceType === "OnSite") {
    if (pais && !noBrasil) return "exterior";
    return v.workplaceType === "Hybrid" ? "hibrido" : "presencial";
  }
  const textos = [v.location, ...(v.secondaryLocations ?? []).map((s) => s.location), pais].join(" ");
  if (v.workplaceType === "Remote") return modalidadePorTexto(`remote ${textos}`);
  return modalidadePorTexto(textos);
}

export const ashby: Adaptador = {
  fonte: "ashby",
  buscar: (perfil, fetchFn) =>
    coletar(perfil.empresasAshby, async (empresa) => {
      const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(empresa)}?includeCompensation=true`;
      const corpo = await buscarJson<{ jobs: VagaAshby[] }>(url, fetchFn);
      return corpo.jobs.map((v): VagaBruta => {
        const m = modalidade(v);
        const remota = m === "remoto" || m === "remoto_internacional";
        return {
          fonte: "ashby",
          idExterno: v.id,
          empresa: nomeDaEmpresa(empresa),
          cargo: v.title,
          link: v.jobUrl,
          cidade: remota ? undefined : v.location,
          modalidade: m,
          localTexto: [v.location, ...(v.secondaryLocations ?? []).map((s) => s.location)].join(", "),
          descricao: (v.descriptionPlain ?? "").trim(),
          salario: v.compensation?.compensationTierSummary || undefined,
          publicadaEm: v.publishedAt,
        };
      });
    }),
};
