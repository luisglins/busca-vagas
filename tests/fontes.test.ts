import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ashby } from "@/lib/fontes/ashby";
import { greenhouse } from "@/lib/fontes/greenhouse";
import { gupy } from "@/lib/fontes/gupy";
import { htmlParaTexto } from "@/lib/fontes/html";
import { PERFIL_PADRAO } from "@/lib/perfil-padrao";
import type { Perfil } from "@/lib/tipos";

const fixture = (nome: string) => readFileSync(`tests/fixtures/${nome}.json`, "utf-8");

/** fetch falso: devolve a fixture para qualquer URL e anota as URLs pedidas. */
function fetchFalso(corpo: string, urls: string[] = []) {
  return (async (url: string) => {
    urls.push(String(url));
    return new Response(corpo, { status: 200, headers: { "content-type": "application/json" } });
  }) as unknown as typeof fetch;
}

const perfil: Perfil = { ...PERFIL_PADRAO, termosBusca: ["PCP"], empresasGreenhouse: ["quintoandar"], empresasAshby: ["openai"] };

describe("htmlParaTexto", () => {
  it("tira tags, decodifica entidades e mantém quebras de seção e listas", () => {
    const html = "&lt;h3&gt;Requisitos&lt;/h3&gt;&lt;ul&gt;&lt;li&gt;Excel &amp;amp; SQL&lt;/li&gt;&lt;li&gt;Inglês&lt;/li&gt;&lt;/ul&gt;";
    expect(htmlParaTexto(html)).toBe("Requisitos\n- Excel & SQL\n- Inglês");
  });
  it("aceita HTML já decodificado", () => {
    expect(htmlParaTexto("<p>Olá&nbsp;mundo</p><p>Linha 2</p>")).toBe("Olá mundo\nLinha 2");
  });
});

describe("gupy", () => {
  it("lê as vagas da fixture com os campos obrigatórios", async () => {
    const urls: string[] = [];
    const vagas = await gupy.buscar(perfil, fetchFalso(fixture("gupy"), urls));
    expect(urls[0]).toContain("portal.gupy.io/api/job-search/jobs?jobName=PCP");
    expect(vagas.length).toBe(3);
    for (const v of vagas) {
      expect(v.fonte).toBe("gupy");
      expect(v.idExterno).not.toBe("");
      expect(v.empresa).not.toBe("");
      expect(v.cargo).not.toBe("");
      expect(v.link).toMatch(/^https:\/\//);
      expect(v.descricao.length).toBeGreaterThan(50);
    }
  });
  it("converte workplaceType e local", async () => {
    const vagas = await gupy.buscar(perfil, fetchFalso(fixture("gupy")));
    const azzas = vagas.find((v) => v.cargo.includes("Assistente de PCP"))!;
    expect(azzas.modalidade).toBe("hibrido");
    expect(azzas.cidade).toBe("Rio de Janeiro");
    expect(vagas.some((v) => v.modalidade === "presencial")).toBe(true);
  });
  it("tira duplicadas quando dois termos trazem a mesma vaga", async () => {
    const vagas = await gupy.buscar({ ...perfil, termosBusca: ["PCP", "logística"] }, fetchFalso(fixture("gupy")));
    expect(vagas.length).toBe(3);
  });
});

describe("greenhouse", () => {
  it("lê vagas e transforma a descrição HTML em texto", async () => {
    const urls: string[] = [];
    const vagas = await greenhouse.buscar(perfil, fetchFalso(fixture("greenhouse"), urls));
    expect(urls[0]).toBe("https://boards-api.greenhouse.io/v1/boards/quintoandar/jobs?content=true");
    expect(vagas.length).toBe(5);
    for (const v of vagas) {
      expect(v.fonte).toBe("greenhouse");
      expect(v.descricao).not.toMatch(/<[a-z]|&lt;/);
      expect(v.empresa).not.toBe("");
    }
  });
  it("interpreta o local", async () => {
    const vagas = await greenhouse.buscar(perfil, fetchFalso(fixture("greenhouse")));
    const sp = vagas.find((v) => v.localTexto.startsWith("São Paulo"))!;
    expect(sp.cidade).toBe("São Paulo");
    const brasil = vagas.find((v) => v.localTexto === "Brasil")!;
    expect(brasil.modalidade).toBe("desconhecida");
    expect(brasil.cidade).toBeUndefined();
  });
});

describe("modalidade a partir do texto do local", async () => {
  const { modalidadePorTexto } = await import("@/lib/fontes/local");
  it("remoto no Brasil", () => expect(modalidadePorTexto("Remote - Brazil")).toBe("remoto"));
  it("remoto América Latina", () => expect(modalidadePorTexto("Remote - LatAm")).toBe("remoto_internacional"));
  it("remoto só nos EUA", () => expect(modalidadePorTexto("Remote - US")).toBe("exterior"));
  it("híbrido", () => expect(modalidadePorTexto("Rio de Janeiro (Híbrido)")).toBe("hibrido"));
  it("sem pista", () => expect(modalidadePorTexto("Brasil")).toBe("desconhecida"));
  it("presencial em outro país", () => expect(modalidadePorTexto("Mexico City, Mexico City, Mexico")).toBe("exterior"));
  it("cidade brasileira continua no Brasil", () => expect(modalidadePorTexto("São Paulo, São Paulo, Brazil")).toBe("desconhecida"));
});

describe("ashby", () => {
  it("lê vagas, local e modalidade", async () => {
    const urls: string[] = [];
    const vagas = await ashby.buscar(perfil, fetchFalso(fixture("ashby"), urls));
    expect(urls[0]).toContain("api.ashbyhq.com/posting-api/job-board/openai");
    expect(vagas.length).toBe(4);
    const br = vagas.find((v) => v.cargo.includes("(Brazil)"))!;
    expect(br.modalidade).toBe("hibrido");
    expect(br.cidade).toBe("São Paulo");
    expect(br.empresa).toBe("OpenAI");
    const sf = vagas.find((v) => v.localTexto.includes("San Francisco"))!;
    expect(sf.modalidade).toBe("exterior");
  });
});

describe("falhas", () => {
  it("se todas as requisições falham, o adaptador lança erro", async () => {
    const falha = (async () => new Response("erro", { status: 500 })) as unknown as typeof fetch;
    await expect(gupy.buscar(perfil, falha)).rejects.toThrow();
  });
  it("se só uma empresa falha, as outras continuam", async () => {
    let n = 0;
    const meio = (async () => {
      n++;
      return n === 1 ? new Response("erro", { status: 404 }) : new Response(fixture("greenhouse"), { status: 200 });
    }) as unknown as typeof fetch;
    const vagas = await greenhouse.buscar({ ...perfil, empresasGreenhouse: ["naoexiste", "quintoandar"] }, meio);
    expect(vagas.length).toBe(5);
  });
});
