# Busca Vagas — Documento de design

Data: 2026-11-24 · Autor: Luís (com Claude) · Status: **aprovado pelo Luís em 2026-11-24**

## 1. Intenção

Luís (Eng. de Produção, forma em dez/2026, Campo Grande – RJ) está procurando o primeiro emprego após a faculdade.
Hoje ele procura vagas manualmente em vários sites e não tem um lugar único para acompanhar candidaturas.

O site existe para **encontrar vagas aderentes ao perfil dele com menos esforço** e acompanhar o que ele fez com cada uma.
Também é um projeto de **portfólio no GitHub** e de **aprendizado**: ele sabe Python/SQL/Excel/Power BI mas nunca fez um site.

## 2. Objetivos, não-objetivos e anti-objetivos

**Objetivos (primeira versão online):**
1. Todo dia, sugestões de vagas vindas de **5 fontes**, cada uma com **nota de aderência (0–100) e o motivo da nota**.
2. Com um clique, transformar uma sugestão em vaga acompanhada.
3. Lista de vagas: empresa, cargo, link, data em que achou, status, notas.
4. Versões de currículo (PDF) guardadas; cada vaga registra qual versão foi enviada.
5. Painel: quantas vagas em cada status + follow-ups desta semana.
6. Entrada manual: colar link + preencher campos; importar CSV; botão "Salvar no meu site" usado no navegador.
7. Rodando online na Vercel, com login.

**Pronto quando:** Luís consegue, no link da Vercel: ver sugestões com nota, adicionar uma à lista, mudar o status,
anexar um currículo e ver o painel atualizado.

**Primeira versão sai com 3 fontes automáticas** (Gupy, Greenhouse, Ashby) + entradas manuais (formulário, CSV, bookmarklet)
— decisão do Luís, 2026-11-24. **Jooble e LinkedIn são as duas etapas logo seguintes** (dependem da chave brasileira
da Jooble e de um e-mail real de alerta do LinkedIn). O objetivo de 5 fontes continua valendo.

**Não-objetivos:**
- Candidatar-se automaticamente às vagas.
- Várias pessoas usando o site (é só para o Luís).
- App de celular (o site deve funcionar razoavelmente no celular, mas não é foco).
- Análise com IA paga (LLM) na primeira versão.

**Anti-objetivos (falha mesmo se "funcionar"):**
- Qualquer automação que use a conta do LinkedIn do Luís ou viole termos de uso de um site (risco para a conta dele).
- Currículo, dados pessoais ou chaves de API expostos publicamente (no site ou no GitHub).
- Sugestões tão ruidosas que ele pare de olhar (ex.: "Farmacêutico Trainee" no topo).
- Código que o Luís não consegue entender ou manter sozinho.

## 3. Restrições

- **Custo zero** (planos grátis: Vercel Hobby, Supabase Free, Google Apps Script).
- Vercel Hobby: Cron no máximo **1 vez por dia**; funções com limite de tempo → a busca precisa ser rápida (fontes em paralelo).
- Supabase Free pausa o projeto após ~1 semana sem uso → a busca diária mantém ativo.
- Fontes não oficiais (Gupy) podem mudar sem aviso → cada fonte isolada; se uma falhar, as outras continuam e o painel mostra o erro.
- Luís é iniciante: etapas pequenas, cada uma testável no navegador, explicação curta a cada etapa.
- Git desde o início, commits pequenos com mensagens em português. `CLAUDE.md` com as decisões, atualizado a cada mudança.
- Interface em português.

## 4. Abordagens consideradas

| | Abordagem | Prós | Contras |
|---|---|---|---|
| **A** ✅ | **Tudo em Next.js + TypeScript na Vercel** (site, busca diária via Vercel Cron, nota de aderência) + Supabase | Um projeto, uma linguagem, um deploy; stack muito usada; bom para portfólio | Luís aprende TypeScript |
| B | Coletor em Python (GitHub Actions) + site em Next.js | Lógica de aderência em Python, que ele já sabe | Duas linguagens e dois lugares rodando enquanto aprende |
| C | Streamlit (só Python) | Mais rápido para ele | Login, PDFs privados e agendamento improvisados; parece painel, não site |

