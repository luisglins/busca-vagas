# Busca Vagas — Plano de implementação

> **Para quem executa:** SUB-SKILL OBRIGATÓRIA: usar superpowers:executing-plans (ou subagent-driven-development) para executar este plano tarefa por tarefa. Passos usam checkbox (`- [ ]`).

**Objetivo:** site pessoal que sugere vagas com nota de aderência e acompanha candidaturas, currículos e follow-ups, online na Vercel.

**Arquitetura:** um único projeto Next.js (App Router, TypeScript). Lógica pura (nota, normalização, follow-up, CSV, adaptadores de fonte) em `src/lib/`, testada com Vitest. Supabase para banco (Postgres + RLS), login e PDFs (bucket privado). Busca diária por Vercel Cron chamando uma rota de API.

**Stack:** Next.js (create-next-app@latest) · TypeScript · Tailwind · @supabase/supabase-js + @supabase/ssr · Vitest · papaparse (CSV) · Vercel.

**Spec:** `docs/design.md` (aprovado). Contexto histórico: `docs/decisoes-brainstorm.md`.

## Restrições globais

- Custo zero: Vercel Hobby (Cron 1x/dia), Supabase Free, Apps Script.
- Interface, nomes de domínio no código (vaga, sugestao, curriculo…), commits e explicações em **português**.
- Commits pequenos, um por tarefa no mínimo; mensagem em português no imperativo (ex.: "Adiciona tela de currículos"), terminando com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Segredos só em `.env.local` (fora do git) e variáveis da Vercel. Nunca no código nem no chat. O `.env` atual (chave Jooble) migra para `.env.local`.
- Nada de dados pessoais versionados (currículos, vagas reais). Fixtures de teste usam vagas públicas do spike.
- Todas as tabelas com RLS ligado; cadastro público desligado no Supabase Auth.
- Datas de "semana" e follow-up no fuso `America/Sao_Paulo`, guardadas como `date` (AAAA-MM-DD).
- Cada tarefa termina com algo verificável no navegador (ou nos testes, para lógica pura) e Claude explica em poucas linhas o que foi feito.
- Atualizar `CLAUDE.md` quando uma decisão mudar.

## Foco de revisão

1. **Fonte fora do ar ou com formato novo** (Gupy é não oficial): as outras fontes continuam, o erro fica em `execucoes_busca` e aparece na tela de Sugestões. → teste na Tarefa 11.
2. **Acentos e maiúsculas** ("MELHORIA CONTINUA", "Melhoria Contínua", "melhoria continua") casam igual; "PCP" não casa dentro de outra palavra. → testes na Tarefa 9.
3. **CSV exportado do Excel brasileiro** (separador `;`, BOM UTF-8, datas DD/MM/AAAA): importa certo. → teste na Tarefa 14.
4. **Upload que não é PDF ou maior que 5 MB:** recusado com mensagem clara. → teste na Tarefa 7.
5. **Mesma vaga duas vezes** (na mesma busca, de duas fontes, ou já em "Minhas vagas"): não gera sugestão duplicada. → teste na Tarefa 11.

## Estrutura de arquivos

```
busca-vagas/
  CLAUDE.md, README.md, vercel.json, .env.local (fora do git), .env.example
  docs/design.md, docs/plano.md, docs/decisoes-brainstorm.md
  supabase/migrations/0001_esquema.sql
  src/lib/tipos.ts              tipos compartilhados
  src/lib/texto.ts              normalizarTexto, contemPalavra, chaveDuplicidade
  src/lib/followup.ts           proximoFollowup, followupsDaSemana
  src/lib/perfil-padrao.ts      PERFIL_PADRAO
  src/lib/pontuar.ts            pontuar
  src/lib/fontes/gupy.ts, greenhouse.ts, ashby.ts   adaptadores
  src/lib/busca.ts              executarBusca
  src/lib/csv.ts                lerCsvVagas
  src/lib/arquivo.ts            validarPdf
  src/lib/supabase/servidor.ts, navegador.ts, admin.ts
  src/app/(app)/...             telas logadas (sugestoes, vagas, vagas/[id], curriculos, painel, configuracoes, salvar)
  src/app/login/page.tsx
  src/app/api/cron/buscar/route.ts
  tests/*.test.ts + tests/fixtures/*.json
```

