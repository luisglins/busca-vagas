import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com a chave SECRETA: ignora o RLS. Só para tarefas sem usuário logado (a busca diária).
 * Nunca importe isto em componente do navegador.
 */
export function criarClienteAdmin() {
  const chave = process.env.SUPABASE_SECRET_KEY;
  if (!chave) throw new Error("SUPABASE_SECRET_KEY não configurada.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
