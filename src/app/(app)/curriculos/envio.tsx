"use client";

import { useState } from "react";
import { validarPdf } from "@/lib/arquivo";
import { criarClienteNavegador } from "@/lib/supabase/navegador";
import { registrarCurriculo } from "./acoes";

/** Formulário de envio: o PDF vai direto do navegador para o Storage privado. */
export function EnvioCurriculo() {
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(form: FormData) {
    setErro(null);
    const arquivo = form.get("arquivo") as File;
    const nome = String(form.get("nome") ?? "");
    const problema = validarPdf(arquivo);
    if (problema) return setErro(problema);

    setEnviando(true);
    const caminho = `${crypto.randomUUID()}.pdf`;
    const { error } = await criarClienteNavegador()
      .storage.from("curriculos")
      .upload(caminho, arquivo, { contentType: "application/pdf" });
    if (error) {
      setEnviando(false);
      return setErro("Não foi possível enviar o PDF. Tente de novo.");
    }
    const falha = await registrarCurriculo(nome, caminho);
    setEnviando(false);
    if (falha) setErro(falha);
  }

  return (
    <form action={enviar} className="painel grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end" aria-label="Enviar currículo">
      <label className="rotulo">
        Nome da versão
        <input name="nome" required placeholder="Ex.: Processos v3" className="campo font-normal" />
      </label>
      <label className="rotulo">
        Arquivo PDF (até 5 MB)
        <input name="arquivo" type="file" accept="application/pdf,.pdf" required className="campo py-1.5 font-normal" />
      </label>
      <button type="submit" className="btn btn-principal" disabled={enviando}>
        {enviando ? "Enviando…" : "Enviar versão"}
      </button>
      {erro && (
        <p role="alert" className="text-sm text-vermelho md:col-span-3">
          {erro}
        </p>
      )}
    </form>
  );
}