## Interfaces compartilhadas (`src/lib/tipos.ts`)

```ts
export type Status = 'interessado' | 'apliquei' | 'entrevista' | 'recusado' | 'oferta';
export type Fonte = 'gupy' | 'greenhouse' | 'ashby' | 'jooble' | 'linkedin' | 'manual';
export type Modalidade = 'presencial' | 'hibrido' | 'remoto' | 'remoto_internacional' | 'exterior' | 'desconhecida';
export type Area = 'processos' | 'ia';

export interface VagaBruta {
  fonte: Fonte; idExterno: string; empresa: string; cargo: string; link: string;
  cidade?: string; estado?: string; modalidade: Modalidade; localTexto: string;
  descricao: string; salario?: string; publicadaEm?: string;
}

export type IdCategoria = 'processos' | 'ia_alto' | 'ia_medio' | 'ia_baixo' | 'ferramentas' | 'contexto' | 'nivel';
export interface Categoria { id: IdCategoria; peso: number; palavras: string[] }
export type IdPenalidade = 'experiencia' | 'crea' | 'pleno' | 'ia_programacao' | 'remoto_internacional';
export interface Penalidade { id: IdPenalidade; valor: number; palavras: string[] }

export interface Perfil {
  termosBusca: string[]; empresasGreenhouse: string[]; empresasAshby: string[];
  empresasBloqueadas: string[]; aceitarOutrasCidades: boolean; salarioMinimo: number | null;
  palavrasEliminatorias: string[];   // nível: estágio, sênior, coordenador...
  categorias: Categoria[]; penalidades: Penalidade[];
}

export interface Resultado {
  nota: number; motivos: string[]; area: Area | null;
  eliminada: boolean; motivoEliminacao?: string;
}

export interface ResumoExecucao {
  fonte: Fonte; encontradas: number; novas: number; eliminadas: number; erro: string | null;
}
```

---

### Tarefa 1: Projeto, git e primeira página

**Arquivos:** criar projeto Next.js em `busca-vagas/`, `CLAUDE.md`, `.env.example`, `vitest.config.ts`, `tests/exemplo.test.ts`.

- [ ] **1.** Mover temporariamente `docs/`, `.env`, `.gitignore` para fora da pasta (create-next-app exige pasta vazia), rodar `npx create-next-app@latest busca-vagas --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`, devolver `docs/`, renomear `.env` → `.env.local`, garantir `.env*` (exceto `.env.example`) no `.gitignore`.
- [ ] **2.** Instalar Vitest (`npm i -D vitest`), script `"test": "vitest run"`, teste trivial `1+1=2`. Rodar `npm test` → PASS.
- [ ] **3.** Trocar `src/app/page.tsx` por página simples "Busca Vagas — em construção" em português.
- [ ] **4.** Escrever `CLAUDE.md`: objetivo, stack, decisões-chave do design (link para `docs/design.md`), convenções (português, commits, segredos, RLS), comandos (`npm run dev`, `npm test`).
- [ ] **5.** Verificar: `npm run dev` → `http://localhost:3000` mostra a página.
- [ ] **6.** `git init`, conferir com `git status` que `.env.local` NÃO aparece, commit "Cria projeto Next.js com documento de design".

### Tarefa 2: Publicar na Vercel

Depende de ações do Luís: criar conta GitHub (se não tiver) e Vercel, autorizar a Vercel no GitHub.

- [ ] **1.** Criar repositório público `busca-vagas` no GitHub do Luís (`gh repo create` se o `gh` estiver logado; senão, guiar pelo site) e fazer push.
- [ ] **2.** Luís importa o repositório na Vercel (guiado passo a passo).
- [ ] **3.** Verificar: o link `*.vercel.app` mostra a página. Registrar o link no `CLAUDE.md`, commit "Registra link da Vercel".

### Tarefa 3: Supabase e login

