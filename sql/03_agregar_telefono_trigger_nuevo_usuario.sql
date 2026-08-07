-- Fase 1: al crearse un usuario nuevo en auth.users, ademas de nombre_completo
-- ahora tambien guarda el telefono, leyendolo de raw_user_meta_data ->> 'telefono'
-- (el frontend lo manda en las opciones de metadata al registrarse).
-- Resto de la funcion identico al original.

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

  insert into public.perfiles (id, id_peluqueria, nombre_completo, telefono, rol)
  values (
    new.id,
    id_peluqueria_default,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'telefono',
    'cliente'
  );

  return new;
end;
$$;
