"use server";

import { refresh } from "next/cache";
import { carregarPerfil, rodarBusca } from "@/lib/busca-supabase";
import { hojeEmSaoPaulo } from "@/lib/followup";
import { criarClienteServidor } from "@/lib/supabase/servidor";

/** Transforma a sugestão em vaga acompanhada (status "interessado"). */
export async function adicionarSugestao(id: string): Promise<string | null> {
  const supabase = await criarClienteServidor();
  const { data: s } = await supabase.from("sugestoes").select("*").eq("id", id).single();
  if (!s) return "Sugestão não encontrada.";

  const { error } = await supabase.from("vagas").insert({
    empresa: s.empresa,
    cargo: s.cargo,
    link: s.link,
    local: s.local,
    modalidade: s.modalidade,
    descricao: s.descricao,
    fonte: s.fonte,
    data_encontrada: hojeEmSaoPaulo(),
    nota_aderencia: s.nota,
    motivos: s.motivos,
    chave_duplicidade: s.chave_duplicidade,
  });
  if (error) return "Não foi possível adicionar. Tente de novo.";
  await supabase.from("sugestoes").update({ estado: "adicionada" }).eq("id", id);
  refresh();
  return null;
}

export async function descartarSugestao(id: string): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.from("sugestoes").update({ estado: "descartada" }).eq("id", id);
  refresh();
}

/** Bloqueia a empresa no perfil e tira da tela as sugestões dela. */
export async function bloquearEmpresa(empresa: string): Promise<void> {
  const supabase = await criarClienteServidor();
  const perfil = await carregarPerfil(supabase);
  if (!perfil.empresasBloqueadas.includes(empresa)) {
    await supabase
      .from("configuracoes")
      .update({ perfil: { ...perfil, empresasBloqueadas: [...perfil.empresasBloqueadas, empresa] } })
      .eq("id", 1);
  }
  await supabase
    .from("sugestoes")
    .update({ estado: "eliminada", motivo_eliminacao: "empresa bloqueada" })
    .eq("empresa", empresa)
    .eq("estado", "nova");
  refresh();
}

/** Roda a busca agora, com a sessão do Luís. Devolve um resumo curto. */
export async function buscarAgora(): Promise<string> {
  const supabase = await criarClienteServidor();
  const resumos = await rodarBusca(supabase);
  refresh();
  const novas = resumos.reduce((t, r) => t + r.novas, 0);
  const falhas = resumos.filter((r) => r.erro).map((r) => r.fonte);
  return `${novas} ${novas === 1 ? "vaga nova" : "vagas novas"}${falhas.length ? `; não foi possível ler: ${falhas.join(", ")}` : ""}.`;
}
