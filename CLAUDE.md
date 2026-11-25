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

## Decisões-chave

- Só um usuário (Luís). Login obrigatório, cadastro público desligado, RLS em todas as tabelas, bucket de currículos privado.
- Fontes da 1ª versão: Gupy (endpoint não oficial), Greenhouse, Ashby + entradas manuais (formulário, CSV, bookmarklet).
  Depois: Jooble (precisa de chave brasileira) e LinkedIn via alertas de e-mail (Apps Script no Gmail).
- **Nunca** automatizar acesso ao LinkedIn com a conta do Luís (viola termos, arrisca a conta).
- Nota de aderência = função pura `pontuar(vaga, perfil)` com motivos explicados; palavras-chave em PT e EN.
- Adzuna, Careerjet, Remotive descartadas.

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
