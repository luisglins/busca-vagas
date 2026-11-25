"use client";

import { useActionState } from "react";
import { entrar } from "./acoes";

export default function Login() {
  const [erro, acao, enviando] = useActionState(entrar, null);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-24">
      <div>
        <h1 className="titulo-tela flex items-center gap-3">
          <span aria-hidden="true" className="inline-block size-4 bg-laranja" />
          Busca Vagas
        </h1>
        <p className="mt-2 text-aco">Entre para ver suas vagas.</p>
      </div>
      <form action={acao} className="flex flex-col gap-4">
        <label className="rotulo">
          E-mail
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="campo font-normal"
          />
        </label>
        <label className="rotulo">
          Senha
          <input
            name="senha"
            type="password"
            required
            autoComplete="current-password"
            className="campo font-normal"
          />
        </label>
        {erro && (
          <p role="alert" className="text-sm text-vermelho">
            {erro}
          </p>
        )}
        <button
          type="submit"
          disabled={enviando}
          className="btn btn-principal py-3"
        >
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
