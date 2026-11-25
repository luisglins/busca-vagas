import { contemPalavra, normalizarTexto } from "../texto";
import type { VagaBruta } from "../tipos";
import { coletar, type Adaptador } from "./comum";
import { htmlParaTexto } from "./html";
import { cidadePorTexto, modalidadePorTexto } from "./local";

// API oficial da Jooble (agrega Catho, InfoJobs, Vagas.com e outros): POST https://<host>/api/<chave>.
// A chave é por país: para vagas do Brasil, ela precisa ser pedida em br.jooble.org/api/about.
interface VagaJooble {
  id: number | string;
  title: string;
  company?: string;
  location?: string;
  snippet?: string;
  salary?: string;
  link: string;
  updated?: string;
  type?: string;
}

export function criarJooble(chave: string, host = "br.jooble.org"): Adaptador {
  return {
    fonte: "jooble",
    buscar: (perfil, fetchFn = fetch) =>
      coletar(perfil.termosBusca, async (termo) => {
        // Trainee vale no Brasil todo; o resto, no Rio.
        const location = contemPalavra(normalizarTexto(termo), "trainee") ? "" : "Rio de Janeiro";
        const resposta = await fetchFn(`https://${host}/api/${encodeURIComponent(chave)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "User-Agent": "busca-vagas (projeto pessoal)" },
          body: JSON.stringify({ keywords: termo, location }),
          signal: AbortSignal.timeout(15_000),
        });
        if (resposta.status === 403) {
          throw new Error(`a chave da Jooble não vale para ${host}; peça uma em br.jooble.org/api/about`);
        }
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status} na Jooble`);
        const corpo = (await resposta.json()) as { jobs?: VagaJooble[] };
        return (corpo.jobs ?? []).map((v): VagaBruta => {
          const local = v.location ?? "";
          return {
            fonte: "jooble",
            idExterno: String(v.id),
            empresa: v.company?.trim() || "Empresa não informada",
            cargo: v.title.trim(),
            link: v.link,
            cidade: cidadePorTexto(local),
            modalidade: modalidadePorTexto(`${local} ${v.title}`),
            localTexto: local,
            descricao: htmlParaTexto(v.snippet ?? ""),
            salario: v.salary || undefined,
            publicadaEm: v.updated ? new Date(v.updated).toISOString() : undefined,
          };
        });
      }),
  };
}
