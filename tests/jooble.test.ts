import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { criarJooble } from "@/lib/fontes/jooble";
import { PERFIL_PADRAO } from "@/lib/perfil-padrao";

const fixture = readFileSync("tests/fixtures/jooble.json", "utf-8");

describe("jooble", () => {
  it("faz POST com a chave e o termo, e lê as vagas", async () => {
    const pedidos: { url: string; corpo: unknown }[] = [];
    const fetchFalso = (async (url: string, init?: RequestInit) => {
      pedidos.push({ url: String(url), corpo: JSON.parse(String(init?.body)) });
      return new Response(fixture, { status: 200 });
    }) as unknown as typeof fetch;

    const jooble = criarJooble("CHAVE", "br.jooble.org");
    const vagas = await jooble.buscar({ ...PERFIL_PADRAO, termosBusca: ["analista de processos"] }, fetchFalso);

    expect(pedidos[0].url).toBe("https://br.jooble.org/api/CHAVE");
    expect(pedidos[0].corpo).toEqual({ keywords: "analista de processos", location: "Rio de Janeiro" });
    expect(vagas).toHaveLength(4);
    for (const v of vagas) {
      expect(v.fonte).toBe("jooble");
      expect(v.idExterno).not.toBe("");
      expect(v.link).toMatch(/^https:\/\//);
      expect(v.descricao).not.toMatch(/<b>|&nbsp;/);
    }
  });

  it("termo de trainee procura no Brasil todo (sem cidade)", async () => {
    const corpos: unknown[] = [];
    const fetchFalso = (async (_url: string, init?: RequestInit) => {
      corpos.push(JSON.parse(String(init?.body)));
      return new Response(fixture, { status: 200 });
    }) as unknown as typeof fetch;
    await criarJooble("K", "br.jooble.org").buscar({ ...PERFIL_PADRAO, termosBusca: ["programa de trainee"] }, fetchFalso);
    expect(corpos[0]).toEqual({ keywords: "programa de trainee", location: "" });
  });

  it("chave recusada (403) vira erro explicando o que fazer", async () => {
    const recusa = (async () => new Response("", { status: 403 })) as unknown as typeof fetch;
    await expect(criarJooble("K", "br.jooble.org").buscar(PERFIL_PADRAO, recusa)).rejects.toThrow(/br\.jooble\.org\/api\/about/);
  });
});
