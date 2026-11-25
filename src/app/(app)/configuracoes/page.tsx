import { carregarPerfil } from "@/lib/busca-supabase";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { FormularioConfiguracoes } from "./formulario";

export default async function Configuracoes() {
  const perfil = await carregarPerfil(await criarClienteServidor());
  return (
    <section>
      <div className="mb-6">
        <h1 className="titulo-tela">Configurações</h1>
        <p className="mt-2 text-sm text-aco">
          Ajuste onde procurar e como a nota é calculada. Ao salvar, as sugestões dos últimos 30 dias são recalculadas na hora.
        </p>
      </div>
      <FormularioConfiguracoes perfil={perfil} />
    </section>
  );
}
