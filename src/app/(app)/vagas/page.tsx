import Link from "next/link";
import { hojeEmSaoPaulo } from "@/lib/followup";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { COR_DA_FAIXA, dataComDia, dataCurta, faixaDaNota, marcaDaNota, type Vaga } from "@/lib/vagas";
import { CabecalhoComNovaVaga } from "./nova-vaga";
import { SeletorStatus } from "./seletor-status";

export default async function MinhasVagas() {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("vagas")
    .select("*, curriculos(nome_versao)")
    .order("data_encontrada", { ascending: false })
    .order("criado_em", { ascending: false });
  const vagas = (data ?? []) as Vaga[];
  const hoje = hojeEmSaoPaulo();

  return (
    <section>
      <CabecalhoComNovaVaga hoje={hoje}>
        <div>
          <h1 className="titulo-tela">Minhas vagas</h1>
          <p className="mt-2 text-sm text-aco">
            {vagas.length === 0
              ? "Nenhuma vaga em acompanhamento ainda."
              : `${vagas.length} ${vagas.length === 1 ? "vaga" : "vagas"} em acompanhamento. Mude o status direto na linha.`}
          </p>
        </div>
      </CabecalhoComNovaVaga>

      {error && (
        <p role="alert" className="painel mb-4 p-4 text-sm text-vermelho">
          Não foi possível carregar as vagas. Recarregue a página.
        </p>
      )}

      {vagas.length === 0 ? (
        <div className="painel p-8">
          <p className="font-medium">Cadastre a primeira vaga ou adicione uma sugestão.</p>
          <p className="mt-1 text-sm text-aco">
            Use o botão Nova vaga para uma vaga que você achou por conta própria, ou abra as{" "}
            <Link href="/" className="underline">
              Sugestões
            </Link>{" "}
            e clique em Adicionar à lista.
          </p>
        </div>
      ) : (
        <div className="painel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-junta text-left text-aco">
                <th className="px-4 py-3 font-medium">Vaga</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Nota</th>
                <th className="px-4 py-3 font-medium">Currículo enviado</th>
                <th className="px-4 py-3 font-medium">Próximo follow-up</th>
                <th className="px-4 py-3 font-medium">Encontrada em</th>
              </tr>
            </thead>
            <tbody>
              {vagas.map((v) => {
                const atrasado = v.proximo_followup !== null && v.proximo_followup < hoje;
                return (
                  <tr key={v.id} className="border-b border-junta-leve align-top last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/vagas/${v.id}`} className={`titulo-vaga text-[17px] ${marcaDaNota(v.nota_aderencia)}`}>
                        {v.cargo}
                      </Link>
                      <div className="mt-0.5 text-aco">{v.empresa}</div>
                    </td>
                    <td className="px-4 py-3">
                      <SeletorStatus id={v.id} status={v.status} rotulo={v.cargo} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {v.nota_aderencia === null ? (
                        <span className="text-[#a7b0ac]">—</span>
                      ) : (
                        <span className={`num text-lg font-semibold ${COR_DA_FAIXA[faixaDaNota(v.nota_aderencia)]}`}>
                          {v.nota_aderencia}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {v.curriculos?.nome_versao ?? <span className="text-[#a7b0ac]">nenhum ainda</span>}
                    </td>
                    <td className="px-4 py-3">
                      {v.proximo_followup === null ? (
                        <span className="text-[#a7b0ac]">—</span>
                      ) : atrasado ? (
                        <span className="font-medium text-vermelho">{dataCurta(v.proximo_followup)}, atrasado</span>
                      ) : (
                        dataComDia(v.proximo_followup)
                      )}
                    </td>
                    <td className="px-4 py-3 text-aco">{dataCurta(v.data_encontrada)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