**Escolhida: A** (pelo Luís, 2026-11-24). Motivo: menos peças para quem está começando; projeto completo no portfólio.

## 5. Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**.
- **Supabase**: Postgres (dados), Auth (login), Storage (PDFs, bucket **privado**).
- **Vercel**: hospedagem + Cron diário.
- **Google Apps Script** (no Gmail do Luís): leitor dos alertas de vaga do LinkedIn.
- **Vitest**: testes só da lógica de aderência e dos parsers (o resto é testado no navegador).

## 6. Fontes de vagas

| # | Fonte | Como | Status |
|---|---|---|---|
| 1 | **Gupy** | `GET portal.gupy.io/api/job-search/jobs?jobName=<termo>&limit=100&offset=0` (não oficial, é o que o portal usa) | testado ✅ |
| 2 | **Greenhouse** | `GET boards-api.greenhouse.io/v1/boards/<empresa>/jobs?content=true` para uma lista de empresas | testado ✅ |
| 3 | **Ashby** | `GET api.ashbyhq.com/posting-api/job-board/<empresa>` para uma lista de empresas | testado ✅ |
| 4 | **Jooble** | `POST jooble.org/api/<chave>` com `{keywords, location}` — precisa de **chave brasileira** | aguardando chave |
| 5 | **LinkedIn** | Alertas de vaga por e-mail → Apps Script no Gmail do Luís envia para o site | a construir |
| + | **Manual** | Formulário (link + campos), CSV, botão "Salvar no meu site" | a construir |

Decisões:
- **Termos de busca** (Gupy/Jooble) vêm do perfil (seção 7) e ficam editáveis na tela de Configurações.
- **Empresas** de Greenhouse/Ashby: lista inicial montada por Claude (empresas brasileiras/LatAm de tech, operações e IA que usam esses sistemas), editável em Configurações.
- **LinkedIn**: Luís cria alertas no LinkedIn (ex.: "engenharia de processos – Rio de Janeiro"). Um Apps Script no Gmail dele roda a cada hora, procura e-mails de alerta do LinkedIn ainda não processados, envia o conteúdo para `POST /api/ingest/linkedin` (protegido por um segredo) e marca o e-mail com um marcador. O site extrai cargo, empresa, local e link de cada vaga do e-mail.
- **Nenhuma automação acessa o LinkedIn diretamente.** O botão "Salvar no meu site" é um *bookmarklet*: Luís clica nele numa página de vaga/post, e ele abre o nosso site com o link e o texto selecionado já preenchidos.
- **Adzuna, Careerjet, Remotive, Lever**: descartadas (ver `docs/decisoes-brainstorm.md`).
- **Duplicatas**: a mesma vaga pode vir de duas fontes. Chave de duplicidade = empresa + cargo normalizados (minúsculas, sem acento, sem pontuação) + cidade. Se já existe, não cria outra sugestão.

## 7. Nota de aderência

Uma função pura em TypeScript: `pontuar(vaga, perfil) → { nota, motivos[], eliminada, motivoEliminacao }`. Testada com Vitest usando exemplos reais do spike.

**Eliminatórios** (vaga não aparece; contamos quantas foram eliminadas, para conferência):
- Nível: título com estágio/estagiário, sênior/sr, coordenador, gerente, especialista. (Pleno não elimina, perde pontos.)
- Local: precisa ser RJ (cidade do Rio ou região metropolitana) presencial/híbrido, **ou** remoto. "Outras cidades" desligado por padrão, com chave em Configurações.
- Empresa na lista "não tenho interesse".

