"use client";

import { useState, useTransition } from "react";
import { excluirCurriculo, linkDoCurriculo } from "./acoes";

/** Ações de uma versão de currículo: abrir (link temporário) e excluir. */
export function AcoesCurriculo({ id, nome }: { id: string; nome: string }) {
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-4">
        <button
          type="button"
          className="btn-texto font-medium text-grafite underline"
          disabled={ocupado}
          onClick={() =>
            iniciar(async () => {
              const url = await linkDoCurriculo(id);
              if (url) window.open(url, "_blank", "noopener");
              else setAviso("Não foi possível abrir o arquivo.");
            })
          }
        >
          Abrir
        </button>
        <button
          type="button"
          className="btn-texto"
          disabled={ocupado}
          onClick={() => {
            if (!confirm(`Excluir a versão "${nome}"? O PDF será apagado.`)) return;
            iniciar(async () => setAviso(await excluirCurriculo(id)));
          }}
        >
          Excluir
        </button>
      </div>
      {aviso && (
        <p role="alert" className="max-w-xs text-right text-[13px] text-vermelho">
          {aviso}
        </p>
      )}
    </div>
  );
}
