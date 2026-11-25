import { contemPalavra, normalizarTexto } from "./texto";

// Junta vagas repetidas para não poluir as Sugestões:
// - trainee: todas as vagas de trainee da mesma empresa viram um grupo (muda só local ou especialização);
// - demais: mesma empresa + mesmo cargo (em cidades diferentes).

interface Agrupavel {
  id: string;
  empresa: string;
  cargo: string;
  nota: number;
}

export interface Grupo<T extends Agrupavel> {
  /** a vaga de maior nota, mostrada no cartão */
  principal: T;
  /** todas as vagas do grupo (inclui a principal), da maior para a menor nota */
  membros: T[];
}

function chave(v: Agrupavel): string {
  const empresa = normalizarTexto(v.empresa);
  const ehTrainee = contemPalavra(normalizarTexto(`${v.cargo} ${v.empresa}`), "trainee");
  return ehTrainee ? `${empresa}|trainee` : `${empresa}|${normalizarTexto(v.cargo)}`;
}

export function agruparSugestoes<T extends Agrupavel>(sugestoes: T[]): Grupo<T>[] {
  const grupos = new Map<string, T[]>();
  for (const s of sugestoes) {
    const k = chave(s);
    grupos.set(k, [...(grupos.get(k) ?? []), s]);
  }
  return [...grupos.values()]
    .map((membros) => {
      const ordenados = [...membros].sort((a, b) => b.nota - a.nota);
      return { principal: ordenados[0], membros: ordenados };
    })
    .sort((a, b) => b.principal.nota - a.principal.nota);
}
