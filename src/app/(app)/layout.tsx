import Link from "next/link";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { sair } from "../login/acoes";

const MENU = [
  { href: "/", rotulo: "Sugestões" },
  { href: "/vagas", rotulo: "Minhas vagas" },
  { href: "/curriculos", rotulo: "Currículos" },
  { href: "/painel", rotulo: "Painel" },
  { href: "/configuracoes", rotulo: "Configurações" },
];

// Páginas logadas leem o cookie de sessão a cada acesso, então são geradas no servidor
// na hora (não fazem parte do "esqueleto estático" do Cache Components).
export const instant = false;

// Layout de todas as páginas que exigem login.
export default async function LayoutLogado({ children }: LayoutProps<"/">) {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-6 py-3 text-sm">
          <span className="mr-2 font-semibold">Busca Vagas</span>
          {MENU.map((item) => (
            <Link key={item.href} href={item.href} className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              {item.rotulo}
            </Link>
          ))}
          <form action={sair} className="ml-auto">
            <button type="submit" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
              Sair
            </button>
          </form>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
