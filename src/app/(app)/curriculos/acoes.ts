"use server";

import { refresh } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { extractText, getDocumentProxy } from "unpdf";
import { criarClienteServidor } from "@/lib/supabase/servidor";

/** Baixa o PDF do Storage e grava o texto dele (usado para indicar o currículo certo para cada vaga). */
async function extrairTexto(supabase: SupabaseClient, id: string, caminho: string): Promise<boolean> {
  const { data: arquivo } = await supabase.storage.from("curriculos").download(caminho);
  if (!arquivo) return false;
  try {
    const pdf = await getDocumentProxy(new Uint8Array(await arquivo.arrayBuffer()));
    const { text } = await extractText(pdf, { mergePages: true });
    // PDF que é só imagem (escaneado) não tem texto: grava vazio para não tentar de novo.
    await supabase.from("curriculos").update({ texto: text.trim() }).eq("id", id);
    return text.trim().length > 0;
  } catch {
    await supabase.from("curriculos").update({ texto: "" }).eq("id", id);
    return false;
  }
}

/** Lê o texto dos currículos enviados antes desta função existir. */
export async function lerTextosPendentes(): Promise<number> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("curriculos").select("id, caminho_arquivo").is("texto", null);
  for (const cv of data ?? []) await extrairTexto(supabase, cv.id, cv.caminho_arquivo);
  if (data && data.length > 0) refresh();
  return data?.length ?? 0;
}

/** Registra uma versão de currículo cujo PDF já foi enviado ao Storage pelo navegador. */
export async function registrarCurriculo(nomeVersao: string, caminho: string): Promise<string | null> {
  const nome = nomeVersao.trim();
  if (!nome) return "Dê um nome para esta versão.";
  if (!/^[0-9a-f-]{36}\.pdf$/.test(caminho)) return "Arquivo inválido.";

  const supabase = await criarClienteServidor();
  const { data: novo, error } = await supabase
    .from("curriculos")
    .insert({ nome_versao: nome, caminho_arquivo: caminho })
    .select("id")
    .single();
  if (error || !novo) {
    await supabase.storage.from("curriculos").remove([caminho]);
    return "Não foi possível salvar o currículo. Tente de novo.";
  }
  await extrairTexto(supabase, novo.id, caminho);
  refresh();
  return null;
}

/** Link temporário (60 s) para abrir o PDF. */
export async function linkDoCurriculo(id: string): Promise<string | null> {
  const supabase = await criarClienteServidor();
  const { data: cv } = await supabase.from("curriculos").select("caminho_arquivo").eq("id", id).single();
  if (!cv) return null;
  const { data } = await supabase.storage.from("curriculos").createSignedUrl(cv.caminho_arquivo, 60);
  return data?.signedUrl ?? null;
}

/** Exclui uma versão que não foi usada em nenhuma vaga. */
export async function excluirCurriculo(id: string): Promise<string | null> {
  const supabase = await criarClienteServidor();
  const { count } = await supabase.from("vagas").select("id", { count: "exact", head: true }).eq("curriculo_id", id);
  if (count && count > 0) {
    return `Esta versão foi enviada para ${count} ${count === 1 ? "vaga" : "vagas"}. Para manter o registro, ela não pode ser excluída.`;
  }
  const { data: cv } = await supabase.from("curriculos").select("caminho_arquivo").eq("id", id).single();
  if (cv) await supabase.storage.from("curriculos").remove([cv.caminho_arquivo]);
  await supabase.from("curriculos").delete().eq("id", id);
  refresh();
  return null;
}
