-- Fase 3: agrega el modo "orden de llegada" a los bloqueos de horario.
-- La columna nueva tiene DEFAULT 'bloqueado', asi que las filas existentes
-- quedan todas como 'bloqueado' automaticamente y no se rompe nada.

alter table public.horarios_bloqueados
  add column if not exists tipo text not null default 'bloqueado';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'horarios_bloqueados_tipo_check'
      and conrelid = 'public.horarios_bloqueados'::regclass
  ) then
    alter table public.horarios_bloqueados
      add constraint horarios_bloqueados_tipo_check
      check (tipo in ('bloqueado', 'orden_llegada'));
  end if;
end $$;
