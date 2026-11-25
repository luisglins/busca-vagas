import { criarClienteServidor } from "@/lib/supabase/servidor";
import { EnvioCurriculo } from "./envio";
import { AcoesCurriculo } from "./item";

export default async function Curriculos() {
  const supabase = await criarClienteServidor();
  const [{ data: curriculos }, { data: usos }] = await Promise.all([
    supabase.from("curriculos").select("id, nome_versao, criado_em").order("criado_em", { ascending: false }),
    supabase.from("vagas").select("curriculo_id").not("curriculo_id", "is", null),
  ]);

  const usadoEm = new Map<string, number>();
  for (const u of usos ?? []) usadoEm.set(u.curriculo_id, (usadoEm.get(u.curriculo_id) ?? 0) + 1);

  return (
    <section>
      <div className="mb-5">
        <h1 className="titulo-tela">Currículos</h1>
        <p className="mt-2 text-sm text-aco">Guarde cada versão e veja para quantas vagas ela foi. Os arquivos ficam privados.</p>
      </div>

      <EnvioCurriculo />

      <div className="painel mt-6">
        {!curriculos || curriculos.length === 0 ? (
          <p className="p-6 text-sm text-aco">Nenhuma versão ainda. Envie seu currículo em PDF acima.</p>
        ) : (
          <ul>
            {curriculos.map((c) => {
              const n = usadoEm.get(c.id) ?? 0;
              return (
                <li key={c.id} className="flex items-center justify-between gap-4 border-b border-junta-leve px-5 py-4 last:border-0">
                  <div>
                    <p className="font-semibold">{c.nome_versao}</p>
                    <p className="text-sm text-aco">
                      enviado em {new Date(c.criado_em).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })},{" "}
                      {n === 0 ? "ainda não usado" : `usado em ${n} ${n === 1 ? "vaga" : "vagas"}`}
                    </p>
                  </div>
                  <AcoesCurriculo id={c.id} nome={c.nome_versao} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
