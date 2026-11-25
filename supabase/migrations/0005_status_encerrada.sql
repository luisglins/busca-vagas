-- Novo status "encerrada": a vaga fechou no site da empresa (não dá mais para se candidatar).
alter table public.vagas drop constraint vagas_status_check;
alter table public.vagas add constraint vagas_status_check
  check (status in ('interessado', 'apliquei', 'entrevista', 'recusado', 'oferta', 'encerrada'));
