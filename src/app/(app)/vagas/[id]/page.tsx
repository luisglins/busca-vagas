import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { COR_DA_FAIXA, STATUS, dataCurta, faixaDaNota, type Vaga } from "@/lib/vagas";
import { SeletorStatus } from "../seletor-status";
import { FormularioVaga } from "./formulario";

const ROTULO = Object.fromEntries(STATUS.map((s) => [s.valor, s.rotulo]));

export default async function DetalheVaga({ params }: PageProps<"/vagas/[id]">) {
  const { id } = await params;
  const supabase = await criarClienteServidor();

  const [{ data: vaga }, { data: historico }, { data: curriculos }] = await Promise.all([
    supabase.from("vagas").select("*").eq("id", id).maybeSingle<Vaga>(),
    supabase.from("historico_status").select("*").eq("vaga_id", id).order("data", { ascending: false }),
    supabase.from("curriculos").select("id, nome_versao").order("criado_em", { ascending: false }),
  ]);
  if (!vaga) notFound();

  return (
    <section>
      <Link href="/vagas" className="text-sm text-aco hover:underline">
        Voltar para Minhas vagas
      </Link>

      <div className="mt-3 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="titulo-tela">{vaga.cargo}</h1>
          <p className="mt-2 text-aco">
            <span className="font-medium text-grafite">{vaga.empresa}</span>
            {vaga.local && <span className="ml-4">{vaga.local}</span>}
            <span className="ml-4">encontrada em {dataCurta(vaga.data_encontrada)}</span>
            {vaga.link && (
              <a href={vaga.link} target="_blank" rel="noreferrer" className="ml-4 underline">
                abrir anúncio
              </a>
            )}
          </p>
        </div>
        <label className="rotulo">
          Status
          <SeletorStatus id={vaga.id} status={vaga.status} rotulo={vaga.cargo} />
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <FormularioVaga vaga={vaga} curriculos={curriculos ?? []} />

        <aside className="flex flex-col gap-6">
          <div className="painel p-5">
            <h2 className="font-cond text-[22px] font-semibold">Nota de aderência</h2>
            {vaga.nota_aderencia === null ? (
              <p className="mt-2 text-sm text-aco">Sem nota.</p>
            ) : (
              <>
                <p className={`num mt-2 text-[40px] leading-none font-semibold ${COR_DA_FAIXA[faixaDaNota(vaga.nota_aderencia)]}`}>
                  {vaga.nota_aderencia}
                  <span className="ml-1 font-sans text-xs font-normal text-aco">de 100</span>
                </p>
                {vaga.motivos && vaga.motivos.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1 text-sm text-aco">
                    {vaga.motivos.map((m) => (
                      <li key={m} className={m.includes("−") ? "text-vermelho" : undefined}>
                        {m}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          <div className="painel p-5">
            <h2 className="font-cond text-[22px] font-semibold">Histórico</h2>
            {!historico || historico.length === 0 ? (
              <p className="mt-2 text-sm text-aco">O status ainda não mudou.</p>
            ) : (
              <ol className="mt-3 flex flex-col gap-2 text-sm">
                {historico.map((h) => (
                  <li key={h.id}>
                    <span className="text-aco">{new Date(h.data).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>{" "}
                    {h.status_anterior ? `${ROTULO[h.status_anterior]} para ` : ""}
                    <strong className="font-medium">{ROTULO[h.status_novo]}</strong>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
