-- Fase 2: agrega campos de informacion de contacto/perfil de la peluqueria.
-- Todas las columnas son nullable para no romper la fila ya existente.

alter table public.peluquerias
  add column if not exists direccion text,
  add column if not exists telefono_contacto text,
  add column if not exists instagram text,
  add column if not exists bio_peluquero text;

comment on column public.peluquerias.instagram is 'Solo el usuario/handle de Instagram, sin URL completa (ej: "labarberia", no "https://instagram.com/labarberia").';
