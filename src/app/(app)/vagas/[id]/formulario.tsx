"use client";

import { useActionState } from "react";
import type { Vaga } from "@/lib/vagas";
import { atualizarVaga, excluirVaga, type EstadoForm } from "../acoes";

interface Props {
  vaga: Vaga;
  curriculos: { id: string; nome_versao: string }[];
}

/** Campos editáveis da vaga + botão de excluir. */
export function FormularioVaga({ vaga, curriculos }: Props) {
  const [estado, acao, salvando] = useActionState<EstadoForm, FormData>(atualizarVaga.bind(null, vaga.id), {
    erro: null,
  });

  return (
    <form action={acao} className="painel grid gap-4 p-5 md:grid-cols-2" aria-label="Editar vaga">
      <label className="rotulo">
        Empresa
        <input name="empresa" required defaultValue={vaga.empresa} className="campo font-normal" />
      </label>
      <label className="rotulo">
        Cargo
        <input name="cargo" required defaultValue={vaga.cargo} className="campo font-normal" />
      </label>
      <label className="rotulo">
        Link do anúncio
        <input name="link" type="url" defaultValue={vaga.link ?? ""} className="campo font-normal" />
      </label>
      <label className="rotulo">
        Local
        <input name="local" defaultValue={vaga.local ?? ""} className="campo font-normal" />
      </label>
      <label className="rotulo">
        Currículo enviado
        <select name="curriculo_id" defaultValue={vaga.curriculo_id ?? ""} className="campo font-normal">
          <option value="">Nenhum</option>
          {curriculos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome_versao}
            </option>
          ))}
        </select>
        {curriculos.length === 0 && (
          <span className="text-[13px] font-normal text-aco">Envie um PDF na tela Currículos para escolher aqui.</span>
        )}
      </label>
      <label className="rotulo">
        Próximo follow-up
        <input
          name="proximo_followup"
          type="date"
          defaultValue={vaga.proximo_followup ?? ""}
          className="campo font-normal"
        />
      </label>
      <label className="rotulo md:col-span-2">
        Notas
        <textarea name="notas" rows={3} defaultValue={vaga.notas ?? ""} className="campo font-normal" />
      </label>
      <label className="rotulo md:col-span-2">
        Descrição da vaga
        <textarea name="descricao" rows={6} defaultValue={vaga.descricao ?? ""} className="campo font-normal" />
      </label>
      <div className="flex flex-wrap items-center gap-4 md:col-span-2">
        <button type="submit" className="btn btn-principal" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar alterações"}
        </button>
        {estado.ok && !salvando && <p className="text-sm text-verde">Alterações salvas.</p>}
        {estado.erro && (
          <p role="alert" className="text-sm text-vermelho">
            {estado.erro}
          </p>
        )}
        <button
          type="button"
          className="btn-texto ml-auto text-vermelho"
          onClick={() => {
            if (confirm(`Excluir a vaga "${vaga.cargo}"? Isso não pode ser desfeito.`)) excluirVaga(vaga.id);
          }}
        >
          Excluir vaga
        </button>
      </div>
    </form>
  );
}
