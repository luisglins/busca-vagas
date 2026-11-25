"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { hojeEmSaoPaulo, proximoFollowup } from "@/lib/followup";
import type { SupabaseClient } from "@supabase/supabase-js";
import { carregarPerfil } from "@/lib/busca-supabase";
import type { VagaDoCsv } from "@/lib/csv";
import { pontuar } from "@/lib/pontuar";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { chaveDuplicidade } from "@/lib/texto";
import { ehStatus } from "@/lib/vagas";
import type { Perfil } from "@/lib/tipos";

function texto(form: FormData, campo: string): string | null {
  const v = String(form.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

/** Perfil atual, com a vaga manual nunca escondida: ela só ganha a nota. */
async function perfilParaManual(supabase: SupabaseClient): Promise<Perfil> {
  const perfil = await carregarPerfil(supabase);
  return { ...perfil, empresasBloqueadas: [], aceitarOutrasCidades: true };
}

interface DadosManuais {
  empresa: string;
  cargo: string;
  link?: string | null;
  descricao?: string | null;
  notas?: string | null;
  data_encontrada?: string | null;
}

/** Linha pronta para gravar em `vagas`, já com nota de aderência e chave de duplicidade. */
function linhaDeVagaManual(d: DadosManuais, perfil: Perfil) {
  const resultado = pontuar(
    {
      fonte: "manual",
      idExterno: "",
      empresa: d.empresa,
      cargo: d.cargo,
      link: d.link ?? "",
      modalidade: "desconhecida",
      localTexto: "",
      descricao: d.descricao ?? "",
    },
    perfil,
  );
  return {
    empresa: d.empresa,
    cargo: d.cargo,
    link: d.link || null,
    descricao: d.descricao || null,
    notas: d.notas || null,
    data_encontrada: d.data_encontrada || hojeEmSaoPaulo(),
    fonte: "manual",
    nota_aderencia: resultado.eliminada ? 0 : resultado.nota,
    motivos: resultado.eliminada ? [resultado.motivoEliminacao] : resultado.motivos,
    chave_duplicidade: chaveDuplicidade(d.empresa, d.cargo),
  };
}

export type EstadoForm = { erro: string | null; ok?: boolean };

/** Cadastro manual de uma vaga. Ela já recebe nota de aderência. */
export async function criarVaga(_estado: EstadoForm, form: FormData): Promise<EstadoForm> {
  const empresa = texto(form, "empresa");
  const cargo = texto(form, "cargo");
  if (!empresa || !cargo) return { erro: "Preencha empresa e cargo." };

  const supabase = await criarClienteServidor();
  const linha = linhaDeVagaManual(
    {
      empresa,
      cargo,
      link: texto(form, "link"),
      descricao: texto(form, "descricao"),
      notas: texto(form, "notas"),
      data_encontrada: texto(form, "data_encontrada"),
    },
    await perfilParaManual(supabase),
  );
  const { error } = await supabase.from("vagas").insert(linha);
  if (error) return { erro: "Não foi possível salvar a vaga. Tente de novo." };
  refresh();
  return { erro: null, ok: true };
}

/** Importa as vagas lidas de um CSV; pula as que já estão na lista (mesma empresa e cargo). */
export async function importarVagas(vagas: VagaDoCsv[]): Promise<{ importadas: number; repetidas: number; erro: string | null }> {
  if (vagas.length === 0) return { importadas: 0, repetidas: 0, erro: "Nenhuma vaga para importar." };
  if (vagas.length > 500) return { importadas: 0, repetidas: 0, erro: "Importe no máximo 500 vagas por vez." };

  const supabase = await criarClienteServidor();
  const perfil = await perfilParaManual(supabase);
  const { data: existentes } = await supabase.from("vagas").select("chave_duplicidade");
  const chaves = new Set((existentes ?? []).map((v) => v.chave_duplicidade));

  const linhas = [];
  let repetidas = 0;
  for (const v of vagas) {
    const linha = linhaDeVagaManual(v, perfil);
    if (chaves.has(linha.chave_duplicidade)) {
      repetidas++;
      continue;
    }
    chaves.add(linha.chave_duplicidade);
    linhas.push(linha);
  }
  if (linhas.length > 0) {
    const { error } = await supabase.from("vagas").insert(linhas);
    if (error) return { importadas: 0, repetidas, erro: "Não foi possível importar. Tente de novo." };
  }
  refresh();
  return { importadas: linhas.length, repetidas, erro: null };
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
