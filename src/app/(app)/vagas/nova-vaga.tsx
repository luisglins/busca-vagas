"use client";

import { useActionState, useState } from "react";
import { criarVaga, type EstadoForm } from "./acoes";
import { ImportarCsv } from "./importar-csv";

/** Cabeçalho da tela com "Importar CSV" e "Nova vaga"; cada um abre seu painel logo abaixo. */
export function CabecalhoComNovaVaga({ hoje, children }: { hoje: string; children: React.ReactNode }) {
  const [painel, setPainel] = useState<"nova" | "csv" | null>(null);
  const aberto = painel === "nova";
  const setAberto = (abrir: boolean) => setPainel(abrir ? "nova" : null);
  // Salva no servidor e, se deu certo, fecha o formulário (o React limpa os campos sozinho).
  const [estado, acao, salvando] = useActionState<EstadoForm, FormData>(async (anterior, dados) => {
    const resultado = await criarVaga(anterior, dados);
    if (resultado.ok) setAberto(false);
    return resultado;
  }, { erro: null });

  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        {children}
        <div className="flex gap-2">
          <button type="button" className="btn" aria-expanded={painel === "csv"} onClick={() => setPainel(painel === "csv" ? null : "csv")}>
            {painel === "csv" ? "Fechar importação" : "Importar CSV"}
          </button>
          <button type="button" className="btn btn-principal" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>
            {aberto ? "Fechar formulário" : "Nova vaga"}
          </button>
        </div>
      </div>
      {painel === "csv" && <ImportarCsv aoTerminar={() => setPainel(null)} />}
      {aberto && (
        <form
          action={acao}
          className="painel mt-4 grid gap-4 p-5 md:grid-cols-2"
          aria-label="Cadastrar vaga"
        >
          <label className="rotulo">
            Empresa
            <input name="empresa" required className="campo font-normal" autoFocus />
          </label>
          <label className="rotulo">
            Cargo
            <input name="cargo" required className="campo font-normal" />
          </label>
          <label className="rotulo">
            Link do anúncio
            <input name="link" type="url" placeholder="https://" className="campo font-normal" />
          </label>
          <label className="rotulo">
            Encontrei em
            <input name="data_encontrada" type="date" defaultValue={hoje} className="campo font-normal" />
          </label>
          <label className="rotulo md:col-span-2">
            Descrição da vaga
            <span className="text-[13px] font-normal text-aco">Cole o texto do anúncio para a vaga receber nota de aderência.</span>
            <textarea name="descricao" rows={4} className="campo font-normal" />
          </label>
          <label className="rotulo md:col-span-2">
            Notas
            <textarea name="notas" rows={2} className="campo font-normal" />
          </label>
          <div className="flex items-center gap-4 md:col-span-2">
            <button type="submit" className="btn btn-principal" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar vaga"}
            </button>
            {estado.erro && (
              <p role="alert" className="text-sm text-vermelho">
                {estado.erro}
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
