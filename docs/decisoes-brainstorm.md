# Decisões do brainstorm (rascunho — vira o design doc e o CLAUDE.md)

Data: 2026-11-24. Status: **em conversa, design ainda não aprovado.**

## Quem é o usuário
Luís, Eng. de Produção (forma dez/2026), Campo Grande – RJ. Sabe Python, SQL, Excel, Power BI.
Nunca fez site. Quer aprender (explicar cada etapa), git desde o início, commits em português,
CLAUDE.md com decisões. Projeto também vai para o portfólio no GitHub.

## Objetivo central
**Encontrar vagas aderentes ao perfil dele** (sugestões automáticas com nota de aderência).
Lista de vagas, currículos e painel são o apoio (onde as vagas escolhidas são acompanhadas).
Sugestões são **essenciais já na primeira versão**.

## Decisões tomadas
- **Uso:** só o Luís. Login obrigatório, dados e PDFs privados (currículo tem dados pessoais).
  Modo demonstração para recrutadores pode vir no fim (opcional).
- **Stack sugerida pelo usuário:** Next.js + TypeScript + Tailwind + Supabase + Vercel (ainda a confirmar na etapa de abordagens).
- **Importação manual:** colar link + preencher empresa/cargo, ou CSV. Não extrair dados de páginas de vaga.
- **LinkedIn:** NÃO fazer scraping (viola termos, arrisca a conta). Alternativas:
  - v1: botão/bookmarklet "Salvar no meu site" que o Luís clica ao ver um post/vaga.
  - v2: alertas de vaga do LinkedIn por e-mail encaminhados ao site.
- **Fontes de vagas (mín. 5):** Gupy, Adzuna, Jooble, Careerjet, Greenhouse/Lever (empresas de IA/tech), Remotive.
  Agregadores cobrem Catho, InfoJobs, Vagas.com etc. indiretamente. Viabilidade sendo testada (spike).

## Perfil de busca / nota de aderência
- **Eliminatório (pouco, ele aceita quase tudo):** nível trainee/júnior/analista I/assistente (sem estágio);
  local RJ presencial/híbrido ou remoto ("outra cidade" desligado por padrão, com botão).
- **Área 1 – Processos/Produção (peso alto):** eng. de processos, produção, melhoria contínua, PCP, qualidade, operações, logística.
- **Área 2 – IA sem programação** (frentes escolhidas por Claude, pesos editáveis):
  - alto: IA aplicada a processos/operações (automação, Copilot, agentes, no-code)
  - médio: implantação / customer success de produto de IA
  - médio: avaliação/treinamento de modelos (marcar como freelance/projeto)
  - baixo: produto de IA
  - vaga que exige programação (dev, ML engineer, Python avançado) perde pontos.
- **Ferramentas (peso médio):** Lean, Six Sigma, SMED, OEE, KPIs, Power BI, SQL, Python, Excel.
- **Contexto (peso baixo):** indústria/manufatura, injeção/plásticos, supply chain, inglês.
- **Penalidades:** pede >2 anos de experiência, CREA ativo, coordenação/sênior.
- **Salário:** não é filtro (quase nunca informado); mostrar quando houver, destacar abaixo de um mínimo opcional.
- **Empresa:** botão "não tenho interesse nessa empresa" rebaixa/esconde vagas futuras dela.
- Cada sugestão mostra **o motivo da nota** (ex.: "78/100: processos + Power BI + RJ híbrido; pede 2 anos (−10)").
- Pesos ajustáveis numa tela de configurações.

## Requisitos originais (continuam valendo)
1. Lista de vagas: empresa, cargo, link, data, status (interessado, apliquei, entrevista, recusado, oferta), notas.
2. Versões de currículo (PDF) e qual foi enviado para cada vaga.
3. Painel: vagas por etapa + follow-ups da semana.
4. Importar vagas (link ou CSV).

**Pronto quando:** cadastrar vaga, mudar status, anexar currículo, ver painel atualizado — online na Vercel
(+ agora: ver sugestões de vagas com nota).

## Resultado do spike das fontes (2026-11-24)
| Fonte | Resultado | Observação |
|---|---|---|
| Gupy | ✅ `portal.gupy.io/api/job-search/jobs?jobName=...&limit=100&offset=0` | Não oficial (é o que o portal usa). Endpoint antigo `employability-portal` dá 404. Campos: name, careerPageName, city, state, workplaceType, description, jobUrl, publishedDate. Muito ruído (ex.: "Farmacêutico Trainee") → nota de aderência é essencial. |
| Greenhouse | ✅ `boards-api.greenhouse.io/v1/boards/{empresa}/jobs` | Oficial/público. Precisa lista de empresas. Stone 281, QuintoAndar 91. OpenAI/Anthropic: 0 vagas no Brasil. |
| Ashby | ✅ `api.ashbyhq.com/posting-api/job-board/{empresa}` | Oficial/público. Mesma lógica (lista de empresas). |
| Lever | ⚠️ endpoint ok, slugs testados não existem | Precisa descobrir empresas BR que usam Lever. |
| Remotive | ❌ fraco | Ignora busca, poucas vagas, foco EUA. |
| Careerjet | ❌ 403 | Exige cadastro de afiliado real. |
| Adzuna, Jooble | ⏳ não testados | Precisam de chave grátis (conta do Luís). |

Conclusão: sem chave temos 3 fontes sólidas (Gupy, Greenhouse, Ashby).

Atualização (mesmo dia):
- **Adzuna descartada** pelo Luís (não gostou do site).
- **Jooble:** a chave dele foi emitida para os EUA (jooble.org) — busca "Rio de Janeiro" devolve vagas de Delaware (ziprecruiter);
  br.jooble.org dá 403 com essa chave. Precisa pedir uma chave **brasileira** em br.jooble.org/api/about.
- **LinkedIn:** Luís insistiu (até usando o PC dele). Mantido o NÃO para automação com a conta dele.
  Proposta: alertas de vaga do LinkedIn por e-mail → site lê esses e-mails (Gmail dele) automaticamente = 5ª fonte, sem violar termos.

## Pendências
- Chave brasileira da Jooble.
- ~~Decisão do Luís sobre LinkedIn via alertas de e-mail.~~ **Aprovado**: LinkedIn entra via alertas de vaga por e-mail.
- Escolha da abordagem de construção (apresentada: A = tudo Next.js/TS; B = coletor Python + site Next.js; C = Streamlit).
- Abordagens de construção (stack, como rodar a busca diária).
- Design doc formal + aprovação + plano em etapas.
