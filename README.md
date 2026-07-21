# Turnero Barbershop — Backend

API REST para la gestión de turnos de una barbería/peluquería: reserva y cancelación de turnos, disponibilidad horaria, turnos fijos (recurrentes), horarios de atención/bloqueos y perfiles de usuario (clientes, admins y superadmin).

Construida con **Express + TypeScript**, usando **Supabase** (Postgres + Auth) como backend de datos y autenticación.

## Stack técnico

- **Node.js** + **TypeScript** (`strict` mode)
- **Express 4** como framework HTTP
- **Supabase** (`@supabase/supabase-js`) para persistencia y autenticación (JWT)
- **tsx** para desarrollo con recarga automática
- **cors**, **dotenv** como utilidades base

## Arquitectura

El proyecto sigue una arquitectura en capas clásica:

```
Request → Routes → Middlewares (auth) → Controllers → Services (lógica de negocio) → Repositories (acceso a datos/Supabase)
```

```
src/
├── app.ts                     # Configuración de Express (cors, json, logging, error handler)
├── index.ts                   # Router raíz que monta todos los módulos bajo /api
├── server.ts                  # Punto de entrada, levanta el servidor HTTP
├── config/
│   ├── db.config.ts           # Cliente de Supabase
│   └── entorno.config.ts      # Carga y valida variables de entorno
├── controllers/                # Reciben el Request, validan input, llaman al service
├── service/                    # Lógica de negocio (reglas de turnos, disponibilidad, etc.)
├── repository/                 # Acceso a datos vía Supabase (queries)
├── routes/                     # Definición de rutas Express por módulo
├── middlewares/
│   ├── auth.middleware.ts      # requiereAutenticacion / requiereRol
│   ├── errores.middleware.ts   # Manejador central de errores
│   └── peticion.middleware.ts  # Logging de requests coloreado por status
├── utils/
│   ├── errorApi.ts             # Clase de error HTTP con helpers (404, 400, 401, 409)
│   ├── manejarAsync.ts         # Wrapper para no repetir try/catch en controllers
│   └── frecuenciaTurnoFijo.ts  # Cálculo de recurrencia de turnos fijos
└── types/
    └── dominio.types.ts        # Tipos del dominio (Turno, Perfil, Peluqueria, etc.)
```

### Decisiones de diseño relevantes

- **ETag desactivado y `Cache-Control: no-store` global** (`app.ts`): en una API con datos que cambian constantemente, el ETag automático de Express puede devolver un `304` sin body, rompiendo el parseo de la respuesta en el frontend.
- **`manejarAsync`**: todos los controllers son `async`; este wrapper evita tener que envolver cada handler en `try/catch` y reenvía cualquier error al middleware de errores.
- **`ErrorApi`**: errores de negocio se lanzan como instancias de esta clase con un código HTTP asociado (`solicitudInvalida` → 400, `noAutorizado` → 401, `noEncontrado` → 404, `conflicto` → 409). Cualquier otro error no controlado responde `500`.
- **Lógica de turnos fijos centralizada** (`utils/frecuenciaTurnoFijo.ts`): el cálculo de qué fechas corresponden a una regla de turno fijo (día de la semana + frecuencia en días) se comparte entre `disponibilidad.service.ts` (para marcar horarios ocupados) y `turnosfijos.service.ts` (para generar los turnos reales), evitando duplicar el mismo cálculo en dos lugares.

## Modelo de dominio

| Entidad | Descripción |
|---|---|
| `Peluqueria` | Local/barbería: nombre, duración de turno en minutos, precio de corte, dueño. |
| `Perfil` | Usuario de Supabase Auth con rol (`cliente`, `admin`, `superadmin`), asociado a una peluquería. |
| `HorarioAtencion` | Franja horaria de atención por día de la semana. |
| `HorarioBloqueado` | Bloqueo puntual de agenda (ej. feriado, día no laborable). |
| `Turno` | Reserva puntual: fecha, hora, cliente, estado (`confirmado`, `cancelado`, `completado`, `falto`). |
| `TurnoFijo` | Regla de turno recurrente (día de la semana + frecuencia en días) que genera `Turno`s reales. |

