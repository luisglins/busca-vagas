import Papa from "papaparse";
import { normalizarTexto } from "./texto";

export interface VagaDoCsv {
  empresa: string;
  cargo: string;
  link?: string;
  data_encontrada?: string;
  notas?: string;
  descricao?: string;
}

// Nomes de coluna aceitos (sem acento, minúsculos) → campo da vaga.
const COLUNAS: Record<string, keyof VagaDoCsv> = {
  empresa: "empresa",
  cargo: "cargo",
  vaga: "cargo",
  link: "link",
  url: "link",
  data: "data_encontrada",
  "data encontrada": "data_encontrada",
  notas: "notas",
  observacoes: "notas",
  descricao: "descricao",
};

/** "24/11/2026" ou "2026-11-24" → "2026-11-24"; outro formato → undefined. */
function dataIso(valor: string): string | undefined {
  const br = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  return undefined;
}

/**
 * Lê um CSV de vagas (do Excel brasileiro, com ";", ou com ",").
 * Colunas obrigatórias: empresa e cargo. Opcionais: link, data, notas, descrição.
 */
export function lerCsvVagas(conteudo: string): { vagas: VagaDoCsv[]; erros: string[] } {
  const resultado = Papa.parse<Record<string, string>>(conteudo.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: true,
    delimitersToGuess: [";", ",", "\t"],
    transformHeader: (h) => COLUNAS[normalizarTexto(h)] ?? `_ignorar_${h}`,
  });

  const campos = resultado.meta.fields ?? [];
  if (!campos.includes("empresa") || !campos.includes("cargo")) {
    return { vagas: [], erros: ["O CSV precisa ter as colunas empresa e cargo (baixe o modelo para ver o formato)."] };
  }

  const vagas: VagaDoCsv[] = [];
  const erros: string[] = [];
  resultado.data.forEach((linha, i) => {
    const n = i + 2; // linha 1 é o cabeçalho
    const empresa = (linha.empresa ?? "").trim();
    const cargo = (linha.cargo ?? "").trim();
    if (!empresa) return erros.push(`Linha ${n}: falta empresa`);
    if (!cargo) return erros.push(`Linha ${n}: falta cargo`);
    const texto = (campo: string) => (linha[campo] ?? "").trim() || undefined;
    vagas.push({
      empresa,
      cargo,
      link: texto("link"),
      data_encontrada: dataIso((linha.data_encontrada ?? "").trim()),
      notas: texto("notas"),
      descricao: texto("descricao"),
    });
  });
  return { vagas, erros };
}
