-- Catalogo de servicios por peluqueria (ej: "Corte", "Corte + barba").
-- Cada barbero administra sus servicios y precios desde el panel admin, asi que
-- los cambios de precio son datos y no requieren nuevas migraciones.
-- RLS habilitado sin politicas: solo se accede via service_role desde el backend.

create table if not exists public.servicios (
  id uuid primary key default gen_random_uuid(),
  id_peluqueria uuid not null references public.peluquerias(id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) between 1 and 60),
  precio numeric(12, 2) not null check (precio >= 0),
  activo boolean not null default true,
  orden integer not null default 0,
  creado_en timestamptz not null default now()
);

create index if not exists servicios_id_peluqueria_idx on public.servicios (id_peluqueria);

alter table public.servicios enable row level security;

-- Cada turno guarda que servicio se eligio. nombre_servicio es una copia del
-- nombre al momento de reservar (igual que precio), para que el historial no
-- cambie si despues el barbero renombra o borra el servicio.
alter table public.turnos
  add column if not exists id_servicio uuid references public.servicios(id) on delete set null,
  add column if not exists nombre_servicio text;

-- Cada peluqueria existente arranca con un servicio "Corte" con su precio actual,
-- para que las reservas sigan funcionando. El resto lo carga el barbero desde el panel.
insert into public.servicios (id_peluqueria, nombre, precio, orden)
select p.id, 'Corte', p.precio_corte, 0
from public.peluquerias p
where not exists (select 1 from public.servicios s where s.id_peluqueria = p.id);
