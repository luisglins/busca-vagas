-- Prazo de inscrição (a Gupy informa) e cidade separada, para o "Veja mais" e os filtros.
alter table public.sugestoes add column prazo_inscricao timestamptz;
alter table public.sugestoes add column cidade text;
