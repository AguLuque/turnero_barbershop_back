-- Fase 1: al crearse un usuario nuevo en auth.users, ademas de nombre_completo y
-- telefono, ahora tambien guarda la foto de perfil, leyendola de
-- raw_user_meta_data ->> 'avatar_url' (Supabase Auth la entrega ahi cuando el
-- login es social, ej. Google). Resto de la funcion identico al original.

create or replace function public.manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  id_peluqueria_default uuid;
begin
  select id into id_peluqueria_default from public.peluquerias limit 1;

  insert into public.perfiles (id, id_peluqueria, nombre_completo, telefono, foto_url, rol)
  values (
    new.id,
    id_peluqueria_default,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'telefono',
    new.raw_user_meta_data ->> 'avatar_url',
    'cliente'
  );

  return new;
end;
$$;
