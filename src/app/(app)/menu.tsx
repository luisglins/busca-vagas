"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/", rotulo: "Sugestões" },
  { href: "/linkedin", rotulo: "LinkedIn" },
  { href: "/vagas", rotulo: "Minhas vagas" },
  { href: "/painel", rotulo: "Painel" },
  { href: "/curriculos", rotulo: "Currículos" },
];

/** Abas do topo; marca a aba da página atual. */
export function Menu() {
  const caminho = usePathname();
  return (
    <>
      {ITENS.map((item) => {
        const ativo = item.href === "/" ? caminho === "/" : caminho.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={`flex items-center border-b-[3px] px-3 ${
              ativo ? "border-laranja text-white" : "border-transparent text-aco-claro hover:text-white"
            }`}
          >
            {item.rotulo}
          </Link>
        );
      })}
    </>
  );
}
