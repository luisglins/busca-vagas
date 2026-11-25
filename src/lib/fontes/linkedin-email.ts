import type { VagaBruta } from "../tipos";
import { htmlParaTexto } from "./html";
import { cidadePorTexto, modalidadePorTexto } from "./local";

// Lê as vagas de um e-mail de ALERTA DE VAGAS do LinkedIn (que o próprio LinkedIn manda para o Luís).
// Nenhum acesso ao LinkedIn é feito aqui: só lemos o e-mail que chegou no Gmail dele.
// Formato montado a partir do layout típico desses e-mails; conferir com um e-mail real.

const LINK_VAGA = /linkedin\.com\/(?:comm\/)?jobs\/view\/(\d+)/i;
const RUIDO = [
  /^candidatura simplificada$/i,
  /^easy apply$/i,
  /^promovid[ao]$/i,
  /^promoted$/i,
  /^h[aá] \d+ (minutos?|horas?|dias?|semanas?)$/i,
  /^\d+ (minutes?|hours?|days?|weeks?) ago$/i,
  /^ver vaga$/i,
  /^see job$/i,
  /^seja um dos primeiros/i,
  /^be an early applicant/i,
  /candidat(o|ura)s?$/i,
];

interface Ancora {
  inicio: number;
  fim: number;
  href: string;
  texto: string;
  id: string | null;
}

function lerAncoras(html: string): Ancora[] {
  const ancoras: Ancora[] = [];
  const re = /<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    ancoras.push({
      inicio: m.index,
      fim: m.index + m[0].length,
      href: m[1].replace(/&amp;/g, "&"),
      texto: htmlParaTexto(m[2]).replace(/\n/g, " ").trim(),
      id: m[1].match(LINK_VAGA)?.[1] ?? null,
    });
  }
  return ancoras;
}

export function extrairVagasDoEmail(html: string): VagaBruta[] {
  const ancoras = lerAncoras(html);
  const ids = [...new Set(ancoras.map((a) => a.id).filter((id): id is string => id !== null))];

  return ids.flatMap((id): VagaBruta[] => {
    const daVaga = ancoras.filter((a) => a.id === id);
    const cargo = daVaga.map((a) => a.texto).find((t) => t && !RUIDO.some((r) => r.test(t)));
    if (!cargo) return [];

    // O texto entre o último link desta vaga e o próximo link de outra coisa traz empresa e local.
    const ultima = daVaga[daVaga.length - 1];
    const proxima = ancoras.find((a) => a.inicio > ultima.fim && a.id !== id);
    const linhas = htmlParaTexto(html.slice(ultima.fim, proxima?.inicio ?? html.length))
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !RUIDO.some((r) => r.test(l)));

    let empresa = linhas[0] ?? "";
    let local = linhas[1] ?? "";
    if (empresa.includes(" · ")) [empresa, local] = empresa.split(" · ", 2).map((p) => p.trim());

    return [
      {
        fonte: "linkedin",
        idExterno: id,
        empresa: empresa || "Empresa não informada",
        cargo,
        link: `https://www.linkedin.com/jobs/view/${id}/`,
        cidade: cidadePorTexto(local),
        modalidade: modalidadePorTexto(local),
        localTexto: local,
        descricao: "",
      },
    ];
  });
}