**Arquivos:** `src/lib/supabase/{servidor,navegador,admin}.ts`, `src/app/login/page.tsx`, proteção de rotas (middleware/proxy conforme o guia atual do `@supabase/ssr` para Next.js), `src/app/(app)/layout.tsx` com menu e botão Sair.

- [ ] **1.** Luís cria projeto no Supabase (região São Paulo), desliga "Allow new users to sign up", cria o próprio usuário em Authentication → Users. Chaves vão para `.env.local` e Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` ou publishable key, `SUPABASE_SERVICE_ROLE_KEY` ou secret key).
- [ ] **2.** Implementar login com e-mail e senha; qualquer rota fora de `/login` sem sessão redireciona para `/login`; `admin.ts` (chave de serviço) só importável no servidor (`import 'server-only'`).
- [ ] **3.** Menu do layout: Sugestões, Minhas vagas, Currículos, Painel, Configurações, Sair.
- [ ] **4.** Verificar no navegador: aba anônima em `/vagas` → vai para `/login`; senha errada → mensagem "E-mail ou senha incorretos"; certa → entra; Sair → volta ao login. Repetir na Vercel após push.
- [ ] **5.** Commit "Adiciona login com Supabase".

### Tarefa 4: Esquema do banco

**Arquivos:** `supabase/migrations/0001_esquema.sql`.

- [ ] **1.** Escrever SQL com as tabelas da seção 9 do design: `vagas`, `historico_status`, `sugestoes`, `curriculos`, `configuracoes`, `execucoes_busca`. Pontos fixos:
  - `vagas.status` text com check nos 5 status, default `'interessado'`; `proximo_followup date`; `nota_aderencia int`; `motivos jsonb`; `chave_duplicidade text`; `curriculo_id` → `curriculos(id) on delete set null`.
  - `sugestoes`: `unique (fonte, id_externo)`; índice em `chave_duplicidade`; `estado` check em `('nova','adicionada','descartada','eliminada')`; `motivo_eliminacao text`; `area text`.
  - `configuracoes`: `id int primary key default 1 check (id = 1)`, `perfil jsonb not null`.
  - `historico_status.vaga_id` → `vagas(id) on delete cascade`.
  - RLS ligado em todas; política "usuário autenticado pode tudo" (`to authenticated using (true) with check (true)`) — aceitável porque o cadastro público está desligado.
  - Bucket de Storage `curriculos` **privado**, com política só para `authenticated`.
- [ ] **2.** Luís cola e roda o SQL no SQL Editor do Supabase (bom exercício: ele já sabe SQL). Claude explica cada bloco.
- [ ] **3.** Verificar: as 6 tabelas aparecem no Table Editor; consultar `vagas` deslogado pela API anon retorna vazio/erro.
- [ ] **4.** Commit "Cria esquema do banco com RLS".

### Tarefa 5: Minhas vagas — lista, cadastro e status

**Arquivos:** `src/lib/followup.ts`, `tests/followup.test.ts`, `src/app/(app)/vagas/page.tsx`, `src/app/(app)/vagas/acoes.ts` (server actions).

**Produz:** `proximoFollowup(status: Status, hoje: string): string | null` (datas `AAAA-MM-DD`); `followupsDaSemana<T extends { proximo_followup: string | null }>(vagas: T[], hoje: string): T[]`.

- [ ] **1.** Testes: `proximoFollowup('apliquei','2026-11-24')` = `'2026-12-01'`; `'entrevista'` → `'2026-11-27'`; `'recusado'`, `'oferta'` → `null`; `'interessado'` → `null`. `followupsDaSemana` com hoje = terça `'2026-11-24'`: inclui `'2026-11-20'` (atrasado) e `'2026-11-29'` (domingo), exclui `'2026-11-30'` e `null`; com hoje = domingo `'2026-11-29'` inclui o próprio dia.
- [ ] **2.** `npm test` → FAIL. Implementar. `npm test` → PASS.
- [ ] **3.** Tela: tabela (empresa, cargo, link abre em nova aba, data encontrada, status, nota, próximo follow-up), ordenada por data desc; formulário "Nova vaga" (empresa*, cargo*, link, data encontrada default hoje, notas); select de status inline. Mudar status grava `historico_status` e recalcula `proximo_followup` com `proximoFollowup`. Estado vazio: "Nenhuma vaga ainda. Cadastre a primeira ou adicione uma sugestão."
- [ ] **4.** Verificar no navegador: cadastrar vaga, mudar para "apliquei", ver follow-up = hoje + 7.
- [ ] **5.** Commit "Adiciona lista e cadastro de vagas".

### Tarefa 6: Detalhe da vaga

**Arquivos:** `src/app/(app)/vagas/[id]/page.tsx`, ações em `vagas/acoes.ts`.

- [ ] **1.** Página com todos os campos editáveis (inclui notas, link, data de follow-up manual), histórico de status com datas, motivos da nota (se houver), botão Excluir com confirmação.
- [ ] **2.** Verificar: editar notas e follow-up, recarregar, persistiu; excluir volta à lista.
- [ ] **3.** Commit "Adiciona página de detalhe da vaga".

### Tarefa 7: Currículos

**Arquivos:** `src/lib/arquivo.ts`, `tests/arquivo.test.ts`, `src/app/(app)/curriculos/page.tsx`, campo de currículo no detalhe e na lista de vagas.

**Produz:** `validarPdf(arquivo: { name: string; type: string; size: number }): string | null` (mensagem de erro ou `null`).

- [ ] **1.** Testes: PDF de 1 MB → `null`; `type: 'image/png'` → `'Envie um arquivo PDF.'`; PDF de 6 MB → `'O arquivo passa de 5 MB.'`; nome `.PDF` maiúsculo com type `application/pdf` → `null`.
- [ ] **2.** FAIL → implementar → PASS.
- [ ] **3.** Tela: upload com "nome da versão" obrigatório, grava em Storage `curriculos/<uuid>.pdf`, lista versões com data e "usado em N vagas", botão Abrir (signed URL de 60 s), Excluir (bloqueado se usado em vagas; mensagem explica). No detalhe da vaga, select "Currículo enviado"; na lista, coluna com o nome da versão.
- [ ] **4.** Verificar: subir o PDF do currículo, abrir; tentar subir uma imagem → mensagem; vincular a uma vaga; copiar o link do PDF e abrir numa aba anônima depois de 1 min → acesso negado.
- [ ] **5.** Commit "Adiciona versões de currículo".

### Tarefa 8: Painel

**Arquivos:** `src/app/(app)/painel/page.tsx`.

- [ ] **1.** Cinco cartões com contagem por status (zeros aparecem); lista "Follow-ups desta semana" usando `followupsDaSemana` (atrasados em destaque, link para a vaga); contador "sugestões novas hoje" (0 até a Tarefa 11).
- [ ] **2.** Verificar: mudar status de uma vaga e ver o painel mudar. Push e conferir na Vercel → **marco: requisitos originais 1–3 online.**
- [ ] **3.** Commit "Adiciona painel".

### Tarefa 9: Nota de aderência

**Arquivos:** `src/lib/texto.ts`, `src/lib/perfil-padrao.ts`, `src/lib/pontuar.ts`, `tests/texto.test.ts`, `tests/pontuar.test.ts`.

**Produz:** `normalizarTexto(s: string): string` (minúsculas, sem acento, pontuação → espaço, espaços colapsados); `contemPalavra(textoNormalizado: string, palavra: string): boolean` (palavra normalizada, casamento por fronteira de palavra); `chaveDuplicidade(empresa: string, cargo: string, cidade?: string): string`; `PERFIL_PADRAO: Perfil`; `pontuar(vaga: VagaBruta, perfil: Perfil): Resultado`.

Regras de `pontuar` (do design, seções 7 e 12b):
- Eliminação, nesta ordem: empresa em `empresasBloqueadas` → "empresa bloqueada"; título com palavra de `palavrasEliminatorias` (estágio, estagiário, estagio, intern, internship, sênior, senior, sr, coordenador, coordinator, gerente, manager, especialista, specialist, head, diretor, director, lead) → "nível: <palavra>"; `modalidade === 'exterior'` → "remoto só para outro país"; presencial/híbrido/desconhecida com cidade conhecida fora da região metropolitana do RJ e `aceitarOutrasCidades = false` → "fora do RJ". Local desconhecido não elimina (motivo "local não informado").
- Região metropolitana do RJ: Rio de Janeiro, Niterói, São Gonçalo, Duque de Caxias, Nova Iguaçu, Belford Roxo, São João de Meriti, Nilópolis, Mesquita, Queimados, Japeri, Paracambi, Seropédica, Itaguaí, Magé, Guapimirim, Itaboraí, Tanguá, Maricá, Rio Bonito, Cachoeiras de Macacu.
- Cada categoria soma `peso` se alguma palavra aparece no título, `peso/2` (arredondado para baixo) se só na descrição, 0 se não aparece. Cada penalidade subtrai `valor` se alguma palavra aparece em título ou descrição; `remoto_internacional` aplica-se pela modalidade.
- Pesos iniciais: processos 40, ia_alto 40, ia_medio 25, ia_baixo 15, ferramentas 25, contexto 10, nivel 10. Penalidades: experiencia −10, crea −10, pleno −10, ia_programacao −20, remoto_internacional −5.
- `area`: `'processos'` se pontos de processos ≥ soma dos ia_*, `'ia'` se menor, `null` se ambos 0.
- `nota` = soma limitada a 0–100. `motivos` = um item por categoria/penalidade aplicada, ex.: `"processos (+40)"`, `"pede experiência (−10)"`, mais `"RJ híbrido"` / `"remoto"` / `"remoto internacional (−5)"` / `"local não informado"`.
- Palavras-chave iniciais em português **e inglês** para cada categoria (lista final fica a critério de quem constrói, a partir das seções 7 e 12b; incluir pelo menos: processos → "engenharia de processos", "melhoria continua", "continuous improvement", "pcp", "planejamento e controle da producao", "production planning", "qualidade", "operacoes", "operations", "logistica", "logistics", "producao", "lean"; ia_alto → "automacao", "automation", "inteligencia artificial", "ia", "ai", "copilot", "agentes", "no code", "low code"; ia_programacao → "desenvolvedor", "developer", "engenheiro de software", "machine learning engineer", "ml engineer"; experiencia → "3 anos", "5 anos", "3+ years", "experiencia comprovada"; crea → "crea ativo").

- [ ] **1.** Testes de `texto.ts`: `normalizarTexto('MELHORIA CONTÍNUA!')` = `'melhoria continua'`; `contemPalavra('analista de pcp', 'PCP')` = true; `contemPalavra('pcpx sistema', 'pcp')` = false; `contemPalavra('analista de ia', 'IA')` = true e `contemPalavra('farmacia', 'ia')` = false; `chaveDuplicidade('Light S.A.', 'Analista de PCP I', 'Rio de Janeiro')` = `chaveDuplicidade('light sa', 'analista de pcp i', 'rio de janeiro')`.
- [ ] **2.** Testes de `pontuar` com `PERFIL_PADRAO` (vagas reais do spike):
  - "Farmacêutico Trainee", Rede D'Or, Rio de Janeiro, presencial → não eliminada, `nota < 20`.
  - "Assistente de PCP", AZZAS, Rio de Janeiro, híbrido → não eliminada, `nota >= 50`, `area === 'processos'`, motivos contém `"processos (+40)"`.
  - "Pessoa Engenheira de Inteligência Artificial (IA) - Senior", remoto → eliminada, motivo começa com `"nível"`.
  - "Estágio em Contabilidade: Dados e Inteligência Artificial" → eliminada.
  - "Continuous Improvement Analyst", remoto → `area === 'processos'`, `nota >= 40`.
  - "Desenvolvedor de Automação de Processos Pleno | Power Apps", remoto → motivos contém penalidades de `ia_programacao` e `pleno`.
  - Vaga em São Paulo presencial → eliminada "fora do RJ"; mesma vaga com `aceitarOutrasCidades: true` → não eliminada.
  - Vaga em Itaguaí presencial → não eliminada.
  - Modalidade `'exterior'` → eliminada; `'remoto_internacional'` → motivos contém `"remoto internacional (−5)"`.
  - Empresa "Light" em `empresasBloqueadas` → eliminada "empresa bloqueada".
  - Nenhuma nota fora de 0–100 (vaga com todas as penalidades → 0).
- [ ] **3.** `npm test` → FAIL. Implementar. `npm test` → PASS.
- [ ] **4.** Commit "Adiciona cálculo da nota de aderência".

### Tarefa 10: Adaptadores de fonte

**Arquivos:** `src/lib/fontes/{gupy,greenhouse,ashby}.ts`, `tests/fontes.test.ts`, `tests/fixtures/{gupy,greenhouse,ashby}.json` (respostas reais salvas uma vez com 3–5 vagas cada).

**Produz:**
```ts
export interface Adaptador { fonte: Fonte; buscar(perfil: Perfil, fetchFn?: typeof fetch): Promise<VagaBruta[]> }
export const gupy: Adaptador; export const greenhouse: Adaptador; export const ashby: Adaptador;
```
- Gupy: `GET https://portal.gupy.io/api/job-search/jobs?jobName=<termo>&limit=100&offset=0` para cada `perfil.termosBusca`; `workplaceType` `on-site`→presencial, `hybrid`→hibrido, `remote`→remoto; `idExterno = String(id)`; empresa = `careerPageName`; link = `jobUrl`.
- Greenhouse: `GET https://boards-api.greenhouse.io/v1/boards/<empresa>/jobs?content=true` para cada `perfil.empresasGreenhouse`; descrição vem em HTML escapado → texto puro.
- Ashby: `GET https://api.ashbyhq.com/posting-api/job-board/<empresa>` para cada `perfil.empresasAshby`; usar `isRemote`/`location`.
- Greenhouse/Ashby: modalidade a partir do texto do local — contém "remote"/"remoto" + Brazil/Brasil → `remoto`; "remote" + LatAm/Latin America/Americas/Anywhere/Worldwide → `remoto_internacional`; "remote" + outro país explícito (US, USA, United States, Canada, Europe, UK…) → `exterior`; senão presencial/híbrido com cidade extraída.
- Timeout de 15 s por requisição; uma empresa/termo que falha não derruba o adaptador (registra e segue), mas falha total do adaptador lança erro.
- Lista inicial de empresas Greenhouse/Ashby em `PERFIL_PADRAO`: Claude monta e **confere cada slug com uma requisição real** antes de incluir.

