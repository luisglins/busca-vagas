"use server";

import { refresh } from "next/cache";
import { carregarPerfil } from "@/lib/busca-supabase";
import { agoraMs } from "@/lib/followup";
import { repontuar, type SugestaoGuardada } from "@/lib/repontuar";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Fonte, Modalidade } from "@/lib/tipos";

/** Desfaz um "Descartar": a sugestão volta para a lista. */
export async function desfazerDescarte(id: string): Promise<string | null> {
  const supabase = await criarClienteServidor();
  await supabase.from("sugestoes").update({ estado: "nova", decidido_em: null }).eq("id", id).eq("estado", "descartada");
  refresh();
  return null;
}

/**
 * Desfaz um "Adicionar à lista": apaga a vaga criada e devolve a sugestão.
 * Só deixa se a vaga ainda está como "interessado" — se já avançou, o Luís deve decidir em Minhas vagas.
 */
export async function desfazerAdicao(id: string): Promise<string | null> {
  const supabase = await criarClienteServidor();
  const { data: s } = await supabase.from("sugestoes").select("chave_duplicidade").eq("id", id).single();
  if (!s) return "Sugestão não encontrada.";
  const { data: vagas } = await supabase.from("vagas").select("id, status").eq("chave_duplicidade", s.chave_duplicidade);
  if (vagas?.some((v) => v.status !== "interessado")) {
    return "Essa vaga já mudou de status em Minhas vagas. Para tirar, exclua por lá.";
  }
  if (vagas && vagas.length > 0) await supabase.from("vagas").delete().in("id", vagas.map((v) => v.id));
  await supabase.from("sugestoes").update({ estado: "nova", decidido_em: null }).eq("id", id);
  refresh();
  return null;
}

/** Tira a empresa da lista de bloqueio e recalcula as sugestões dela. */
export async function desbloquearEmpresa(empresa: string): Promise<string | null> {
  const supabase = await criarClienteServidor();
  const perfil = await carregarPerfil(supabase);
  const novoPerfil = { ...perfil, empresasBloqueadas: perfil.empresasBloqueadas.filter((e) => e !== empresa) };
  await supabase.from("configuracoes").update({ perfil: novoPerfil }).eq("id", 1);

  const { data } = await supabase
    .from("sugestoes")
    .select("id, estado, fonte, id_externo, empresa, cargo, link, cidade, modalidade, local, descricao, publicada_em")
    .eq("empresa", empresa)
    .eq("estado", "eliminada");
  const guardadas: SugestaoGuardada[] = (data ?? []).map((r) => ({
    id: r.id,
    situacao: r.estado,
    fonte: r.fonte as Fonte,
    idExterno: r.id_externo,
    empresa: r.empresa,
    cargo: r.cargo,
    link: r.link ?? "",
    cidade: r.cidade ?? undefined,
    modalidade: (r.modalidade ?? "desconhecida") as Modalidade,
    localTexto: r.local ?? "",
    descricao: r.descricao ?? "",
    publicadaEm: r.publicada_em ?? undefined,
  }));
  const avaliadas = repontuar(guardadas, novoPerfil, agoraMs());
  if (avaliadas.length > 0) {
    await supabase.rpc("aplicar_notas", {
      dados: avaliadas.map((a) => ({
        id: a.id,
        nota: a.resultado.eliminada ? 0 : a.resultado.nota,
        motivos: a.resultado.motivos,
        area: a.resultado.area,
        estado: a.situacao,
        motivo_eliminacao: a.resultado.motivoEliminacao ?? null,
      })),
    });
    await supabase.from("sugestoes").update({ decidido_em: null }).eq("empresa", empresa).eq("estado", "nova");
  }
  refresh();
  return null;
}
