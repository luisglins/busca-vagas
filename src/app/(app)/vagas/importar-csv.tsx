"use client";

import { useState, useTransition } from "react";
import { lerCsvVagas, type VagaDoCsv } from "@/lib/csv";
import { dataCurta } from "@/lib/vagas";
import { importarVagas } from "./acoes";

/** Painel "Importar CSV": lê o arquivo no navegador, mostra uma prévia e só grava ao confirmar. */
export function ImportarCsv({ aoTerminar }: { aoTerminar: () => void }) {
  const [vagas, setVagas] = useState<VagaDoCsv[]>([]);
  const [erros, setErros] = useState<string[]>([]);
  const [resultado, setResultado] = useState<string | null>(null);
  const [importando, iniciar] = useTransition();

  async function ler(arquivo: File | undefined) {
    setResultado(null);
    if (!arquivo) return;
    const r = lerCsvVagas(await arquivo.text());
    setVagas(r.vagas);
    setErros(r.erros);
  }

  return (
    <div className="painel mt-4 flex flex-col gap-4 p-5" aria-label="Importar vagas de um CSV">
      <div className="flex flex-wrap items-end gap-4">
        <label className="rotulo flex-1">
          Arquivo CSV
          <span className="text-[13px] font-normal text-aco">
            Colunas: empresa e cargo (obrigatórias), link, data, notas, descrição. Pode salvar direto do Excel.{" "}
            <a href="/modelo-vagas.csv" download className="underline">
              Baixar modelo
            </a>
          </span>
          <input type="file" accept=".csv,text/csv" onChange={(e) => ler(e.target.files?.[0])} className="campo py-1.5 font-normal" />
        </label>
      </div>

      {(vagas.length > 0 || erros.length > 0) && (
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            <strong className="num text-lg">{vagas.length}</strong> {vagas.length === 1 ? "vaga pronta" : "vagas prontas"} para importar
            {erros.length > 0 && <span className="text-vermelho">, {erros.length} com problema (ficam de fora)</span>}.
          </p>
          {vagas.length > 0 && (
            <ul className="max-h-48 overflow-auto rounded-lg border border-junta-leve text-sm">
              {vagas.slice(0, 50).map((v, i) => (
                <li key={i} className="flex justify-between gap-4 border-b border-junta-leve px-3 py-1.5 last:border-0">
                  <span>
                    <strong className="font-semibold">{v.cargo}</strong>, {v.empresa}
                  </span>
                  <span className="text-aco">{v.data_encontrada ? dataCurta(v.data_encontrada) : "hoje"}</span>
                </li>
              ))}
              {vagas.length > 50 && <li className="px-3 py-1.5 text-aco">e mais {vagas.length - 50}…</li>}
            </ul>
          )}
          {erros.length > 0 && (
            <ul className="text-[13px] text-vermelho">
              {erros.slice(0, 10).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
          {vagas.length > 0 && (
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="btn btn-principal"
                disabled={importando}
                onClick={() =>
                  iniciar(async () => {
                    const r = await importarVagas(vagas);
                    if (r.erro) return setResultado(r.erro);
                    setResultado(
                      `${r.importadas} ${r.importadas === 1 ? "vaga importada" : "vagas importadas"}` +
                        (r.repetidas > 0 ? `, ${r.repetidas} já estavam na lista.` : "."),
                    );
                    setVagas([]);
                    setErros([]);
                    if (r.importadas > 0) setTimeout(aoTerminar, 2500);
                  })
                }
              >
                {importando ? "Importando…" : `Importar ${vagas.length} ${vagas.length === 1 ? "vaga" : "vagas"}`}
              </button>
            </div>
          )}
        </div>
      )}
      {resultado && (
        <p className="text-sm text-verde" aria-live="polite">
          {resultado}
        </p>
      )}
    </div>
  );
}
