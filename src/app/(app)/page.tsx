import { carregarPerfil } from "@/lib/busca-supabase";
import { agoraMs, isoDiasAtras } from "@/lib/followup";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { QuadroSugestoes, type Sugestao } from "./quadro-sugestoes";

const NOME_FONTE: Record<string, string> = { gupy: "Gupy", greenhouse: "Greenhouse", ashby: "Ashby" };

export default async function Sugestoes() {
  const supabase = await criarClienteServidor();
  const agora = agoraMs();
  const desde = isoDiasAtras(30, agora);

  const [{ data }, { count: eliminadas }, { data: execucoes }, perfil, { data: curriculos }] = await Promise.all([
    supabase
      .from("sugestoes")
      .select("id, fonte, empresa, cargo, link, local, cidade, modalidade, descricao, salario, publicada_em, prazo_inscricao, nota, motivos, area")
      .eq("estado", "nova")
      .gte("criado_em", desde)
      .order("nota", { ascending: false })
      .limit(300),
    supabase.from("sugestoes").select("id", { count: "exact", head: true }).eq("estado", "eliminada").gte("criado_em", desde),
    supabase.from("execucoes_busca").select("data, fonte, erro").order("data", { ascending: false }).limit(10),
    carregarPerfil(supabase),
    supabase.from("curriculos").select("id, nome_versao, texto").order("criado_em", { ascending: false }),
  ]);

  // Última busca = execuções gravadas até 5 min depois da mais recente.
  const ultima = execucoes?.[0] ? new Date(execucoes[0].data) : null;
  const lote = (execucoes ?? []).filter((e) => ultima && ultima.getTime() - new Date(e.data).getTime() < 5 * 60 * 1000);
  const textoUltimaBusca = ultima
    ? `Última busca em ${ultima.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} em ${[...new Set(lote.map((e) => NOME_FONTE[e.fonte] ?? e.fonte))].join(", ")}.`
    : "Nenhuma busca feita ainda. Clique em Buscar agora.";
  const falhas = lote.filter((e) => e.erro).map((e) => NOME_FONTE[e.fonte] ?? e.fonte);

  const palavras = perfil.categorias.filter((c) => c.id !== "nivel").flatMap((c) => c.palavras);

  return (
    <QuadroSugestoes
      sugestoes={(data ?? []) as Sugestao[]}
      palavras={palavras}
      curriculos={(curriculos ?? []).map((c) => ({ id: c.id, nome: c.nome_versao, texto: c.texto }))}
      perfil={perfil}
      textoUltimaBusca={textoUltimaBusca}
      falhas={falhas}
      eliminadas={eliminadas ?? 0}
      agora={agora}
    />
  );
}
