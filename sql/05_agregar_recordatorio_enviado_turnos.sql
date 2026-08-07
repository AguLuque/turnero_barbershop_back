-- Fase 1 (push): columna para marcar si ya se le mando el recordatorio push
-- de 1 hora antes a un turno, y no reenviarlo en la siguiente corrida del job.

alter table public.turnos
  add column if not exists recordatorio_enviado boolean not null default false;
