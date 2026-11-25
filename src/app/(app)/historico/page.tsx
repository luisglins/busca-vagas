import Link from "next/link";
import { carregarPerfil } from "@/lib/busca-supabase";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { BotaoDesfazer } from "./botao-desfazer";

const quando = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default async function Historico() {
  const supabase = await criarClienteServidor();
  const [{ data }, perfil] = await Promise.all([
    supabase
      .from("sugestoes")
      .select("id, cargo, empresa, nota, estado, decidido_em")
      .in("estado", ["adicionada", "descartada"])
      .not("decidido_em", "is", null)
      .order("decidido_em", { ascending: false })
      .limit(100),
    carregarPerfil(supabase),
  ]);
  const decisoes = data ?? [];

  return (
    <section>
      <Link href="/" className="text-sm text-aco hover:underline">
        Voltar para Sugestões
      </Link>
      <div className="mt-3 mb-6">
        <h1 className="titulo-tela">Histórico</h1>
        <p className="mt-2 text-sm text-aco">O que você adicionou, descartou ou bloqueou. Clicou errado? Desfaça aqui.</p>
      </div>

      <div className="painel">
        <h2 className="border-b border-junta px-5 pt-4 pb-3 font-titulo text-[22px] font-semibold">Sugestões decididas</h2>
        {decisoes.length === 0 ? (
          <p className="px-5 py-4 text-sm text-aco">Nada por aqui ainda. Quando você adicionar ou descartar uma sugestão, ela aparece nesta lista.</p>
        ) : (
          <ul>
            {decisoes.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-4 border-b border-junta-leve px-5 py-3 text-sm last:border-0">
                <div className="min-w-0">
                  <p>
                    <span className={`mr-2 font-medium ${d.estado === "adicionada" ? "text-verde" : "text-aco"}`}>
                      {d.estado === "adicionada" ? "Adicionada" : "Descartada"}
                    </span>
                    <strong className="font-semibold">{d.cargo}</strong>, {d.empresa}
                  </p>
                  <p className="text-[13px] text-aco">
                    nota {d.nota}, em {quando(d.decidido_em!)}
                  </p>
                </div>
                <BotaoDesfazer tipo={d.estado === "adicionada" ? "adicao" : "descarte"} alvo={d.id} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="painel mt-6">
        <h2 className="border-b border-junta px-5 pt-4 pb-3 font-titulo text-[22px] font-semibold">Empresas bloqueadas</h2>
        {perfil.empresasBloqueadas.length === 0 ? (
          <p className="px-5 py-4 text-sm text-aco">Nenhuma empresa bloqueada.</p>
        ) : (
          <ul>
            {perfil.empresasBloqueadas.map((empresa) => (
              <li key={empresa} className="flex items-center justify-between gap-4 border-b border-junta-leve px-5 py-3 text-sm last:border-0">
                <strong className="font-semibold">{empresa}</strong>
                <BotaoDesfazer tipo="bloqueio" alvo={empresa} rotulo="Desbloquear" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
