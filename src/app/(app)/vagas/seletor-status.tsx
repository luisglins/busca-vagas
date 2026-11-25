"use client";

import { useTransition } from "react";
import { STATUS } from "@/lib/vagas";
import type { Status } from "@/lib/tipos";
import { mudarStatus } from "./acoes";

/** Select de status que salva assim que muda. */
export function SeletorStatus({ id, status, rotulo }: { id: string; status: Status; rotulo: string }) {
  const [salvando, iniciar] = useTransition();
  return (
    <select
      aria-label={`Status de ${rotulo}`}
      defaultValue={status}
      disabled={salvando}
      onChange={(e) => {
        const novo = e.target.value;
        iniciar(() => mudarStatus(id, novo));
      }}
      className="campo w-auto py-1 disabled:opacity-60"
    >
      {STATUS.map((s) => (
        <option key={s.valor} value={s.valor}>
          {s.rotulo}
        </option>
      ))}
    </select>
  );
}
