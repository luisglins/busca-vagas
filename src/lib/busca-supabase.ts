import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { executarBusca, type SugestaoNova } from "./busca";
import { ashby } from "./fontes/ashby";
import { greenhouse } from "./fontes/greenhouse";
import type { Adaptador } from "./fontes/comum";
import { gupy } from "./fontes/gupy";
import { criarJooble } from "./fontes/jooble";
import { completarPerfil, PERFIL_PADRAO } from "./perfil-padrao";
import type { Perfil, ResumoExecucao } from "./tipos";

/** Fontes da busca. A Jooble só entra se houver chave (JOOBLE_API_KEY; host em JOOBLE_HOST, padrão br.jooble.org). */
export function adaptadores(): Adaptador[] {
  const lista: Adaptador[] = [gupy, greenhouse, ashby];
  const chaveJooble = process.env.JOOBLE_API_KEY;
  if (chaveJooble) lista.push(criarJooble(chaveJooble, process.env.JOOBLE_HOST || "br.jooble.org"));
  return lista;
}

/** Perfil salvo em Configurações; na primeira vez grava o padrão. */
export async function carregarPerfil(supabase: SupabaseClient): Promise<Perfil> {
  const { data } = await supabase.from("configuracoes").select("perfil").eq("id", 1).maybeSingle();
  if (data?.perfil) return completarPerfil(data.perfil as Perfil);
  await supabase.from("configuracoes").upsert({ id: 1, perfil: PERFIL_PADRAO });
  return PERFIL_PADRAO;
}

/** Lê todas as linhas de uma consulta, de 1000 em 1000 (limite do Supabase por resposta). */
async function todas<T>(consulta: (de: number, ate: number) => PromiseLike<{ data: T[] | null }>): Promise<T[]> {
  const linhas: T[] = [];
  for (let de = 0; ; de += 1000) {
    const { data } = await consulta(de, de + 999);
    linhas.push(...(data ?? []));
    if (!data || data.length < 1000) return linhas;
  }
}

function paraLinha(s: SugestaoNova) {
  const r = s.resultado;
  return {
    fonte: s.fonte,
    id_externo: s.idExterno,
    chave_duplicidade: s.chaveDuplicidade,
    empresa: s.empresa,
    cargo: s.cargo,
    link: s.link,
    local: s.localTexto,
    cidade: s.cidade ?? null,
    modalidade: s.modalidade,
    descricao: s.descricao,
    salario: s.salario ?? null,
    publicada_em: s.publicadaEm ?? null,
    prazo_inscricao: s.prazo ?? null,
    nota: r.eliminada ? 0 : r.nota,
    motivos: r.motivos,
    area: r.area,
    estado: r.eliminada ? "eliminada" : "nova",
    motivo_eliminacao: r.motivoEliminacao ?? null,
  };
}

/** Roda a busca completa usando o cliente dado (sessão do Luís ou chave de serviço). */
export async function rodarBusca(supabase: SupabaseClient): Promise<ResumoExecucao[]> {
  const perfil = await carregarPerfil(supabase);
  const desde = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const [vagas, sugestoes] = await Promise.all([
    todas<{ chave_duplicidade: string | null }>((de, ate) =>
      supabase.from("vagas").select("chave_duplicidade").range(de, ate),
    ),
    todas<{ fonte: string; id_externo: string; chave_duplicidade: string }>((de, ate) =>
      supabase.from("sugestoes").select("fonte, id_externo, chave_duplicidade").gte("criado_em", desde).range(de, ate),
    ),
  ]);

  return executarBusca({
    adaptadores: adaptadores(),
    perfil,
    chavesExistentes: new Set([
      ...vagas.map((v) => v.chave_duplicidade).filter((c): c is string => Boolean(c)),
      ...sugestoes.map((s) => s.chave_duplicidade),
    ]),
    idsExistentes: new Set(sugestoes.map((s) => `${s.fonte}:${s.id_externo}`)),
    salvar: async (novas) => {
      for (let i = 0; i < novas.length; i += 500) {
        const { error } = await supabase
          .from("sugestoes")
          .upsert(novas.slice(i, i + 500).map(paraLinha), { onConflict: "fonte,id_externo", ignoreDuplicates: true });
        if (error) throw new Error(`Erro ao salvar sugestões: ${error.message}`);
      }
    },
    registrar: async (r) => {
      await supabase.from("execucoes_busca").insert({
        fonte: r.fonte,
        encontradas: r.encontradas,
        novas: r.novas,
        eliminadas: r.eliminadas,
        erro: r.erro,
      });
    },
  });
}
