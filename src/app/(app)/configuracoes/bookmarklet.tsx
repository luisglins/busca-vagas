"use client";

import { useEffect, useRef } from "react";

/**
 * Link para arrastar até a barra de favoritos. O React bloqueia "javascript:" em href,
 * então o endereço é colocado direto no elemento depois de montar.
 */
export function Bookmarklet() {
  const link = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const destino = `${window.location.origin}/salvar`;
    const codigo =
      "javascript:(()=>{const s=String(getSelection()).slice(0,4000);" +
      `window.open('${destino}?link='+encodeURIComponent(location.href)+'&titulo='+encodeURIComponent(document.title)+'&texto='+encodeURIComponent(s),'_blank')})()`;
    link.current?.setAttribute("href", codigo);
  }, []);

  return (
    <section className="painel p-5">
      <h2 className="font-titulo text-[22px] font-semibold">Botão &quot;Salvar no meu site&quot;</h2>
      <p className="mb-4 text-sm text-aco">
        Para salvar vagas do LinkedIn, Indeed ou qualquer site, sem copiar e colar.
      </p>
      <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm">
        <li>Mostre a barra de favoritos do navegador (Ctrl+Shift+B).</li>
        <li>Arraste o botão abaixo até a barra de favoritos.</li>
        <li>Numa vaga, selecione o texto da descrição com o mouse e clique no favorito.</li>
        <li>Abre uma aba do seu site com a vaga preenchida e a nota calculada. Confira e salve.</li>
      </ol>
      <a
        ref={link}
        onClick={(e) => e.preventDefault()}
        className="btn btn-principal cursor-grab"
        title="Arraste para a barra de favoritos"
      >
        + Salvar no busca.vagas
      </a>
    </section>
  );
}
