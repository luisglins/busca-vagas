"use server";

import { refresh } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { carregarPerfil } from "@/lib/busca-supabase";
import { agoraMs, isoDiasAtras } from "@/lib/followup";
import { PERFIL_PADRAO } from "@/lib/perfil-padrao";
import { repontuar, type SugestaoGuardada } from "@/lib/repontuar";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Fonte, Modalidade, Perfil } from "@/lib/tipos";

export type EstadoConfig = { erro: string | null; mensagem?: string };

/** Uma por linha → lista sem repetidas nem linhas vazias. */
function linhas(form: FormData, campo: string): string[] {
  return [...new Set(String(form.get(campo) ?? "").split("\n").map((l) => l.trim()).filter(Boolean))];
}

function numero(form: FormData, campo: string): number | null {
  const n = Number(String(form.get(campo) ?? "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n <= 100 ? Math.round(n) : null;
}

/** Recalcula as sugestões dos últimos 30 dias com o perfil novo. Devolve quantas mudaram. */
async function recalcularSugestoes(supabase: SupabaseClient, perfil: Perfil): Promise<number> {
  const desde = isoDiasAtras(30);
  const guardadas: SugestaoGuardada[] = [];
  for (let de = 0; ; de += 1000) {
    const { data } = await supabase
      .from("sugestoes")
      .select("id, estado, fonte, id_externo, empresa, cargo, link, cidade, modalidade, local, descricao, publicada_em")
      .in("estado", ["nova", "eliminada"])
      .gte("criado_em", desde)
      .range(de, de + 999);
    for (const r of data ?? []) {
      guardadas.push({
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
      });
    }
    if (!data || data.length < 1000) break;
  }

  const avaliadas = repontuar(guardadas, perfil, agoraMs());
  let total = 0;
  for (let i = 0; i < avaliadas.length; i += 500) {
    const { data } = await supabase.rpc("aplicar_notas", {
      dados: avaliadas.slice(i, i + 500).map((a) => ({
        id: a.id,
        nota: a.resultado.eliminada ? 0 : a.resultado.nota,
        motivos: a.resultado.motivos,
        area: a.resultado.area,
        estado: a.situacao,
        motivo_eliminacao: a.resultado.motivoEliminacao ?? null,
      })),
    });
    total += (data as number | null) ?? 0;
  }
  return total;
}

async function salvarPerfil(perfil: Perfil): Promise<EstadoConfig> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("configuracoes").upsert({ id: 1, perfil });
  if (error) return { erro: "Não foi possível salvar. Tente de novo." };
  const n = await recalcularSugestoes(supabase, perfil);
  refresh();
  return { erro: null, mensagem: `Configurações salvas. ${n} sugestões tiveram a nota recalculada.` };
}

export async function salvarConfiguracoes(_estado: EstadoConfig, form: FormData): Promise<EstadoConfig> {
  const atual = await carregarPerfil(await criarClienteServidor());

  const categorias = [];
  for (const c of atual.categorias) {
    const peso = numero(form, `peso_${c.id}`);
    if (peso === null) return { erro: "Os pesos precisam ser números de 0 a 100." };
    categorias.push({ ...c, peso, palavras: linhas(form, `palavras_${c.id}`) });
  }
  const penalidades = [];
  for (const p of atual.penalidades) {
    const valor = numero(form, `valor_${p.id}`);
    if (valor === null) return { erro: "As penalidades precisam ser números de 0 a 100." };
    penalidades.push({ ...p, valor, palavras: p.id === "remoto_internacional" ? [] : linhas(form, `palavras_${p.id}`) });
  }
  const salario = String(form.get("salarioMinimo") ?? "").trim();
  const salarioMinimo = salario === "" ? null : Number(salario.replace(/\./g, "").replace(",", "."));
  if (salarioMinimo !== null && !Number.isFinite(salarioMinimo)) return { erro: "Salário mínimo inválido." };

  const termosBusca = linhas(form, "termosBusca");
  if (termosBusca.length === 0) return { erro: "Deixe pelo menos um termo de busca." };

  return salvarPerfil({
    ...atual,
    termosBusca,
    empresasGreenhouse: linhas(form, "empresasGreenhouse").map((e) => e.toLowerCase()),
    empresasAshby: linhas(form, "empresasAshby").map((e) => e.toLowerCase()),
    empresasBloqueadas: linhas(form, "empresasBloqueadas"),
    palavrasEliminatorias: linhas(form, "palavrasEliminatorias"),
    aceitarOutrasCidades: form.get("aceitarOutrasCidades") === "on",
    traineeQualquerCidade: form.get("traineeQualquerCidade") === "on",
    salarioMinimo,
    categorias,
    penalidades,
  });
}

export async function restaurarPadrao(): Promise<EstadoConfig> {
  return salvarPerfil(PERFIL_PADRAO);
}
