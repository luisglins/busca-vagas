-- Esquema do Busca Vagas (design, seção 9).
-- Um usuário só (Luís). RLS ligado em tudo: só quem está logado lê e escreve.

-- Currículos (PDF fica no Storage; aqui só o registro)
create table public.curriculos (
  id uuid primary key default gen_random_uuid(),
  nome_versao text not null,
  caminho_arquivo text not null,
  criado_em timestamptz not null default now()
);

-- Vagas que o Luís está acompanhando
create table public.vagas (
  id uuid primary key default gen_random_uuid(),
  empresa text not null,
  cargo text not null,
  link text,
  local text,
  modalidade text,
  descricao text,
  fonte text not null default 'manual',
  data_encontrada date not null default (now() at time zone 'America/Sao_Paulo')::date,
  status text not null default 'interessado'
    check (status in ('interessado', 'apliquei', 'entrevista', 'recusado', 'oferta')),
  notas text,
  nota_aderencia int,
  motivos jsonb,
  chave_duplicidade text,
  curriculo_id uuid references public.curriculos (id) on delete set null,
  proximo_followup date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index vagas_chave_duplicidade_idx on public.vagas (chave_duplicidade);

-- Histórico de mudanças de status
create table public.historico_status (
  id uuid primary key default gen_random_uuid(),
  vaga_id uuid not null references public.vagas (id) on delete cascade,
  status_anterior text,
  status_novo text not null,
  data timestamptz not null default now()
);
create index historico_status_vaga_idx on public.historico_status (vaga_id);

-- Sugestões vindas da busca diária
create table public.sugestoes (
  id uuid primary key default gen_random_uuid(),
  fonte text not null,
  id_externo text not null,
  chave_duplicidade text not null,
  empresa text not null,
  cargo text not null,
  link text,
  local text,
  modalidade text,
  descricao text,
  salario text,
  publicada_em timestamptz,
  nota int not null default 0,
  motivos jsonb,
  area text,
  estado text not null default 'nova'
    check (estado in ('nova', 'adicionada', 'descartada', 'eliminada')),
  motivo_eliminacao text,
  criado_em timestamptz not null default now(),
  unique (fonte, id_externo)
);
create index sugestoes_chave_duplicidade_idx on public.sugestoes (chave_duplicidade);
create index sugestoes_estado_criado_idx on public.sugestoes (estado, criado_em desc);

-- Configurações: uma linha só, com o perfil em JSON
create table public.configuracoes (
  id int primary key default 1 check (id = 1),
  perfil jsonb not null,
  atualizado_em timestamptz not null default now()
);

-- Registro de cada execução da busca, por fonte
create table public.execucoes_busca (
  id uuid primary key default gen_random_uuid(),
  data timestamptz not null default now(),
  fonte text not null,
  encontradas int not null default 0,
  novas int not null default 0,
  eliminadas int not null default 0,
  erro text
);
create index execucoes_busca_data_idx on public.execucoes_busca (data desc);

-- Atualiza "atualizado_em" automaticamente
create function public.tocar_atualizado_em() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;
create trigger vagas_atualizado_em before update on public.vagas
  for each row execute function public.tocar_atualizado_em();
create trigger configuracoes_atualizado_em before update on public.configuracoes
  for each row execute function public.tocar_atualizado_em();

-- Segurança: RLS em todas as tabelas. O cadastro público fica desligado no Supabase Auth,
-- então "autenticado" = Luís. A busca diária usa a chave de serviço no servidor.
alter table public.curriculos enable row level security;
alter table public.vagas enable row level security;
alter table public.historico_status enable row level security;
alter table public.sugestoes enable row level security;
alter table public.configuracoes enable row level security;
alter table public.execucoes_busca enable row level security;

create policy "dono acessa curriculos" on public.curriculos for all to authenticated using (true) with check (true);
create policy "dono acessa vagas" on public.vagas for all to authenticated using (true) with check (true);
create policy "dono acessa historico" on public.historico_status for all to authenticated using (true) with check (true);
create policy "dono acessa sugestoes" on public.sugestoes for all to authenticated using (true) with check (true);
create policy "dono acessa configuracoes" on public.configuracoes for all to authenticated using (true) with check (true);
create policy "dono acessa execucoes" on public.execucoes_busca for all to authenticated using (true) with check (true);

-- Storage: bucket privado para os PDFs (até 5 MB, só PDF)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('curriculos', 'curriculos', false, 5242880, array['application/pdf']);

create policy "dono le curriculos" on storage.objects for select to authenticated
  using (bucket_id = 'curriculos');
create policy "dono envia curriculos" on storage.objects for insert to authenticated
  with check (bucket_id = 'curriculos');
create policy "dono apaga curriculos" on storage.objects for delete to authenticated
  using (bucket_id = 'curriculos');