**Pontos** (pesos iniciais, editáveis):
- **Área 1 – Processos/Produção (até +40):** engenharia de processos, produção, melhoria contínua, PCP, qualidade, operações, logística, trainee de engenharia/operações.
- **Área 2 – IA sem programação (até +40):** IA aplicada a processos/automação (no-code, Copilot, agentes) alto; implantação/customer success de IA médio; avaliação/treinamento de modelos médio (marcada "freelance/projeto"); produto de IA baixo.
- **Ferramentas e métodos (até +25):** Lean, Six Sigma, SMED, OEE, KPIs, Power BI, SQL, Python, Excel.
- **Contexto (até +10):** indústria/manufatura, injeção/plásticos, supply chain, inglês.
- **Nível bom (+10):** trainee, júnior, analista I, assistente.
- **Penalidades:** pede >2 anos de experiência (−10), CREA ativo (−10), pleno (−10), vaga de IA que exige programação (dev, ML engineer, Python avançado) (−20).
- Nota final limitada a 0–100. A vaga é classificada na área com mais pontos (filtro "Processos" / "IA").
- Palavras procuradas no título (peso cheio) e na descrição (meio peso), sem diferenciar acentos/maiúsculas.

**Motivo da nota** mostrado em texto, ex.: "78/100 · processos (+30) · Power BI (+5) · RJ híbrido · pede 2 anos (−10)".

Salário: mostrado quando a fonte informa; não é filtro. Destaque opcional abaixo de um mínimo configurável.

## 8. Telas

1. **Login** — e-mail e senha (Supabase Auth). Cadastro público **desligado**: só a conta do Luís existe.
2. **Sugestões** (página inicial) — cartões ordenados por nota; filtro por área e fonte; botões **Adicionar à minha lista**, **Descartar**, **Não tenho interesse nessa empresa**. Mostra a última busca diária e se alguma fonte falhou.
3. **Minhas vagas** — tabela: empresa, cargo, link, data, status, nota, currículo enviado, próximo follow-up. Editar inline o status. Botões: Nova vaga, Importar CSV.
4. **Vaga (detalhe)** — todos os campos, notas, histórico de status (com data), currículo enviado, data de follow-up.
5. **Currículos** — upload de PDF com nome da versão (ex.: "Processos v3"), lista, abrir/baixar (link temporário), quantas vagas usaram cada versão.
6. **Painel** — contagem por status (interessado, apliquei, entrevista, recusado, oferta); lista "follow-ups desta semana"; quantas sugestões novas hoje.
7. **Configurações** — termos de busca, pesos, empresas (Greenhouse/Ashby), lista de empresas bloqueadas, "outras cidades", salário mínimo, link do bookmarklet.
8. **Salvar** (`/salvar`) — página que o bookmarklet abre, com link e texto pré-preenchidos.

## 9. Dados (Supabase / Postgres)

- `vagas` — id, empresa, cargo, link, local, modalidade (presencial/híbrido/remoto), descricao, fonte, data_encontrada, status, notas, nota_aderencia, motivos (json), curriculo_id (→ curriculos), proximo_followup (data), criado_em, atualizado_em.
- `historico_status` — vaga_id, status_anterior, status_novo, data.
- `sugestoes` — id, fonte, id_externo, chave_duplicidade (única), empresa, cargo, link, local, modalidade, descricao, salario, publicada_em, nota, motivos, area, estado (nova/adicionada/descartada), criado_em.
- `curriculos` — id, nome_versao, caminho_arquivo (Storage), criado_em.
- `configuracoes` — uma linha com o perfil (termos, pesos, empresas, bloqueadas, opções) em JSON.
- `execucoes_busca` — data, fonte, quantas encontradas, quantas novas, quantas eliminadas, erro.

Todas as tabelas com **RLS ligado**; só o usuário logado lê/escreve. Rotas de Cron/ingestão usam a chave de serviço no servidor, protegidas por segredo.

**Follow-up (decisão de Claude):** ao mudar para "apliquei", `proximo_followup` = hoje + 7 dias; "entrevista" → +3 dias; "recusado"/"oferta" → limpa. Luís pode editar a data. "Follow-ups desta semana" = data até o próximo domingo, incluindo atrasados.

