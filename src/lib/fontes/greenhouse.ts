import type { VagaBruta } from "../tipos";
import { buscarJson, coletar, type Adaptador } from "./comum";
import { htmlParaTexto } from "./html";
import { cidadePorTexto, modalidadePorTexto } from "./local";

// API pública oficial: https://developers.greenhouse.io/job-board.html
interface VagaGreenhouse {
  id: number;
  title: string;
  absolute_url: string;
  company_name?: string;
  location: { name: string };
  content?: string;
  first_published?: string;
  updated_at?: string;
}

export const greenhouse: Adaptador = {
  fonte: "greenhouse",
  buscar: (perfil, fetchFn) =>
    coletar(perfil.empresasGreenhouse, async (empresa) => {
      const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(empresa)}/jobs?content=true`;
      const corpo = await buscarJson<{ jobs: VagaGreenhouse[] }>(url, fetchFn);
      return corpo.jobs.map(
        (v): VagaBruta => ({
          fonte: "greenhouse",
          idExterno: String(v.id),
          empresa: v.company_name || empresa,
          cargo: v.title,
          link: v.absolute_url,
          cidade: cidadePorTexto(v.location.name),
          modalidade: modalidadePorTexto(`${v.location.name} ${v.title}`),
          localTexto: v.location.name,
          descricao: htmlParaTexto(v.content ?? ""),
          publicadaEm: v.first_published ?? v.updated_at,
        }),
      );
    }),
};