## Autenticación y autorización

- La autenticación se hace vía **Bearer token** (JWT de Supabase Auth) en el header `Authorization`.
- El middleware `requiereAutenticacion` valida el token contra Supabase, busca el `Perfil` asociado y lo adjunta a `req.perfil`.
- El middleware `requiereRol(...roles)` restringe el acceso según el rol del perfil autenticado (`cliente`, `admin`, `superadmin`).
- Las rutas de `/turnos-fijos` y `/horarios` requieren rol `admin` o `superadmin` en todos sus endpoints.

## Endpoints

Todas las rutas están montadas bajo el prefijo **`/api`**.

### Turnos — `/api/turnos`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/` | Requerida | Reserva un turno. Si lo crea un admin/superadmin, no queda asociado a un cliente registrado. |
| GET | `/mis-turnos` | Requerida | Lista los turnos del cliente autenticado. |
| GET | `/admin?fecha=` | Admin/Superadmin | Lista los turnos de la peluquería para una fecha dada. |
| PATCH | `/:idTurno/cancelar` | Requerida | Cancela un turno (propio, o cualquiera si es admin). |
| PATCH | `/:idTurno/falto` | Admin/Superadmin | Marca un turno como "falto" (no asistió). |
| GET | `/admin/historial?idCliente=&nombreCliente=&telefonoCliente=` | Admin/Superadmin | Historial de turnos filtrado por cliente. |

### Disponibilidad — `/api/disponibilidad`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/?idPeluqueria=&fecha=` | Pública | Calcula los slots horarios disponibles/ocupados de un día, considerando horarios de atención, bloqueos, turnos existentes y turnos fijos. |

### Turnos fijos — `/api/turnos-fijos`

Todas requieren rol `admin` o `superadmin`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/` | Crea una regla de turno fijo (día de la semana, hora, frecuencia en días). |
| GET | `/?idPeluqueria=` | Lista los turnos fijos de una peluquería. |
| PATCH | `/:idTurnoFijo/baja` | Da de baja (desactiva) un turno fijo. |
| POST | `/generar-proximos` | Materializa los próximos `Turno`s reales a partir de las reglas activas. |

### Horarios — `/api/horarios`

Todas requieren rol `admin` o `superadmin`.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/dia?idPeluqueria=&diaSemana=` | Lista las franjas de atención de un día de la semana. |
| POST | `/dia` | Agrega una franja horaria de atención. |
| DELETE | `/dia/:idFranja` | Elimina una franja horaria. |
| POST | `/bloqueo` | Crea un bloqueo de agenda (cancela los turnos afectados). |
| GET | `/bloqueo?idPeluqueria=` | Lista los bloqueos de una peluquería. |
| DELETE | `/bloqueo/:idBloqueo` | Elimina un bloqueo. |

### Perfiles — `/api/perfiles`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/mi-perfil` | Requerida | Obtiene el perfil del usuario autenticado. |
| PATCH | `/mi-perfil` | Requerida | Actualiza nombre, teléfono o foto del perfil propio. |
| GET | `/clientes?idPeluqueria=` | Admin/Superadmin | Lista clientes (registrados y de turno fijo sin cuenta) con ranking de turnos. |

## Manejo de errores

Todas las respuestas de error siguen el formato:

```json
{ "error": "mensaje descriptivo" }
```

con el código HTTP correspondiente (`400`, `401`, `404`, `409` o `500` para errores no controlados).

## Variables de entorno

Copiar `.env.example` a `.env` y completar:

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default `3000`). |
| `SUPABASE_URL` | URL del proyecto de Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key de Supabase (acceso privilegiado, solo backend). |
| `FRONTEND_URL` | Origen permitido para CORS. |
| `RESEND_API_KEY` | API key de [Resend](https://resend.com) para envío de emails (opcional). |

## Puesta en marcha

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Desarrollo (con recarga automática)
npm run dev

# Build de producción
npm run build

# Ejecutar build compilado
npm start
```

El servidor queda disponible en `http://localhost:<PORT>/api`.