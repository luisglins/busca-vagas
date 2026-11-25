// Logo do Busca Vagas: três barras em ranking (verde, laranja, cinza) — as vagas ordenadas pela nota.

export function SimboloLogo({ tamanho = 30, fundo = "#2a3431" }: { tamanho?: number; fundo?: string }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 30 30" aria-hidden="true" className="shrink-0">
      <rect width="30" height="30" rx="8" fill={fundo} />
      <rect x="6" y="7" width="18" height="4" rx="2" fill="#3fa66b" />
      <rect x="6" y="13" width="13" height="4" rx="2" fill="#f0a202" />
      <rect x="6" y="19" width="8" height="4" rx="2" fill="#9aa6a1" />
    </svg>
  );
}

/** Símbolo + "busca.vagas". */
export function Logo({ tamanho = 30, fundo, classe = "" }: { tamanho?: number; fundo?: string; classe?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${classe}`}>
      <SimboloLogo tamanho={tamanho} fundo={fundo} />
      <span className="font-titulo font-extrabold tracking-[-0.03em]">
        busca<span className="text-laranja">.</span>vagas
      </span>
    </span>
  );
}
