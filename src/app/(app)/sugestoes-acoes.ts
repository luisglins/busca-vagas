"use server";

import { refresh } from "next/cache";
import { carregarPerfil, rodarBusca } from "@/lib/busca-supabase";
import { hojeEmSaoPaulo, proximoFollowup } from "@/lib/followup";
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
  await supabase.from("sugestoes").update({ estado: "adicionada", decidido_em: new Date().toISOString() }).eq("id", id);
  refresh();
  return null;
}

/**
 * "Candidatar": o Luís envia a candidatura no site da vaga (o navegador já abriu o anúncio);
 * aqui a vaga entra em Minhas vagas como "Apliquei", com o currículo usado e o follow-up em 7 dias.
 * Se a vaga já estava na lista (ex.: salva para depois), ela é atualizada em vez de duplicada.
 */
export async function candidatarSugestao(id: string, curriculoId: string | null): Promise<string | null> {
  const supabase = await criarClienteServidor();
  const { data: s } = await supabase.from("sugestoes").select("*").eq("id", id).single();
  if (!s) return "Sugestão não encontrada.";
  const hoje = hojeEmSaoPaulo();
  const candidatura = { status: "apliquei", curriculo_id: curriculoId, proximo_followup: proximoFollowup("apliquei", hoje) };

  const { data: existente } = await supabase
    .from("vagas")
    .select("id, status")
    .eq("chave_duplicidade", s.chave_duplicidade)
    .limit(1)
    .maybeSingle();

  let vagaId: string;
  let statusAnterior: string | null = null;
  if (existente) {
    vagaId = existente.id;
    statusAnterior = existente.status;
    const { error } = await supabase.from("vagas").update(candidatura).eq("id", vagaId);
    if (error) return "Não foi possível registrar a candidatura. Tente de novo.";
  } else {
    const { data: nova, error } = await supabase
      .from("vagas")
      .insert({
        empresa: s.empresa,
        cargo: s.cargo,
        link: s.link,
        local: s.local,
        modalidade: s.modalidade,
        descricao: s.descricao,
        fonte: s.fonte,
        data_encontrada: hoje,
        nota_aderencia: s.nota,
        motivos: s.motivos,
        chave_duplicidade: s.chave_duplicidade,
        ...candidatura,
      })
      .select("id")
      .single();
    if (error || !nova) return "Não foi possível registrar a candidatura. Tente de novo.";
    vagaId = nova.id;
  }
  if (statusAnterior !== "apliquei") {
    await supabase.from("historico_status").insert({ vaga_id: vagaId, status_anterior: statusAnterior, status_novo: "apliquei" });
  }
  await supabase.from("sugestoes").update({ estado: "adicionada", decidido_em: new Date().toISOString() }).eq("id", id);
  refresh();
  return null;
}

/** Descarta uma sugestão ou um grupo inteiro (ex.: o mesmo programa de trainee em várias cidades). */
export async function descartarSugestao(ids: string[]): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.from("sugestoes").update({ estado: "descartada", decidido_em: new Date().toISOString() }).in("id", ids);
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
    .update({ estado: "eliminada", motivo_eliminacao: "empresa bloqueada", decidido_em: new Date().toISOString() })
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
