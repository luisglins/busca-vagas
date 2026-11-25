# busca.vagas

Site pessoal que **encontra vagas aderentes ao meu perfil** e organiza a minha busca de emprego.
Construí este projeto no último período de Engenharia de Produção, no Rio de Janeiro, para resolver um
problema real meu: procurar vaga em vários sites todo dia e não ter um lugar só para acompanhar as candidaturas.

> Projeto de uso pessoal (tem login). O código é aberto para quem quiser ver como foi feito.

## O que ele faz

- **Busca vagas sozinho, todo dia às 7h**, em 5 fontes: Gupy, Greenhouse, Ashby, Jooble e os alertas de vaga
  do LinkedIn que chegam no meu e-mail.
- **Dá uma nota de aderência (0–100) para cada vaga, com o motivo** — por exemplo
  `processos +40 · ferramentas +12 · trainee +15 · pede 3 anos de experiência −10`.
  A regra é explicável e editável em Configurações (pesos e palavras-chave em português e inglês).
- **Separa as vagas por faixa, como um andon**: verde (vale aplicar), laranja (avalie), cinza (pouco aderente),
  com filtros por área (Processos ou IA) e por site.
- **Junta vagas repetidas** (o mesmo programa de trainee em várias cidades vira um cartão só).
- **Indica qual versão do meu currículo combina mais com cada vaga** e quais palavras da vaga faltam nele —
  sem IA paga: o texto dos PDFs é comparado com as palavras-chave da vaga.
- **Acompanha as candidaturas**: status, histórico, follow-up automático (7 dias depois de aplicar,
  3 depois de entrevista) e um painel em forma de **fluxo de valor** (Interessado → Apliquei → Entrevista → Oferta).
- **Entrada manual**: formulário, importação de CSV (aceita o arquivo salvo pelo Excel) e um botão
  "Salvar no meu site" para o navegador.
- **Histórico com desfazer** para o que eu adicionei, descartei ou bloqueei.

## Decisões que valem contar

- **Nota explicável em vez de "caixa-preta"**: cada ponto da nota aparece numa barra de composição, como uma
  decomposição de perdas do OEE. Dá para confiar e ajustar.
- **LinkedIn sem scraping**: automatizar o LinkedIn com a minha conta viola os termos de uso e arrisca a conta.
  Em vez disso, um Google Apps Script no meu Gmail envia os **alertas de vaga** que o próprio LinkedIn me manda
  para uma rota protegida do site.
- **Custo zero**: Vercel Hobby, Supabase Free e APIs públicas. A Jooble grátis tem limite de 100 consultas por dia,
  então a busca usa no máximo 12 termos nela.
- **Segurança**: login obrigatório, cadastro público desligado, RLS em todas as tabelas, currículos num bucket
  privado com link temporário, chaves só em variáveis de ambiente.
- **Visual de "gestão à vista"**: a linguagem do chão de fábrica (andon, fluxo de valor) no lugar de um template
  genérico de SaaS.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage) · Vercel (hospedagem e Cron)
· Vitest · unpdf · papaparse · Google Apps Script.

## Como está organizado

```
src/lib/                 regras puras e testadas
  pontuar.ts             nota de aderência e eliminatórios
  busca.ts               junta as fontes, tira duplicadas, descarta anúncio antigo e vaga fora do Brasil
  fontes/                um adaptador por site (gupy, greenhouse, ashby, jooble, linkedin-email)
  agrupar.ts             junta vagas repetidas
  curriculo.ts           compara currículos com a vaga
  followup.ts, fluxo.ts  follow-up e painel
src/app/                 telas (Sugestões, Minhas vagas, Painel, Currículos, Configurações, Histórico)
src/app/api/             busca diária (Cron) e entrada dos alertas do LinkedIn
supabase/migrations/     esquema do banco com RLS
scripts/apps-script/     script do Gmail para os alertas do LinkedIn
docs/                    design, plano, direção visual e protótipos
tests/                   testes (Vitest) com respostas reais das fontes como amostra
```

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do seu Supabase (e, se quiser, Jooble)
npm run dev                  # http://localhost:3000
npm test                     # testes
```

O esquema do banco está em `supabase/migrations/`. As decisões do projeto estão em `CLAUDE.md` e `docs/`.

## Como foi feito

Desenvolvido em etapas pequenas, cada uma testada no navegador, com testes automatizados para toda regra de
negócio (mais de 100) e commits em português. Construído com a ajuda do Claude Code como par de programação.
