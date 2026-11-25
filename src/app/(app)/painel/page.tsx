import Link from "next/link";
import { Fragment } from "react";
import { calcularFluxo } from "@/lib/fluxo";
import { dataComDia, dataCurta, STATUS } from "@/lib/vagas";
import { followupsDaSemana, hojeEmSaoPaulo } from "@/lib/followup";
import { criarClienteServidor } from "@/lib/supabase/servidor";

const ROTULO = Object.fromEntries(STATUS.map((s) => [s.valor, s.rotulo]));

export default async function Painel() {
  const supabase = await criarClienteServidor();
  const hoje = hojeEmSaoPaulo();
  const inicioDoDia = new Date(`${hoje}T00:00:00-03:00`).toISOString();

  const [{ data: vagas }, { data: historico }, { count: novasHoje }] = await Promise.all([
    supabase.from("vagas").select("id, cargo, empresa, status, proximo_followup"),
    supabase.from("historico_status").select("vaga_id, status_anterior, status_novo"),
    supabase.from("sugestoes").select("id", { count: "exact", head: true }).eq("estado", "nova").gte("criado_em", inicioDoDia),
  ]);

  const passou = new Map<string, string[]>();
  for (const h of historico ?? []) {
    const lista = passou.get(h.vaga_id) ?? [];
    lista.push(h.status_novo);
    if (h.status_anterior) lista.push(h.status_anterior);
    passou.set(h.vaga_id, lista);
  }
  const fluxo = calcularFluxo((vagas ?? []).map((v) => ({ status: v.status, passou: passou.get(v.id) ?? [] })));
  const followups = followupsDaSemana(vagas ?? [], hoje);
  const descricaoFluxo = fluxo.etapas.map((e) => `${e.agora} em ${ROTULO[e.etapa]}`).join(", ");

  return (
    <section>
      <div className="mb-6">
        <h1 className="titulo-tela">Painel</h1>
        <p className="mt-2 text-sm text-aco">
          Sua busca como um fluxo: quantas vagas estão em cada etapa e quantas passam para a próxima.
        </p>
      </div>

      <div
        role="img"
        aria-label={`Fluxo: ${descricaoFluxo}`}
        className="painel grid grid-cols-1 items-center gap-2 p-6 md:grid-cols-[1fr_64px_1fr_64px_1fr_64px_1fr] md:gap-0"
      >
        {fluxo.etapas.map((e, i) => (
          <Fragment key={e.etapa}>
            <div className={`rounded border-2 px-4 py-3 ${e.etapa === "oferta" ? "border-verde" : "border-grafite"}`}>
              <div className="text-sm text-aco">{ROTULO[e.etapa]}</div>
              <div className="num text-[40px] leading-tight font-semibold">{e.agora}</div>
            </div>
            {i < fluxo.passagens.length && (
              <div className="flex flex-col items-center text-[13px] text-aco" title="Quantas das vagas que chegaram nesta etapa passaram para a próxima">
                <span>{fluxo.passagens[i] === null ? "—" : `${fluxo.passagens[i]}%`}</span>
                <svg aria-hidden="true" width="52" height="10" viewBox="0 0 52 10" className="hidden md:block">
                  <line x1="0" y1="5" x2="44" y2="5" stroke="currentColor" strokeWidth="2" className="text-grafite" />
                  <path d="M44 0 L52 5 L44 10 Z" className="fill-grafite" />
                </svg>
              </div>
            )}
          </Fragment>
        ))}
      </div>
      <p className="mt-3 text-sm text-aco">
        {fluxo.recusadas.total === 0 ? (
          "Nenhuma recusa até agora."
        ) : (
          <>
            Recusadas: <strong className="num text-lg text-grafite">{fluxo.recusadas.total}</strong>
            {" — "}
            {(["interessado", "apliquei", "entrevista"] as const)
              .filter((e) => fluxo.recusadas.porEtapa[e] > 0)
              .map((e) => `${fluxo.recusadas.porEtapa[e]} depois de ${ROTULO[e].toLowerCase()}`)
              .join(", ")}
            .
          </>
        )}
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-[2fr_1fr]">
        <div className="painel">
          <h2 className="border-b border-junta px-5 pt-4 pb-3 font-cond text-[22px] font-semibold">Follow-ups desta semana</h2>
          {followups.length === 0 ? (
            <p className="px-5 py-4 text-sm text-aco">Nada para cobrar esta semana.</p>
          ) : (
            <ul>
              {followups.map((v) => (
                <li key={v.id} className="flex justify-between gap-4 border-b border-junta-leve px-5 py-3 text-sm last:border-0">
                  <span>
                    <Link href={`/vagas/${v.id}`} className="font-semibold underline-offset-2 hover:underline">
                      {v.cargo}
                    </Link>
                    , {v.empresa}, {ROTULO[v.status].toLowerCase()}
                  </span>
                  {v.proximo_followup! < hoje ? (
                    <span className="whitespace-nowrap font-medium text-vermelho">atrasado desde {dataCurta(v.proximo_followup!)}</span>
                  ) : (
                    <span className="whitespace-nowrap">{dataComDia(v.proximo_followup!)}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="painel">
          <h2 className="border-b border-junta px-5 pt-4 pb-3 font-cond text-[22px] font-semibold">Hoje</h2>
          <div className="px-5 py-4">
            <div className="num text-[56px] leading-none font-semibold">{novasHoje ?? 0}</div>
            <p className="mt-1 text-sm text-aco">sugestões novas</p>
            <p className="mt-3 text-sm">
              <Link href="/" className="underline">
                Ver sugestões
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
