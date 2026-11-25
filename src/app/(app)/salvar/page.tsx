import { carregarPerfil } from "@/lib/busca-supabase";
import { hojeEmSaoPaulo } from "@/lib/followup";
import { separarTitulo } from "@/lib/pagina";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { FormularioSalvar } from "./formulario-salvar";

// Página aberta pelo botão "Salvar no meu site" (bookmarklet): /salvar?link=...&titulo=...&texto=...
export default async function Salvar({ searchParams }: PageProps<"/salvar">) {
  const params = await searchParams;
  const texto = (nome: string) => {
    const v = params[nome];
    return (Array.isArray(v) ? v[0] : v ?? "").slice(0, 4000);
  };
  const { cargo, empresa } = separarTitulo(texto("titulo"));
  const perfil = await carregarPerfil(await criarClienteServidor());

  return (
    <section>
      <div className="mb-6">
        <h1 className="titulo-tela">Salvar vaga</h1>
        <p className="mt-2 text-sm text-aco">Confira o cargo e a empresa (vieram do título da página) e salve.</p>
      </div>
      <FormularioSalvar
        inicial={{ cargo, empresa, link: texto("link"), descricao: texto("texto") }}
        perfil={perfil}
        hoje={hojeEmSaoPaulo()}
      />
    </section>
  );
}
