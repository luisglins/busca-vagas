"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { pontuar } from "@/lib/pontuar";
import type { Perfil } from "@/lib/tipos";
import { COR_DA_FAIXA, faixaDaNota } from "@/lib/vagas";
import { criarVaga, type EstadoForm } from "../vagas/acoes";

interface Props {
  inicial: { cargo: string; empresa: string; link: string; descricao: string };
  perfil: Perfil;
  hoje: string;
}

/** Formulário que o botão "Salvar no meu site" abre, já preenchido, com a nota calculada na hora. */
export function FormularioSalvar({ inicial, perfil, hoje }: Props) {
  const [cargo, setCargo] = useState(inicial.cargo);
  const [empresa, setEmpresa] = useState(inicial.empresa);
  const [descricao, setDescricao] = useState(inicial.descricao);
  const [estado, acao, salvando] = useActionState<EstadoForm, FormData>(criarVaga, { erro: null });

  const resultado = useMemo(
    () =>
      pontuar(
        { fonte: "manual", idExterno: "", empresa, cargo, link: "", modalidade: "desconhecida", localTexto: "", descricao },
        { ...perfil, empresasBloqueadas: [], aceitarOutrasCidades: true },
      ),
    [cargo, empresa, descricao, perfil],
  );
  const nota = resultado.eliminada ? 0 : resultado.nota;

  if (estado.ok) {
    return (
      <div className="painel p-6">
        <p className="font-titulo text-2xl font-bold">Vaga salva.</p>
        <p className="mt-1 text-sm text-aco">Ela já está em Minhas vagas com a nota {nota}. Pode fechar esta aba.</p>
        <Link href="/vagas" className="btn btn-principal mt-4">
          Ver Minhas vagas
        </Link>
      </div>
    );
  }

  return (
    <form action={acao} className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="painel grid gap-4 p-5 md:grid-cols-2">
        <label className="rotulo">
          Cargo
          <input name="cargo" required value={cargo} onChange={(e) => setCargo(e.target.value)} className="campo font-normal" />
        </label>
        <label className="rotulo">
          Empresa
          <input name="empresa" required value={empresa} onChange={(e) => setEmpresa(e.target.value)} className="campo font-normal" />
        </label>
        <label className="rotulo md:col-span-2">
          Link do anúncio
          <input name="link" type="url" defaultValue={inicial.link} className="campo font-normal" />
        </label>
        <label className="rotulo md:col-span-2">
          Descrição da vaga
          <span className="text-[13px] font-normal text-aco">
            {inicial.descricao ? "Veio do texto que você selecionou na página." : "Selecione a descrição na página antes de clicar no botão, ou cole aqui."}
          </span>
          <textarea name="descricao" rows={8} value={descricao} onChange={(e) => setDescricao(e.target.value)} className="campo font-normal" />
        </label>
        <label className="rotulo md:col-span-2">
          Notas
          <textarea name="notas" rows={2} className="campo font-normal" />
        </label>
        <input type="hidden" name="data_encontrada" value={hoje} />
        <div className="flex items-center gap-4 md:col-span-2">
          <button type="submit" className="btn btn-principal" disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar em Minhas vagas"}
          </button>
          {estado.erro && (
            <p role="alert" className="text-sm text-vermelho">
              {estado.erro}
            </p>
          )}
        </div>
      </div>
      <aside className="painel h-fit p-5">
        <h2 className="font-titulo text-[22px] font-semibold">Nota de aderência</h2>
        <p className={`num mt-2 text-[40px] leading-none font-semibold ${COR_DA_FAIXA[faixaDaNota(nota)]}`}>
          {nota}
          <span className="ml-1 font-sans text-xs font-normal text-aco">de 100</span>
        </p>
        <ul className="mt-3 flex flex-col gap-1 text-sm text-aco">
          {resultado.eliminada ? (
            <li className="text-vermelho">{resultado.motivoEliminacao}</li>
          ) : (
            resultado.motivos.map((m) => (
              <li key={m} className={m.includes("−") ? "text-vermelho" : undefined}>
                {m}
              </li>
            ))
          )}
        </ul>
        <p className="mt-3 text-[13px] text-aco">A nota muda enquanto você edita o cargo e a descrição.</p>
      </aside>
    </form>
  );
}
