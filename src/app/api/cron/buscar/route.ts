import { rodarBusca } from "@/lib/busca-supabase";
import { criarClienteAdmin } from "@/lib/supabase/admin";

// Chamado pela Vercel Cron uma vez por dia (vercel.json). Protegido pelo CRON_SECRET.
export const maxDuration = 60;

export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return Response.json({ erro: "não autorizado" }, { status: 401 });
  }
  const resumos = await rodarBusca(criarClienteAdmin());
  return Response.json({ ok: true, resumos });
}
