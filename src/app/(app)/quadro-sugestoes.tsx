"use client";

import Link from "next/link";
import { createContext, useContext, useMemo, useState, useTransition } from "react";
import { agruparSugestoes, type Grupo } from "@/lib/agrupar";
import { compararCurriculos } from "@/lib/curriculo";
import type { Perfil } from "@/lib/tipos";
import { marcarPalavras, separarSecoes } from "@/lib/descricao";
import { faixaDaNota, type Faixa } from "@/lib/vagas";
import { adicionarSugestao, bloquearEmpresa, buscarAgora, descartarSugestao } from "./sugestoes-acoes";

export interface Sugestao {
  id: string;
  fonte: string;
  empresa: string;
  cargo: string;
  link: string | null;
  local: string | null;
  cidade: string | null;
  modalidade: string | null;
  descricao: string | null;
  salario: string | null;
  publicada_em: string | null;
  prazo_inscricao: string | null;
  nota: number;
  motivos: string[] | null;
  area: "processos" | "ia" | null;
}

export interface CurriculoComparavel {
  id: string;
  nome: string;
  texto: string | null;
}

// Currículos e perfil ficam num contexto para o "Veja mais" de qualquer vaga poder usar.
const ContextoCurriculos = createContext<{ curriculos: CurriculoComparavel[]; perfil: Perfil | null }>({
  curriculos: [],
  perfil: null,
});

/** Bloco "Currículo indicado" do Veja mais: o mais aderente e as palavras da vaga que faltam nele. */
function CurriculoIndicado({ s }: { s: Sugestao }) {
  const { curriculos, perfil } = useContext(ContextoCurriculos);
  if (!perfil) return null;
  if (curriculos.length === 0) {
    return (
      <p className="text-[13px] text-aco">
        <Link href="/curriculos" className="underline">Envie seus currículos</Link> para ver qual combina mais com esta vaga.
      </p>
    );
  }
  const ranking = compararCurriculos(curriculos, { cargo: s.cargo, descricao: s.descricao }, perfil);
  if (ranking.length === 0) return <p className="text-[13px] text-aco">Esta vaga não tem palavras do seu perfil para comparar com os currículos.</p>;
  const melhor = ranking[0];
  return (
    <div className="rounded-lg border border-junta bg-concreto/60 p-3">
      <p className="text-[13px] text-aco">Currículo indicado</p>
      <p className="font-titulo text-lg leading-tight font-bold">{melhor.nome}</p>
      <p className="text-[13px] text-aco">
        tem {melhor.encontradas.length} de {melhor.encontradas.length + melhor.faltando.length} palavras da vaga ({melhor.cobertura}%)
      </p>
      {melhor.faltando.length > 0 && (
        <p className="mt-1.5 text-[13px]">
          <span className="text-aco">Faltam: </span>
          {melhor.faltando.join(", ")}
        </p>
      )}
      {ranking.length > 1 && (
        <p className="mt-1.5 text-[12px] text-aco">
          Depois: {ranking.slice(1).map((r) => `${r.nome} ${r.cobertura}%`).join(", ")}
        </p>
      )}
    </div>
  );
}

interface Props {
  modo: "sites" | "email";
  sugestoes: Sugestao[];
  palavras: string[];
  curriculos: CurriculoComparavel[];
  perfil: Perfil;
  textoUltimaBusca: string;
  falhas: string[];
  eliminadas: number;
  /** horário da página (ms), vindo do servidor */
  agora: number;
}

const FONTES = [
  { id: "gupy", nome: "Gupy" },
  { id: "greenhouse", nome: "Greenhouse" },
  { id: "ashby", nome: "Ashby" },
  { id: "jooble", nome: "Jooble" },
  { id: "linkedin", nome: "LinkedIn" },
];

const FAIXAS: { id: Faixa; titulo: string; lampada: string; luz: string; cor: string; fundo: string; barra: string; marca: string; degrade: string }[] = [
  { id: "verde", titulo: "Vale aplicar", lampada: "Vale aplicar, nota 70 ou mais", luz: "bg-verde-luz", cor: "text-verde", fundo: "bg-verde-claro", barra: "before:bg-verde", marca: "marca-verde", degrade: "degrade-verde" },
  { id: "amarela", titulo: "Avalie antes de aplicar", lampada: "Avalie, nota de 40 a 69", luz: "bg-laranja", cor: "text-laranja-escuro", fundo: "bg-[#eadcc2]", barra: "before:bg-laranja-escuro", marca: "marca-amarela", degrade: "degrade-amarela" },
  { id: "cinza", titulo: "Pouco aderente", lampada: "Pouco aderente, abaixo de 40", luz: "bg-[#9aa6a1]", cor: "text-cinza-nota", fundo: "bg-[#d9ded8]", barra: "before:bg-cinza-nota", marca: "marca-cinza", degrade: "degrade-cinza" },
];