- [ ] **1.** Salvar fixtures (rodar uma vez contra as APIs, cortar para poucas vagas, remover nada pessoal — são vagas públicas).
- [ ] **2.** Testes com `fetchFn` falso servindo as fixtures: cada adaptador devolve `VagaBruta[]` com `fonte`, `idExterno`, `empresa`, `cargo`, `link` preenchidos; Gupy `hybrid` → `'hibrido'`; Greenhouse "Remote - Brazil" → `'remoto'`, "Remote - US" → `'exterior'`, "Remote - LatAm" → `'remoto_internacional'`; descrição sem tags HTML.
- [ ] **3.** FAIL → implementar → PASS.
- [ ] **4.** Commit "Adiciona adaptadores Gupy, Greenhouse e Ashby".

### Tarefa 11: Busca diária

**Arquivos:** `src/lib/busca.ts`, `tests/busca.test.ts`, `src/app/api/cron/buscar/route.ts`, `vercel.json`, ação "Buscar agora".

**Produz:**
```ts
export interface DepsBusca {
  adaptadores: Adaptador[]; perfil: Perfil;
  chavesExistentes: Set<string>;          // chave_duplicidade de vagas + sugestões dos últimos 60 dias
  idsExistentes: Set<string>;             // `${fonte}:${idExterno}` já gravados
  salvar(sugestoes: SugestaoNova[]): Promise<void>;
  registrar(resumo: ResumoExecucao): Promise<void>;
}
export interface SugestaoNova extends VagaBruta { chaveDuplicidade: string; resultado: Resultado }
export function executarBusca(deps: DepsBusca): Promise<ResumoExecucao[]>;
```

