-- Fase 1 (push): tabla de suscripciones Web Push por perfil.
-- Un mismo perfil puede tener varias suscripciones (un dispositivo/navegador cada una).
-- RLS habilitado sin politicas: la tabla solo es accesible via service_role
-- (que bypasea RLS), que es como el backend accede a todo. No hay acceso
-- directo desde el frontend a esta tabla.

create table if not exists public.suscripciones_push (
  id uuid primary key default gen_random_uuid(),
  id_perfil uuid not null references public.perfiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  creado_en timestamptz not null default now()
);

create index if not exists suscripciones_push_id_perfil_idx on public.suscripciones_push (id_perfil);

alter table public.suscripciones_push enable row level security;
