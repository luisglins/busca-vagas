"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { composicaoDaNota, marcarPalavras, separarSecoes } from "@/lib/descricao";
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

interface Props {
  sugestoes: Sugestao[];
  palavras: string[];
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
];

const FAIXAS: { id: Faixa; titulo: string; lampada: string; luz: string; cor: string; fundo: string; barra: string; marca: string }[] = [
  { id: "verde", titulo: "Vale aplicar", lampada: "Vale aplicar, nota 70 ou mais", luz: "bg-verde-luz", cor: "text-verde", fundo: "bg-verde-claro", barra: "before:bg-verde", marca: "marca-verde" },
  { id: "amarela", titulo: "Avalie antes de aplicar", lampada: "Avalie, nota de 40 a 69", luz: "bg-laranja", cor: "text-laranja-escuro", fundo: "bg-[#fdf3e1]", barra: "before:bg-laranja-escuro", marca: "marca-amarela" },
  { id: "cinza", titulo: "Pouco aderente", lampada: "Pouco aderente, abaixo de 40", luz: "bg-[#9aa6a1]", cor: "text-cinza-nota", fundo: "bg-[#f1f3f1]", barra: "before:bg-cinza-nota", marca: "marca-cinza" },
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

function corDoSegmento(nome: string): string {
  if (nome === "processos") return "bg-grafite";
  if (nome.startsWith("IA")) return "bg-aco";
  if (nome === "ferramentas") return "bg-seg-ferr";
  return "bg-seg-ctx";
}

/** Barra de composição da nota: cada categoria é um trecho; penalidades hachuradas em vermelho. */
function BarraDaNota({ motivos }: { motivos: string[] }) {
  const c = composicaoDaNota(motivos);
  // Cada trecho começa onde o anterior terminou.
  const segmentos = c.positivos.map((p, i) => ({
    ...p,
    inicio: c.positivos.slice(0, i).reduce((t, q) => t + q.pontos, 0),
  }));
  const x = c.positivos.reduce((t, p) => t + p.pontos, 0);
  const penalidade = c.negativos.reduce((t, n) => t + n.pontos, 0);
  const rotulo = [...c.positivos.map((p) => `${p.nome} ${p.pontos}`), ...c.negativos.map((n) => `${n.nome} menos ${n.pontos}`)].join(", ");

  return (
    <div className="col-span-full mt-3 md:col-[2/3]">
      <div role="img" aria-label={`Composição da nota: ${rotulo}`} className="relative h-3 max-w-[520px] overflow-hidden rounded-sm bg-[repeating-linear-gradient(90deg,#f3f4f1_0_9.6%,#e6e8e4_9.6%_10%)]">
        {segmentos.map((s) => (
          <span key={s.nome} className={`absolute inset-y-0 ${corDoSegmento(s.nome)}`} style={{ left: `${Math.min(s.inicio, 100)}%`, width: `${Math.max(0, Math.min(s.pontos, 100 - s.inicio))}%` }} />
        ))}
        {penalidade > 0 && (
          <span
            className="absolute inset-y-0 bg-[repeating-linear-gradient(135deg,#b3261e_0_3px,#f3d6d3_3px_6px)]"
            style={{ left: `${Math.max(0, Math.min(x, 100) - penalidade)}%`, width: `${Math.min(penalidade, Math.min(x, 100))}%` }}
          />
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-aco">
        {c.positivos.map((p) => (
          <li key={p.nome} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`inline-block size-2.5 ${corDoSegmento(p.nome)}`} />
            {p.nome} {p.pontos}
          </li>
        ))}
        {c.negativos.map((n) => (
          <li key={n.nome} className="flex items-center gap-1.5 text-vermelho">
            <span aria-hidden="true" className="inline-block size-2.5 bg-[repeating-linear-gradient(135deg,#b3261e_0_2px,#f3d6d3_2px_4px)]" />
            {n.nome} −{n.pontos}
          </li>
        ))}
      </ul>
    </div>
  );
}

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
    <div id={id} className="col-span-full mt-3 grid gap-6 border-t border-dashed border-junta pt-4 text-sm md:grid-cols-[1fr_1fr_220px]">
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

function LinhaSugestao({ s, palavras, faixa, agora }: { s: Sugestao; palavras: string[]; faixa: (typeof FAIXAS)[number]; agora: number }) {
  const [aberto, setAberto] = useState(false);
  const [ocupado, iniciar] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);
  const local = [s.cidade ?? (s.modalidade?.startsWith("remoto") ? null : s.local), MODALIDADE[s.modalidade ?? ""]].filter(Boolean).join(", ");
  const idDetalhes = `detalhes-${s.id}`;

  return (
    <li
      className={`relative grid grid-cols-[52px_1fr] gap-x-5 gap-y-1 border-y border-junta bg-chapa py-5 pr-5 pl-[26px] first:border-t-0 before:absolute before:inset-y-0 before:left-0 before:w-1.5 md:grid-cols-[64px_1fr_auto] ${faixa.barra} ${ocupado ? "opacity-60" : ""}`}
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
        </div>
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
        <button type="button" className="btn" disabled={ocupado} onClick={() => iniciar(() => descartarSugestao(s.id))}>
          Descartar
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
      {s.motivos && s.motivos.length > 0 && <BarraDaNota motivos={s.motivos} />}
      <button
        type="button"
        className="btn-texto col-span-full justify-self-start md:col-[2/3]"
        aria-expanded={aberto}
        aria-controls={idDetalhes}
        onClick={() => setAberto(!aberto)}
      >
        {aberto ? "Veja menos" : "Veja mais"}{" "}
        <span aria-hidden="true" className={`inline-block transition-transform motion-reduce:transition-none ${aberto ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      {aberto && <Detalhes s={s} palavras={palavras} id={idDetalhes} agora={agora} />}
    </li>
  );
}

export function QuadroSugestoes({ sugestoes, palavras, textoUltimaBusca, falhas, eliminadas, agora }: Props) {
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
    return Object.fromEntries(FAIXAS.map((f) => [f.id, filtradas.filter((s) => faixaDaNota(s.nota) === f.id)])) as Record<Faixa, Sugestao[]>;
  }, [sugestoes, areas, fontes, ordem]);

  const totalPorFaixa = (f: Faixa) => sugestoes.filter((s) => faixaDaNota(s.nota) === f).length;
  const conta = (campo: "area" | "fonte", valor: string) => sugestoes.filter((s) => s[campo] === valor).length;
  const mostrando = FAIXAS.reduce((t, f) => t + (faixasLigadas.has(f.id) ? porFaixa[f.id].length : 0), 0);

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo-tela">Sugestões</h1>
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
          <button
            type="button"
            className="btn"
            disabled={buscando}
            onClick={() => iniciarBusca(async () => setResultadoBusca(await buscarAgora()))}
          >
            {buscando ? "Buscando vagas…" : "Buscar agora"}
          </button>
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
          <div role="group" aria-label="Site" className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-aco-claro">Site</span>
            {FONTES.map((f) => (
              <Chave key={f.id} ligada={fontes.has(f.id)} onClick={() => alternar(fontes, f.id, setFontes)} rotulo={f.nome} n={conta("fonte", f.id)} />
            ))}
          </div>
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
            Mostrando <strong className="num text-base text-white">{mostrando}</strong> de {sugestoes.length}
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
              {porFaixa[f.id].map((s) => (
                <LinhaSugestao key={s.id} s={s} palavras={palavras} faixa={f} agora={agora} />
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
