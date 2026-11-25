// Tipos compartilhados por todo o projeto.

export type Status = "interessado" | "apliquei" | "entrevista" | "recusado" | "oferta";
export type Fonte = "gupy" | "greenhouse" | "ashby" | "jooble" | "linkedin" | "manual";
export type Modalidade =
  | "presencial"
  | "hibrido"
  | "remoto"
  | "remoto_internacional"
  | "exterior"
  | "desconhecida";
export type Area = "processos" | "ia";

/** Vaga como chega de uma fonte, já normalizada para o nosso formato. */
export interface VagaBruta {
  fonte: Fonte;
  idExterno: string;
  empresa: string;
  cargo: string;
  link: string;
  cidade?: string;
  estado?: string;
  modalidade: Modalidade;
  localTexto: string;
  descricao: string;
  salario?: string;
  publicadaEm?: string;
}

export type IdCategoria =
  | "processos"
  | "ia_alto"
  | "ia_medio"
  | "ia_baixo"
  | "ferramentas"
  | "contexto"
  | "nivel";
export interface Categoria {
  id: IdCategoria;
  peso: number;
  palavras: string[];
}

export type IdPenalidade =
  | "experiencia"
  | "crea"
  | "pleno"
  | "ia_programacao"
  | "remoto_internacional";
export interface Penalidade {
  id: IdPenalidade;
  valor: number;
  palavras: string[];
}

export interface Perfil {
  termosBusca: string[];
  empresasGreenhouse: string[];
  empresasAshby: string[];
  empresasBloqueadas: string[];
  aceitarOutrasCidades: boolean;
  salarioMinimo: number | null;
  /** Palavras no título que eliminam a vaga (nível errado). */
  palavrasEliminatorias: string[];
  categorias: Categoria[];
  penalidades: Penalidade[];
}

export interface Resultado {
  nota: number;
  motivos: string[];
  area: Area | null;
  eliminada: boolean;
  motivoEliminacao?: string;
}

export interface ResumoExecucao {
  fonte: Fonte;
  encontradas: number;
  novas: number;
  eliminadas: number;
  erro: string | null;
}