- [ ] **1.** Testes com adaptadores falsos:
  - adaptador A lança erro, B devolve 2 vagas → retorna 2 resumos; A com `erro` preenchido e `encontradas: 0`; B salvo normalmente.
  - mesma vaga (mesma chave) em A e B → salva 1.
  - vaga cuja chave está em `chavesExistentes` → não salva; `novas` não conta.
  - vaga com `idExterno` já em `idsExistentes` → não salva.
  - vaga eliminada → salva com `resultado.eliminada = true` e conta em `eliminadas`.
- [ ] **2.** FAIL → implementar (adaptadores em paralelo com `Promise.allSettled`) → PASS.
- [ ] **3.** Rota `GET /api/cron/buscar`: exige header `Authorization: Bearer ${CRON_SECRET}` (401 senão); lê perfil de `configuracoes` (cria com `PERFIL_PADRAO` se não existir); monta deps com o cliente admin; grava `sugestoes` (estado `nova` ou `eliminada`) e `execucoes_busca`. `vercel.json`: cron `"0 10 * * *"` (7h de Brasília). Botão "Buscar agora" chama a mesma lógica via server action (usuário logado).
- [ ] **4.** Verificar: "Buscar agora" no localhost → linhas em `sugestoes` e `execucoes_busca` no Supabase; chamar a rota sem segredo → 401. Adicionar `CRON_SECRET` na Vercel.
- [ ] **5.** Commit "Adiciona busca diária de vagas".

