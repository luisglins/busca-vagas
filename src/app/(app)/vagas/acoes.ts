"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { hojeEmSaoPaulo, proximoFollowup } from "@/lib/followup";
import { PERFIL_PADRAO } from "@/lib/perfil-padrao";
import { pontuar } from "@/lib/pontuar";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { chaveDuplicidade } from "@/lib/texto";
import { ehStatus } from "@/lib/vagas";
import type { Perfil } from "@/lib/tipos";

function texto(form: FormData, campo: string): string | null {
  const v = String(form.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

/** Perfil salvo em Configurações, ou o padrão se ainda não existir. */
async function perfilAtual(): Promise<Perfil> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("configuracoes").select("perfil").eq("id", 1).maybeSingle();
  return (data?.perfil as Perfil | undefined) ?? PERFIL_PADRAO;
}

export type EstadoForm = { erro: string | null; ok?: boolean };

/** Cadastro manual de uma vaga. Ela já recebe nota de aderência. */
export async function criarVaga(_estado: EstadoForm, form: FormData): Promise<EstadoForm> {
  const empresa = texto(form, "empresa");
  const cargo = texto(form, "cargo");
  if (!empresa || !cargo) return { erro: "Preencha empresa e cargo." };

  const descricao = texto(form, "descricao") ?? "";
  const resultado = pontuar(
    {
      fonte: "manual",
      idExterno: "",
      empresa,
      cargo,
      link: texto(form, "link") ?? "",
      modalidade: "desconhecida",
      localTexto: "",
      descricao,
    },
    // A vaga cadastrada à mão nunca é escondida: só usamos a nota.
    { ...(await perfilAtual()), empresasBloqueadas: [], aceitarOutrasCidades: true },
  );

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("vagas").insert({
    empresa,
    cargo,
    link: texto(form, "link"),
    descricao: descricao || null,
    notas: texto(form, "notas"),
    data_encontrada: texto(form, "data_encontrada") ?? hojeEmSaoPaulo(),
    fonte: "manual",
    nota_aderencia: resultado.eliminada ? 0 : resultado.nota,
    motivos: resultado.eliminada ? [resultado.motivoEliminacao] : resultado.motivos,
    chave_duplicidade: chaveDuplicidade(empresa, cargo),
  });
  if (error) return { erro: "Não foi possível salvar a vaga. Tente de novo." };
  refresh();
  return { erro: null, ok: true };
}

/** Muda o status, grava o histórico e recalcula o próximo follow-up. */
export async function mudarStatus(id: string, novo: string): Promise<void> {
  if (!ehStatus(novo)) return;
  const supabase = await criarClienteServidor();
  const { data: atual } = await supabase.from("vagas").select("status").eq("id", id).single();
  if (!atual || atual.status === novo) return;

  await supabase
    .from("vagas")
    .update({ status: novo, proximo_followup: proximoFollowup(novo, hojeEmSaoPaulo()) })
    .eq("id", id);
  await supabase.from("historico_status").insert({ vaga_id: id, status_anterior: atual.status, status_novo: novo });
  refresh();
}

/** Salva os campos editáveis da página de detalhe. */
export async function atualizarVaga(id: string, _estado: EstadoForm, form: FormData): Promise<EstadoForm> {
  const empresa = texto(form, "empresa");
  const cargo = texto(form, "cargo");
  if (!empresa || !cargo) return { erro: "Preencha empresa e cargo." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("vagas")
    .update({
      empresa,
      cargo,
      link: texto(form, "link"),
      local: texto(form, "local"),
      notas: texto(form, "notas"),
      descricao: texto(form, "descricao"),
      proximo_followup: texto(form, "proximo_followup"),
      curriculo_id: texto(form, "curriculo_id"),
    })
    .eq("id", id);
  if (error) return { erro: "Não foi possível salvar. Tente de novo." };
  refresh();
  return { erro: null, ok: true };
}

export async function excluirVaga(id: string): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.from("vagas").delete().eq("id", id);
  redirect("/vagas");
}
