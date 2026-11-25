@AGENTS.md

# Busca Vagas

Site pessoal do Luís (Eng. de Produção, RJ) que **sugere vagas com nota de aderência** ao perfil dele
e acompanha candidaturas, currículos (PDF) e follow-ups. Também é projeto de portfólio e de aprendizado:
o Luís nunca fez um site — explique cada etapa em poucas linhas, em português.

- Design aprovado: [docs/design.md](docs/design.md) — fonte de verdade das decisões.
- Plano de implementação: [docs/plano.md](docs/plano.md) — etapas pequenas, cada uma testável no navegador.
- Histórico do brainstorm e do teste das fontes: [docs/decisoes-brainstorm.md](docs/decisoes-brainstorm.md).

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind 4 · Supabase (Postgres, Auth, Storage) · Vercel (hospedagem + Cron) · Vitest.
Node.js 26. Next 16 tem mudanças em relação a versões antigas: consulte `node_modules/next/dist/docs/` antes de escrever código.

## Infraestrutura

- GitHub: `luisglins/busca-vagas` (público). Cada push em `main` publica na Vercel automaticamente.
- Vercel: projeto `busca-vagas` (`prj_m6AoUOlKIM5Z7NQwcLlHqAOFsBvA`, conta pessoal `team_iRZKErcFpVdoivc40gLubg3h`).
- Supabase: projeto `busca-vagas` (`hadklgmaeuohlzaqwvqa`, região sa-east-1). Migrações em `supabase/migrations/`.
- Sessão de login dura 400 dias (padrão do `@supabase/ssr`), renovada pelo `src/proxy.ts`.

## Decisões-chave

- Só um usuário (Luís). Login obrigatório, cadastro público desligado, RLS em todas as tabelas, bucket de currículos privado.
- Fontes da 1ª versão: Gupy (endpoint não oficial), Greenhouse, Ashby + entradas manuais (formulário, CSV, bookmarklet).
  Depois: Jooble (precisa de chave brasileira) e LinkedIn via alertas de e-mail (Apps Script no Gmail).
- **Nunca** automatizar acesso ao LinkedIn com a conta do Luís (viola termos, arrisca a conta).
- Nota de aderência = função pura `pontuar(vaga, perfil)` com motivos explicados; palavras-chave em PT e EN.
- Adzuna, Careerjet, Remotive descartadas.
- Luís pediu menos perguntas (2026-11-25): Claude decide o que é técnico e só pede o que exige conta/senha dele.
  Por isso as etapas 3, 4 e 9 vieram antes da 2, e o SQL foi aplicado direto pelo Claude.

## Visual

Direção "gestão à vista" (chão de fábrica): cores do andon só para informar, barra de composição da nota como elemento marcante,
IBM Plex Sans + Plex Sans Condensed. Detalhes em [docs/design-visual.md](docs/design-visual.md); referência em `docs/prototipo/index.html`.
Use as skills `frontend-design` e `anti-slop` ao criar telas.

## Convenções

- Interface, nomes de domínio no código (vaga, sugestao, curriculo…), commits e explicações em **português**.
- Commits pequenos, mensagem no imperativo ("Adiciona tela de currículos").
- Segredos só em `.env.local` (fora do git) e nas variáveis da Vercel. Nunca no código nem no chat.
  `.env.example` lista os nomes das variáveis, sem valores.
- Nada de dados pessoais no repositório (currículos, vagas reais do Luís).
- Lógica pura em `src/lib/`, testada com Vitest em `tests/`. Telas testadas no navegador.
- Datas de follow-up como `date` (AAAA-MM-DD), fuso `America/Sao_Paulo`.

## Comandos

- `npm run dev` — site em http://localhost:3000
- `npm test` — testes
- `npm run build` — build de produção (rodar antes de publicar)

## Armadilhas conhecidas

- **Cache Components está ligado** (`next.config.ts`). Página que lê cookie/sessão precisa estar sob o layout `(app)`,
  que tem `export const instant = false`. Sem isso o `next build` falha com "blocking-prerender-dynamic".
- Rode `npx next build` antes de dar push: a Vercel falha pelo mesmo motivo.