### Tarefa 12: Tela de Sugestões

**Arquivos:** `src/app/(app)/sugestoes/page.tsx` (vira a página inicial após login), ações.

- [ ] **1.** Cartões de sugestões `nova` dos últimos 30 dias, ordenados por nota: cargo, empresa, local/modalidade, fonte, nota grande, motivos, salário se houver (destaque se abaixo de `salarioMinimo`), etiqueta "freelance/projeto" se casou `ia_medio` de avaliação de modelos. Filtros: área (Todas/Processos/IA), fonte. Rodapé: "N vagas eliminadas pelos filtros" com link para vê-las.
- [ ] **2.** Botões: **Adicionar à minha lista** (cria `vaga` com status `interessado`, nota, motivos, chave; sugestão → `adicionada`), **Descartar** (→ `descartada`), **Não tenho interesse nessa empresa** (adiciona em `empresasBloqueadas` e marca as sugestões dessa empresa como `eliminada`).
- [ ] **3.** Topo: data/hora da última busca e aviso por fonte que falhou; botão "Buscar agora".
- [ ] **4.** Verificar no navegador (local e Vercel): buscar, adicionar uma sugestão, ela aparece em Minhas vagas e o painel conta "interessado" +1; anexar currículo e mudar status → **marco: "pronto quando" atingido.**
- [ ] **5.** Commit "Adiciona tela de sugestões".

