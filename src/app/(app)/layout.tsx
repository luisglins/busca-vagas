import Link from "next/link";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { sair } from "../login/acoes";
import { Menu } from "./menu";

// Layout de todas as páginas que exigem login.
export default async function LayoutLogado({ children }: LayoutProps<"/">) {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="bg-grafite text-[#e9ece9]">
        <nav aria-label="Principal" className="mx-auto flex h-[52px] w-full max-w-[1100px] items-stretch gap-1 overflow-x-auto px-6 text-sm">
          <Link href="/" className="mr-6 flex items-center font-cond text-lg font-semibold">
            <span aria-hidden="true" className="mr-2 inline-block size-2.5 bg-laranja" />
            Busca Vagas
          </Link>
          <Menu />
          <div className="ml-auto flex items-center gap-5 text-aco-claro">
            <Link href="/configuracoes" className="hover:text-white">
              Configurações
            </Link>
            <form action={sair}>
              <button type="submit" className="cursor-pointer hover:text-white">
                Sair
              </button>
            </form>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-6 pb-16 pt-8">{children}</main>
    </div>
  );
}
