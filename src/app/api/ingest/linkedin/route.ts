import { rodarBusca } from "@/lib/busca-supabase";
import { extrairVagasDoEmail } from "@/lib/fontes/linkedin-email";
import { criarClienteAdmin } from "@/lib/supabase/admin";

// Recebe o HTML de um e-mail de alerta de vagas do LinkedIn, enviado pelo Apps Script do Gmail do Luís
// (scripts/apps-script/linkedin.gs). Protegido pelo INGEST_SECRET.
export async function POST(request: Request) {
  const segredo = process.env.INGEST_SECRET;
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return Response.json({ erro: "não autorizado" }, { status: 401 });
  }
  const corpo = (await request.json().catch(() => null)) as { html?: unknown } | null;
  if (!corpo || typeof corpo.html !== "string" || corpo.html.length > 2_000_000) {
    return Response.json({ erro: "envie { html: string }" }, { status: 400 });
  }

  const vagas = extrairVagasDoEmail(corpo.html);
  if (vagas.length === 0) return Response.json({ ok: true, vagas: 0, aviso: "nenhuma vaga encontrada no e-mail" });

  const [resumo] = await rodarBusca(criarClienteAdmin(), [{ fonte: "linkedin", buscar: async () => vagas }]);
  return Response.json({ ok: true, vagas: vagas.length, resumo });
}