### Tarefa 13: Configurações

**Arquivos:** `src/app/(app)/configuracoes/page.tsx`, `src/lib/repontuar.ts`, `tests/repontuar.test.ts`.

**Produz:** `repontuar(sugestoes: Array<VagaBruta & { id: string; estado: string }>, perfil: Perfil): Array<{ id: string; resultado: Resultado; estado: 'nova' | 'eliminada' }>` — só altera estados `nova`/`eliminada`; `adicionada`/`descartada` ficam como estão.

- [ ] **1.** Testes: sugestão `eliminada` "fora do RJ" vira `nova` quando `aceitarOutrasCidades` passa a true; `descartada` não aparece no retorno; mudar peso de processos de 40 para 20 reduz a nota.
- [ ] **2.** FAIL → implementar → PASS.
- [ ] **3.** Tela: termos de busca, empresas Greenhouse/Ashby, empresas bloqueadas (listas editáveis: adicionar/remover), "aceitar outras cidades", salário mínimo, por categoria/penalidade: peso + lista de palavras editável. Salvar grava `configuracoes` e repontua sugestões dos últimos 30 dias. Botão "Restaurar padrão".
- [ ] **4.** Verificar: ligar "outras cidades" → sugestões de SP aparecem sem nova busca.
- [ ] **5.** Commit "Adiciona tela de configurações".

