"use client";

import { useActionState } from "react";
import { entrar } from "./acoes";

export default function Login() {
  const [erro, acao, enviando] = useActionState(entrar, null);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-24">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Busca Vagas</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">Entre para ver suas vagas.</p>
      </div>
      <form action={acao} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          E-mail
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-md border border-zinc-300 px-3 py-2 font-normal dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Senha
          <input
            name="senha"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-md border border-zinc-300 px-3 py-2 font-normal dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        {erro && (
          <p role="alert" className="text-sm text-red-600">
            {erro}
          </p>
        )}
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
