"use server";

import { refresh } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/servidor";

/** Registra uma versão de currículo cujo PDF já foi enviado ao Storage pelo navegador. */
export async function registrarCurriculo(nomeVersao: string, caminho: string): Promise<string | null> {
  const nome = nomeVersao.trim();
  if (!nome) return "Dê um nome para esta versão.";
  if (!/^[0-9a-f-]{36}\.pdf$/.test(caminho)) return "Arquivo inválido.";

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("curriculos").insert({ nome_versao: nome, caminho_arquivo: caminho });
  if (error) {
    await supabase.storage.from("curriculos").remove([caminho]);
    return "Não foi possível salvar o currículo. Tente de novo.";
  }
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
