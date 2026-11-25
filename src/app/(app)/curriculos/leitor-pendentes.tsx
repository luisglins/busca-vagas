"use client";

import { useEffect, useRef } from "react";
import { lerTextosPendentes } from "./acoes";

/** Lê, uma vez, o texto dos PDFs que ainda não foram lidos (currículos antigos). */
export function LeitorPendentes({ pendentes }: { pendentes: number }) {
  const rodou = useRef(false);
  useEffect(() => {
    if (pendentes > 0 && !rodou.current) {
      rodou.current = true;
      void lerTextosPendentes();
    }
  }, [pendentes]);
  return pendentes > 0 ? (
    <p className="mt-2 text-sm text-aco" aria-live="polite">
      Lendo o texto de {pendentes} {pendentes === 1 ? "currículo" : "currículos"} para comparar com as vagas…
    </p>
  ) : null;
}