const MODALIDADE: Record<string, string> = {
  presencial: "presencial",
  hibrido: "híbrido",
  remoto: "remoto (Brasil)",
  remoto_internacional: "remoto internacional",
  desconhecida: "modalidade não informada",
};

function quandoPublicada(iso: string | null, agora: number): string {
  if (!iso) return "";
  const dias = Math.floor((agora - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  return `há ${dias} dias`;
}

const dataCurta = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" });

function TextoMarcado({ texto, palavras }: { texto: string; palavras: string[] }) {
  return (
    <>
      {marcarPalavras(texto, palavras).map((p, i) =>
        p.marcado ? (
          <mark key={i} className="border-b-2 border-laranja bg-laranja-claro px-0.5 text-inherit">
            {p.texto}
          </mark>
        ) : (
          <span key={i}>{p.texto}</span>
        ),
      )}
    </>
  );
}

const MAX_ITENS = 10;

/** Conteúdo do "Veja mais": seções da descrição + ficha da vaga. */
function Detalhes({ s, palavras, id, agora }: { s: Sugestao; palavras: string[]; id: string; agora: number }) {
  const secoes = separarSecoes(s.descricao ?? "").filter((x) => x.itens.length > 0);
  // Prioridade: atividades, requisitos e diferenciais. Sem elas, o que não for "sobre a empresa" ou benefícios.
  const principais = secoes.filter((x) => ["atividades", "requisitos", "diferenciais"].includes(x.tipo));
  const alternativas = secoes.filter((x) => !["sobre", "beneficios"].includes(x.tipo));
  const mostrar = (principais.length > 0 ? principais : alternativas.length > 0 ? alternativas : secoes).slice(0, 4);
  const prazo = s.prazo_inscricao ? new Date(s.prazo_inscricao) : null;
  const prazoPerto = prazo && prazo.getTime() - agora < 3 * 86_400_000;

  return (
    <div id={id} className="col-span-full mt-3 grid gap-6 border-t border-dashed border-junta pt-4 text-sm md:grid-cols-[1fr_1fr_260px]">
      {mostrar.length === 0 ? (
        <p className="text-aco md:col-span-2">Esta vaga não trouxe descrição. Abra o anúncio original para ler os detalhes.</p>
      ) : (
        <div className="grid gap-6 md:col-span-2 md:grid-cols-2">
          {mostrar.map((secao, i) => (
            <div key={i}>
              <h4 className="mb-2 font-titulo text-lg font-semibold">{secao.titulo ?? "Sobre a vaga"}</h4>
              <ul className="list-disc space-y-1 pl-4">
                {secao.itens.slice(0, MAX_ITENS).map((item, j) => (
                  <li key={j} className="max-w-[60ch]">
                    <TextoMarcado texto={item} palavras={palavras} />
                  </li>
                ))}
              </ul>
              {secao.itens.length > MAX_ITENS && (
                <p className="mt-1 text-[13px] text-aco">Mais {secao.itens.length - MAX_ITENS} itens no anúncio original.</p>
              )}
            </div>
          ))}
          <p className="text-[13px] text-aco md:col-span-2">Em destaque: palavras que batem com o seu perfil.</p>
        </div>
      )}
      <div className="flex flex-col gap-4">
      <CurriculoIndicado s={s} />
      <dl className="grid grid-cols-[auto_1fr] content-start gap-x-3 gap-y-1.5">
        <dt className="text-aco">Salário</dt>
        <dd>{s.salario ?? "não informado"}</dd>
        <dt className="text-aco">Modalidade</dt>
        <dd>{MODALIDADE[s.modalidade ?? "desconhecida"] ?? s.modalidade}</dd>
        {s.local && (
          <>
            <dt className="text-aco">Local</dt>
            <dd>{s.local}</dd>
          </>
        )}
        {s.publicada_em && (
          <>
            <dt className="text-aco">Publicada</dt>
            <dd>{dataCurta(s.publicada_em)}</dd>
          </>
        )}
        {prazo && (
          <>
            <dt className="text-aco">Inscrições até</dt>
            <dd className={prazoPerto ? "font-medium text-vermelho" : undefined}>{dataCurta(s.prazo_inscricao!)}</dd>
          </>
        )}
        <dt className="text-aco">Site</dt>
        <dd>{FONTES.find((f) => f.id === s.fonte)?.nome ?? s.fonte}</dd>
      </dl>
      </div>
      {s.link && (
        <p className="text-[13px] text-aco md:col-span-3">
          Para se candidatar:{" "}
          <a href={s.link} target="_blank" rel="noreferrer" className="underline">
            abrir o anúncio original
          </a>{" "}
          (abre em nova aba).
        </p>
      )}
    </div>
  );
}

/** Outras vagas do mesmo grupo (ex.: o mesmo programa de trainee em outras cidades). */
function Variacoes({ membros }: { membros: Sugestao[] }) {
  const [ocupado, iniciar] = useTransition();
  return (
    <div className="col-span-full mt-3 rounded-lg border border-junta bg-concreto/50 p-3 text-sm md:col-[2/4]">
      <p className="mb-2 font-titulo text-lg font-semibold">{membros.length} vagas neste grupo</p>
      <ul className="divide-y divide-junta-leve">
        {membros.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-1.5">
            <span>
              <strong className="font-semibold">{m.cargo}</strong>
              <span className="text-aco"> · {m.cidade ?? m.local ?? "local não informado"} · nota {m.nota}</span>
            </span>
            <span className="flex gap-3">
              {m.link && (
                <a href={m.link} target="_blank" rel="noreferrer" className="underline">
                  anúncio
                </a>
              )}
              <button type="button" className="btn-texto py-0 text-grafite underline" disabled={ocupado} onClick={() => iniciar(async () => void (await adicionarSugestao(m.id)))}>
                adicionar esta
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LinhaSugestao({ grupo, palavras, faixa, agora }: { grupo: Grupo<Sugestao>; palavras: string[]; faixa: (typeof FAIXAS)[number]; agora: number }) {
  const s = grupo.principal;
  const outras = grupo.membros.length - 1;
  const [aberto, setAberto] = useState(false);
  const [ocupado, iniciar] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);
  const local = [s.cidade ?? (s.modalidade?.startsWith("remoto") ? null : s.local), MODALIDADE[s.modalidade ?? ""]].filter(Boolean).join(", ");
  const idDetalhes = `detalhes-${s.id}`;

  return (
    <li
      className={`relative grid grid-cols-[52px_1fr] gap-x-5 gap-y-1 border-y border-junta py-5 pr-5 pl-[26px] first:border-t-0 before:absolute before:inset-y-0 before:left-0 before:w-1.5 md:grid-cols-[64px_1fr_auto] ${faixa.barra} ${faixa.degrade} ${ocupado ? "opacity-60" : ""}`}
    >
      <div className={`num text-[40px] leading-none font-semibold ${faixa.cor}`}>
        {s.nota}
        <small className="mt-1 block font-sans text-xs font-normal text-aco">de 100</small>
      </div>
      <div className="min-w-0">
        <h3 className="leading-snug"><span className={`titulo-vaga ${faixa.marca}`}>{s.cargo}</span></h3>
        <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-aco">
          <span className="font-medium text-grafite">{s.empresa}</span>
          {local && <span>{local}</span>}
          <span>
            {FONTES.find((f) => f.id === s.fonte)?.nome ?? s.fonte}
            {s.publicada_em ? `, ${quandoPublicada(s.publicada_em, agora)}` : ""}
          </span>
          {s.area === "ia" && <span className="border-l-[3px] border-aco pl-1.5 text-grafite">IA</span>}
          {outras > 0 && (
            <span className="font-medium text-grafite">
              + {outras} {outras === 1 ? "vaga parecida" : "vagas parecidas"} ({[...new Set(grupo.membros.slice(1).map((m) => m.cidade ?? m.local).filter(Boolean))].slice(0, 3).join(", ")}
              {grupo.membros.length > 4 ? "…" : ""})
            </span>
          )}
        </div>
          <button
            type="button"
            className="btn-texto mt-2"
            aria-expanded={aberto}
            aria-controls={idDetalhes}
            onClick={() => setAberto(!aberto)}
          >
            {aberto ? "Veja menos" : "Veja mais"}{" "}
            <span aria-hidden="true" className={`inline-block transition-transform motion-reduce:transition-none ${aberto ? "rotate-180" : ""}`}>
              ▾
            </span>
          </button>
      </div>
      <div className="col-span-full mt-3 flex flex-wrap gap-2 md:col-auto md:mt-0 md:w-44 md:flex-col md:items-stretch">
        <button
          type="button"
          className="btn btn-principal"
          disabled={ocupado}
          onClick={() => iniciar(async () => setAviso(await adicionarSugestao(s.id)))}
        >
          Adicionar à lista
        </button>
        <button type="button" className="btn" disabled={ocupado} onClick={() => iniciar(() => descartarSugestao(grupo.membros.map((m) => m.id)))}>
          {outras > 0 ? "Descartar grupo" : "Descartar"}
        </button>
        <button
          type="button"
          className="btn-texto"
          disabled={ocupado}
          onClick={() => {
            if (confirm(`Esconder as vagas da ${s.empresa} daqui em diante? Dá para desfazer em Configurações.`)) {
              iniciar(() => bloquearEmpresa(s.empresa));
            }
          }}
        >
          Não tenho interesse na empresa
        </button>
        {aviso && (
          <p role="alert" className="text-[13px] text-vermelho">
            {aviso}
          </p>
        )}
      </div>
      {aberto && outras > 0 && <Variacoes membros={grupo.membros} />}
      {aberto && <Detalhes s={s} palavras={palavras} id={idDetalhes} agora={agora} />}
    </li>
  );
}

export function QuadroSugestoes({ modo, sugestoes, palavras, curriculos, perfil, textoUltimaBusca, falhas, eliminadas, agora }: Props) {
  const doEmail = modo === "email";
  const [faixasLigadas, setFaixas] = useState<Set<Faixa>>(new Set(["verde", "amarela", "cinza"]));
  const [areas, setAreas] = useState<Set<string>>(new Set());
  const [fontes, setFontes] = useState<Set<string>>(new Set());
  const [ordem, setOrdem] = useState<"nota" | "data">("nota");
  const [buscando, iniciarBusca] = useTransition();
  const [resultadoBusca, setResultadoBusca] = useState<string | null>(null);

  const alternar = <T,>(conjunto: Set<T>, valor: T, set: (s: Set<T>) => void) => {
    const novo = new Set(conjunto);
    if (novo.has(valor)) novo.delete(valor);
    else novo.add(valor);
    set(novo);
  };

  const porFaixa = useMemo(() => {
    const ordenadas = [...sugestoes].sort((a, b) =>
      ordem === "nota" ? b.nota - a.nota : (b.publicada_em ?? "").localeCompare(a.publicada_em ?? ""),
    );
    const filtradas = ordenadas.filter(
      (s) => (areas.size === 0 || (s.area && areas.has(s.area))) && (fontes.size === 0 || fontes.has(s.fonte)),
    );
    // Vagas repetidas (mesmo programa de trainee, mesmo cargo em outra cidade) viram um cartão só.
    const grupos = agruparSugestoes(filtradas);
    if (ordem === "data") grupos.sort((a, b) => (b.principal.publicada_em ?? "").localeCompare(a.principal.publicada_em ?? ""));
    return Object.fromEntries(FAIXAS.map((f) => [f.id, grupos.filter((g) => faixaDaNota(g.principal.nota) === f.id)])) as Record<
      Faixa,
      Grupo<Sugestao>[]
    >;
  }, [sugestoes, areas, fontes, ordem]);

  const todosGrupos = useMemo(() => agruparSugestoes(sugestoes), [sugestoes]);
  const totalPorFaixa = (f: Faixa) => todosGrupos.filter((g) => faixaDaNota(g.principal.nota) === f).length;
  const conta = (campo: "area" | "fonte", valor: string) => sugestoes.filter((s) => s[campo] === valor).length;
  const mostrando = FAIXAS.reduce((t, f) => t + (faixasLigadas.has(f.id) ? porFaixa[f.id].length : 0), 0);

  return (
    <ContextoCurriculos.Provider value={{ curriculos, perfil }}>
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo-tela">{doEmail ? "Do LinkedIn" : "Sugestões"}</h1>
          <p className="mt-2 text-sm text-aco">
            {textoUltimaBusca} {eliminadas > 0 && `${eliminadas} vagas ficaram de fora pelos filtros do seu perfil.`}
          </p>
          {falhas.length > 0 && (
            <p className="mt-1 text-sm text-vermelho">Não foi possível ler {falhas.join(", ")} na última busca. As outras fontes funcionaram.</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
          <Link href="/historico" className="btn">
            Histórico
          </Link>
          {!doEmail && <button
            type="button"
            className="btn"
            disabled={buscando}
            onClick={() => iniciarBusca(async () => setResultadoBusca(await buscarAgora()))}
          >
            {buscando ? "Buscando vagas…" : "Buscar agora"}
          </button>}
          </div>
          {resultadoBusca && !buscando && <p className="text-[13px] text-aco" aria-live="polite">Busca concluída: {resultadoBusca}</p>}
        </div>
      </div>

      {/* Quadro de controle */}
      <div className="rounded-t-xl bg-grafite px-5 pt-4 text-[#e9ece9]" aria-label="Filtros das sugestões">
        <div className="grid gap-2.5 md:grid-cols-3">
          {FAIXAS.map((f) => {
            const ligada = faixasLigadas.has(f.id);
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={ligada}
                onClick={() => alternar(faixasLigadas, f.id, setFaixas)}
                className={`grid cursor-pointer grid-cols-[auto_1fr] items-center gap-x-3 rounded-lg border border-grafite-3 bg-grafite-2 px-3.5 py-2.5 text-left hover:border-[#6b7a75] ${ligada ? "" : "opacity-45"}`}
              >
                <span aria-hidden="true" className={`row-span-2 size-3.5 rounded-full ${ligada ? `${f.luz} ring-4 ring-white/10` : "bg-[#56625e]"}`} />
                <span className="num text-[28px] leading-none font-semibold">{totalPorFaixa(f.id)}</span>
                <span className="text-[13px] text-aco-claro">{f.lampada}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3 py-3.5 text-sm">
          <div role="group" aria-label="Área" className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-aco-claro">Área</span>
            {[
              { id: "processos", nome: "Processos" },
              { id: "ia", nome: "IA" },
            ].map((a) => (
              <Chave key={a.id} ligada={areas.has(a.id)} onClick={() => alternar(areas, a.id, setAreas)} rotulo={a.nome} n={conta("area", a.id)} />
            ))}
          </div>
          {!doEmail && <div role="group" aria-label="Site" className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-aco-claro">Site</span>
            {FONTES.filter((f) => f.id !== "linkedin").map((f) => (
              <Chave key={f.id} ligada={fontes.has(f.id)} onClick={() => alternar(fontes, f.id, setFontes)} rotulo={f.nome} n={conta("fonte", f.id)} />
            ))}
          </div>}
          <label className="flex items-center gap-2">
            <span className="text-aco-claro">Ordenar por</span>
            <select
              value={ordem}
              onChange={(e) => setOrdem(e.target.value as "nota" | "data")}
              className="rounded-lg border border-grafite-3 bg-grafite-2 px-2 py-1.5"
            >
              <option value="nota">maior nota</option>
              <option value="data">mais recentes</option>
            </select>
          </label>
          <p className="ml-auto text-[13px] text-aco-claro" aria-live="polite">
            Mostrando <strong className="num text-base text-white">{mostrando}</strong> de {todosGrupos.length}
          </p>
        </div>
      </div>

      {/* Lista agrupada por faixa */}
      <div className="overflow-hidden rounded-b-xl border border-t-0 border-junta bg-chapa">
        {FAIXAS.filter((f) => faixasLigadas.has(f.id) && porFaixa[f.id].length > 0).map((f) => (
          <section key={f.id} className="border-t border-junta first:border-t-0">
            <h2 className={`flex items-baseline gap-2.5 border-b border-junta px-5 py-3 font-titulo text-lg font-semibold ${f.cor} ${f.fundo}`}>
              {f.titulo}
              <small className="font-sans text-[13px] font-normal text-aco">
                {porFaixa[f.id].length} {porFaixa[f.id].length === 1 ? "vaga" : "vagas"}
              </small>
            </h2>
            <ol className="flex flex-col gap-2.5 bg-concreto">
              {porFaixa[f.id].map((g) => (
                <LinhaSugestao key={g.principal.id} grupo={g} palavras={palavras} faixa={f} agora={agora} />
              ))}
            </ol>
          </section>
        ))}
        {mostrando === 0 && (
          <p className="px-5 py-7 text-aco">
            {sugestoes.length === 0
              ? "Nenhuma sugestão por enquanto. Clique em Buscar agora para procurar vagas nas fontes."
              : "Nenhuma vaga com esses filtros. Ligue outra faixa de nota ou tire um filtro de área ou site."}
          </p>
        )}
      </div>
    </section>
    </ContextoCurriculos.Provider>
  );
}

function Chave({ ligada, onClick, rotulo, n }: { ligada: boolean; onClick: () => void; rotulo: string; n: number }) {
  return (
    <button
      type="button"
      aria-pressed={ligada}
      onClick={onClick}
      className={`cursor-pointer rounded-full border px-3 py-1 text-[13px] ${
        ligada ? "border-laranja bg-laranja text-grafite" : "border-grafite-3 hover:border-[#8d9a95]"
      }`}
    >
      {rotulo}
      <span className={`num ml-1.5 ${ligada ? "text-grafite" : "text-aco-claro"}`}>{n}</span>
    </button>
  );
}
