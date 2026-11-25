import { avaliar } from "./busca";
import type { Perfil, Resultado, VagaBruta } from "./tipos";

/**
 * Sugestão já gravada, com a situação atual.
 * Atenção: "situacao" (nova/eliminada…) não é o "estado" da VagaBruta, que é a UF (ex.: Rio de Janeiro).
 */
export interface SugestaoGuardada extends VagaBruta {
  id: string;
  situacao: "nova" | "eliminada" | "adicionada" | "descartada";
}

export interface NovaAvaliacao {
  id: string;
  resultado: Resultado;
  situacao: "nova" | "eliminada";
}

/**
 * Recalcula a nota das sugestões com o perfil novo (ao salvar Configurações).
 * Só mexe nas que ainda não foram decididas (nova/eliminada); adicionadas e descartadas ficam como estão.
 */
export function repontuar(sugestoes: SugestaoGuardada[], perfil: Perfil, agora: number): NovaAvaliacao[] {
  return sugestoes
    .filter((s) => s.situacao === "nova" || s.situacao === "eliminada")
    .map((s) => {
      const resultado = avaliar(s, perfil, agora);
      return { id: s.id, resultado, situacao: resultado.eliminada ? "eliminada" : "nova" };
    });
}
