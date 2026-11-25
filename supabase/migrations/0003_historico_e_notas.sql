-- Quando o Luís decidiu sobre a sugestão (adicionar, descartar, bloquear) — base do Histórico.
alter table public.sugestoes add column decidido_em timestamptz;
create index sugestoes_decidido_idx on public.sugestoes (decidido_em desc) where decidido_em is not null;

-- Recalcula notas em lote (usada ao salvar Configurações): recebe [{id, nota, motivos, area, estado, motivo_eliminacao}].
-- security invoker: roda com as permissões de quem chamou, então o RLS continua valendo.
create function public.aplicar_notas(dados jsonb) returns integer
language sql security invoker set search_path = '' as $$
  with entrada as (
    select * from jsonb_to_recordset(dados)
      as x(id uuid, nota int, motivos jsonb, area text, estado text, motivo_eliminacao text)
  ), atualizadas as (
    update public.sugestoes s
       set nota = e.nota, motivos = e.motivos, area = e.area, estado = e.estado, motivo_eliminacao = e.motivo_eliminacao
      from entrada e
     where s.id = e.id and s.estado in ('nova', 'eliminada')
    returning 1
  )
  select count(*)::int from atualizadas;
$$;
