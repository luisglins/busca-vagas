import { carregarPerfil } from "@/lib/busca-supabase";
import { agoraMs, isoDiasAtras } from "@/lib/followup";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { QuadroSugestoes, type Sugestao } from "./quadro-sugestoes";

const NOME_FONTE: Record<string, string> = { gupy: "Gupy", greenhouse: "Greenhouse", ashby: "Ashby", jooble: "Jooble", linkedin: "LinkedIn" };

/**
 * Monta o quadro de sugestões.
 * "sites": vagas das buscas (Gupy, Greenhouse, Ashby, Jooble), com descrição completa.
 * "email": vagas dos alertas do LinkedIn que chegam no Gmail (só o nome da vaga).
 */
export async function QuadroCarregado({ modo }: { modo: "sites" | "email" }) {
  const supabase = await criarClienteServidor();
  const agora = agoraMs();
  const desde = isoDiasAtras(30, agora);
  const doEmail = modo === "email";

  let consulta = supabase
    .from("sugestoes")
    .select("id, fonte, empresa, cargo, link, local, cidade, modalidade, descricao, salario, publicada_em, prazo_inscricao, nota, motivos, area")
    .eq("estado", "nova")
    .gte("criado_em", desde);
  consulta = doEmail ? consulta.eq("fonte", "linkedin") : consulta.neq("fonte", "linkedin");

  let contaEliminadas = supabase.from("sugestoes").select("id", { count: "exact", head: true }).eq("estado", "eliminada").gte("criado_em", desde);
  contaEliminadas = doEmail ? contaEliminadas.eq("fonte", "linkedin") : contaEliminadas.neq("fonte", "linkedin");

  let execucoes = supabase.from("execucoes_busca").select("data, fonte, erro").order("data", { ascending: false }).limit(10);
  execucoes = doEmail ? execucoes.eq("fonte", "linkedin") : execucoes.neq("fonte", "linkedin");

  const [{ data }, { count: eliminadas }, { data: rodadas }, perfil, { data: curriculos }] = await Promise.all([
    consulta.order("nota", { ascending: false }).limit(300),
    contaEliminadas,
    execucoes,
    carregarPerfil(supabase),
    supabase.from("curriculos").select("id, nome_versao, texto").order("criado_em", { ascending: false }),
  ]);

  const ultima = rodadas?.[0] ? new Date(rodadas[0].data) : null;
  const quando = ultima?.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  let textoUltimaBusca: string;
  let falhas: string[] = [];
  if (doEmail) {
    textoUltimaBusca = ultima
      ? `Vagas dos alertas do LinkedIn no seu e-mail, que chegam de hora em hora. Último e-mail recebido em ${quando}. A nota usa só o nome da vaga.`
      : "Nenhum alerta do LinkedIn recebido ainda. Confira se o script do Gmail está instalado.";
  } else {
    // Última busca = execuções gravadas até 5 min depois da mais recente.
    const lote = (rodadas ?? []).filter((e) => ultima && ultima.getTime() - new Date(e.data).getTime() < 5 * 60 * 1000);
    textoUltimaBusca = ultima
      ? `Última busca em ${quando} em ${[...new Set(lote.map((e) => NOME_FONTE[e.fonte] ?? e.fonte))].join(", ")}.`
      : "Nenhuma busca feita ainda. Clique em Buscar agora.";
    falhas = lote.filter((e) => e.erro).map((e) => NOME_FONTE[e.fonte] ?? e.fonte);
  }

  const palavras = perfil.categorias.filter((c) => c.id !== "nivel").flatMap((c) => c.palavras);

  return (
    <QuadroSugestoes
      modo={modo}
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