### Tarefa 14: Entradas manuais (CSV e botão do navegador)

**Arquivos:** `src/lib/csv.ts`, `tests/csv.test.ts`, botão "Importar CSV" em Minhas vagas, `src/app/(app)/salvar/page.tsx`, bookmarklet em Configurações.

**Produz:** `lerCsvVagas(conteudo: string): { vagas: Array<{ empresa: string; cargo: string; link?: string; data_encontrada?: string; notas?: string }>; erros: string[] }` — colunas reconhecidas sem diferenciar maiúsculas/acentos: empresa, cargo, link, data, notas.

- [ ] **1.** Testes: CSV com `;`, BOM e data `24/11/2026` → `data_encontrada: '2026-11-24'`; CSV com `,` também funciona; linha sem empresa → vai para `erros` como `"Linha 3: falta empresa"`; cabeçalho "Empresa;Cargo;Link" maiúsculo funciona.
- [ ] **2.** FAIL → implementar (papaparse com detecção de separador) → PASS.
- [ ] **3.** Importar CSV: prévia com N vagas e erros, botão Confirmar; cada vaga recebe nota via `pontuar` (fonte `manual`, modalidade `desconhecida`) e pula duplicadas pela chave. Disponibilizar `modelo.csv` para baixar.
- [ ] **4.** `/salvar?link=...&texto=...&titulo=...`: formulário pré-preenchido (cargo a partir do título da página; texto selecionado → descrição), mostra a nota calculada ao vivo, botão Salvar cria a vaga. Bookmarklet em Configurações: `javascript:` que abre `/salvar` em nova aba com `location.href`, `document.title` e `getSelection()` (limitado a 2.000 caracteres).
- [ ] **5.** Verificar: importar CSV feito no Excel; arrastar o bookmarklet para a barra de favoritos, abrir uma vaga qualquer, selecionar a descrição, clicar → formulário preenchido com nota.
- [ ] **6.** Commit "Adiciona importação por CSV e botão Salvar no meu site".

### Tarefa 15: README de portfólio e verificação final

- [ ] **1.** README em português: o que é e por quê, prints (com dados fictícios), funcionalidades, stack, decisões interessantes (nota explicável, LinkedIn sem scraping, RLS), como rodar localmente, link do site (só login).
- [ ] **2.** Conferir: `git log` sem segredos (`git grep` por chaves), nenhum PDF/dado pessoal no repositório, `npm test` e `npm run build` passam.
- [ ] **3.** Verificar o "pronto quando" inteiro no link da Vercel. Atualizar `CLAUDE.md`.
- [ ] **4.** Commit "Adiciona README do portfólio".

---

## Etapas seguintes (logo após a primeira versão)

### Tarefa 16: Jooble (quando a chave brasileira chegar)
Adaptador `jooble` (`POST https://jooble.org/api/<chave>` — confirmar host da chave BR), `keywords` = cada termo, `location` = "Rio de Janeiro"; fixture + testes no mesmo padrão da Tarefa 10; `JOOBLE_API_KEY` na Vercel.

### Tarefa 17: LinkedIn via alertas de e-mail (quando houver um e-mail real de alerta)
`src/lib/fontes/linkedin-email.ts` com `extrairVagasDoEmail(html: string): VagaBruta[]` testado com o e-mail real (anonimizado) como fixture; rota `POST /api/ingest/linkedin` protegida por `INGEST_SECRET`, passa pelo mesmo fluxo de `executarBusca` (dedupe + nota); Apps Script no Gmail do Luís (gatilho de hora em hora, busca `from:jobalerts-noreply@linkedin.com -label:busca-vagas`, envia o HTML, aplica o marcador). Script versionado em `scripts/apps-script/linkedin.gs` sem o segredo.
