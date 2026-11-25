import type { Adaptador } from "./fontes/comum";
import { pontuar } from "./pontuar";
import { chaveDuplicidade } from "./texto";
import type { Perfil, Resultado, ResumoExecucao, VagaBruta } from "./tipos";

export interface SugestaoNova extends VagaBruta {
  chaveDuplicidade: string;
  resultado: Resultado;
}

/** Tudo que a busca precisa do "mundo lá fora" — assim dá para testar sem banco nem internet. */
export interface DepsBusca {
  adaptadores: Adaptador[];
  perfil: Perfil;
  /** chave_duplicidade das vagas da lista e das sugestões dos últimos 60 dias */
  chavesExistentes: Set<string>;
  /** `${fonte}:${idExterno}` de sugestões já gravadas */
  idsExistentes: Set<string>;
  salvar(sugestoes: SugestaoNova[]): Promise<void>;
  /** "agora" em ms (para testes); padrão: Date.now() */
  agora?: number;
  registrar(resumo: ResumoExecucao): Promise<void>;
}

const LIMITE_DIAS_ANUNCIO = 90;

/** Nota da vaga, eliminando anúncios antigos demais (ex.: "banco de talentos" de quase um ano atrás). */
function avaliar(vaga: VagaBruta, perfil: Perfil, agora: number): Resultado {
  const resultado = pontuar(vaga, perfil);
  if (resultado.eliminada || !vaga.publicadaEm) return resultado;
  const dias = (agora - new Date(vaga.publicadaEm).getTime()) / 86_400_000;
  if (dias > LIMITE_DIAS_ANUNCIO) {
    return { ...resultado, eliminada: true, motivoEliminacao: `anúncio com mais de ${LIMITE_DIAS_ANUNCIO} dias` };
  }
  return resultado;
}

/**
 * Busca todas as fontes em paralelo, tira duplicadas, dá nota e salva.
 * Uma fonte com erro não impede as outras; cada fonte gera um resumo.
 */
export async function executarBusca(deps: DepsBusca): Promise<ResumoExecucao[]> {
  const resultados = await Promise.allSettled(deps.adaptadores.map((a) => a.buscar(deps.perfil)));
  const chaves = new Set(deps.chavesExistentes);
  const agora = deps.agora ?? Date.now();
  const resumos: ResumoExecucao[] = [];

  for (const [i, adaptador] of deps.adaptadores.entries()) {
    const r = resultados[i];
    if (r.status === "rejected") {
      const erro = r.reason instanceof Error ? r.reason.message : String(r.reason);
      resumos.push({ fonte: adaptador.fonte, encontradas: 0, novas: 0, eliminadas: 0, erro });
      continue;
    }

    const novas: SugestaoNova[] = [];
    let foraDoBrasil = 0;
    for (const vaga of r.value) {
      // Fora do Brasil nunca vai interessar: conta como eliminada, mas não grava.
      if (vaga.modalidade === "exterior") {
        foraDoBrasil++;
        continue;
      }
      if (deps.idsExistentes.has(`${vaga.fonte}:${vaga.idExterno}`)) continue;
      const chave = chaveDuplicidade(vaga.empresa, vaga.cargo, vaga.cidade);
      if (chaves.has(chave)) continue;
      chaves.add(chave);
      novas.push({ ...vaga, chaveDuplicidade: chave, resultado: avaliar(vaga, deps.perfil, agora) });
    }

    if (novas.length > 0) await deps.salvar(novas);
    const eliminadasGravadas = novas.filter((n) => n.resultado.eliminada).length;
    const eliminadas = eliminadasGravadas + foraDoBrasil;
    resumos.push({
      fonte: adaptador.fonte,
      encontradas: r.value.length,
      novas: novas.length - eliminadasGravadas,
      eliminadas,
      erro: null,
    });
  }

  for (const resumo of resumos) await deps.registrar(resumo);
  return resumos;
}
