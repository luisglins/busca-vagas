"use client";

import { useState, useTransition } from "react";
import { desbloquearEmpresa, desfazerAdicao, desfazerDescarte } from "./acoes";

const ACOES = { descarte: desfazerDescarte, adicao: desfazerAdicao, bloqueio: desbloquearEmpresa };

/** Botão "Desfazer" do histórico; mostra o aviso quando não dá para desfazer. */
export function BotaoDesfazer({ tipo, alvo, rotulo = "Desfazer" }: { tipo: keyof typeof ACOES; alvo: string; rotulo?: string }) {
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();
  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" className="btn py-2" disabled={ocupado} onClick={() => iniciar(async () => setAviso(await ACOES[tipo](alvo)))}>
        {ocupado ? "Desfazendo…" : rotulo}
      </button>
      {aviso && (
        <p role="alert" className="max-w-xs text-right text-[13px] text-vermelho">
          {aviso}
        </p>
      )}
    </div>
  );
}