**Sugestões antigas:** descartadas somem da tela; novas com mais de 30 dias deixam de aparecer.

## 10. Busca diária

- Vercel Cron chama `GET /api/cron/buscar` 1x por dia (~7h de Brasília), com `CRON_SECRET`.
- Busca as fontes 1–4 em paralelo, cada uma com tempo-limite e tratamento de erro próprio.
- Para cada vaga: normaliza campos → elimina/pontua → grava em `sugestoes` se não duplicada.
- Registra uma linha por fonte em `execucoes_busca`.
- Botão "Buscar agora" (manual) em Sugestões, para testar sem esperar o dia seguinte.

## 11. Segredos

`.env.local` local (fora do git) e variáveis de ambiente na Vercel: URL/chaves do Supabase, `JOOBLE_API_KEY`, `CRON_SECRET`, `INGEST_SECRET`. Nunca no código, nunca no chat.

## 12. Forma de trabalho

- Etapas pequenas, cada uma termina com algo visível no navegador e um commit em português.
- A cada etapa, Claude explica em poucas linhas o que fez e por quê.
- Deploy na Vercel cedo (logo após a primeira tela), para "funciona online" não ficar para o fim.
- `CLAUDE.md` na raiz com decisões e convenções; atualizado quando algo mudar.
- README em português apresentável para o portfólio (o que é, prints, stack, como rodar).
- Repositório público no GitHub **sem** dados pessoais (nada de currículo ou vagas reais versionados).

## 12b. Decisões tomadas por Claude após revisão (Luís pode corrigir)

1. **Português e inglês:** cada palavra-chave tem sinônimos nos dois idiomas (ex.: "melhoria contínua" / "continuous improvement", "PCP" / "production planning"). Greenhouse/Ashby publicam quase tudo em inglês.
2. **Remoto:** remoto no Brasil conta como "remoto" normal. Remoto LatAm/Américas/mundial aparece, com etiqueta "remoto internacional" e −5 (geralmente exige inglês fluente e contrato PJ/USD). Remoto restrito a outro país (ex.: "Remote – US") é eliminado.
3. **Vagas eliminadas são guardadas** em `sugestoes` com estado `eliminada` e o motivo. Quando Luís muda pesos/filtros em Configurações, as sugestões dos últimos 30 dias são **repontuadas**.
4. **Duplicidade:** primeiro por `fonte + id_externo`; entre fontes, por empresa+cargo+cidade normalizados **dentro de 60 dias**. Também confere com "Minhas vagas" (não sugere o que já está na lista). Depois de 60 dias, uma vaga repostada pode voltar.
5. **Entradas manuais** (formulário, CSV, bookmarklet) viram `vaga` direto na lista, mas passam pela mesma função de nota (o texto selecionado no bookmarklet vira `descricao`). Uma função de pontuação só, usada por todas as entradas.
6. **Pesos editáveis:** um peso por categoria (Processos, IA-alto, IA-médio, IA-baixo, Ferramentas, Contexto, Nível, cada penalidade) + **lista de palavras-chave editável por categoria** (adicionar/remover). Pesos iniciais da IA: alto 40, médio 25, baixo 15.

## 13. Deixado para quem constrói

- Ordem exata das etapas e estrutura de pastas.
- Bibliotecas auxiliares (ex.: leitor de CSV, componentes de UI) — preferir poucas e populares.
- Layout visual (limpo, legível, Tailwind).
- Lista inicial de empresas Greenhouse/Ashby.
- Detalhes do parser do e-mail do LinkedIn (definidos com um e-mail real do Luís).

## 14. Fase 2 (depois do "pronto")

- Modo demonstração para recrutadores (dados fictícios).
- Ajuste automático de pesos aprendendo com o que o Luís adiciona/descarta.
- Análise de encaixe com IA (LLM), se valer o custo.
- Mais fontes.
