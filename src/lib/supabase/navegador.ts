import { createBrowserClient } from "@supabase/ssr";

/** Cliente Supabase para componentes do navegador (usa a sessão do cookie). */
export function criarClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
