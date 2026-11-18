# Nexus Licitaciones

Alertas diarias por correo de procesos abiertos en SECOP II (Colombia).

- **Web:** Next.js 16 en Vercel (`licitaciones.nexuslottery.site`) — landing, login por enlace mágico, panel de filtros con vista previa, planes.
- **Datos:** Supabase (`licitaciones`) con RLS. Tablas: `perfiles`, `filtros`, `procesos`, `envios`, `estado_sistema`.
- **Motor:** Edge Functions en `supabase/functions`
  - `ingestar-secop`: trae procesos nuevos de datos.gov.co (dataset `p6dx-8zbt`) cada 2 h (pg_cron).
  - `enviar-resumen`: cruza filtros y envía el resumen por Resend a las 7:00 a.m. Colombia.
  - `configurar-resend`: utilidades para el dominio de envío.
- Las funciones validan el header `x-cron-secret` (guardado en `estado_sistema`, solo accesible con service role).
- El esquema SQL vive en las migraciones del proyecto Supabase (`supabase db pull` para traerlas).

## Variables (Vercel)
Ver `.env.example`. Secretos de Edge Functions: `RESEND_API_KEY`, opcional `EMAIL_FROM`, `APP_URL`.
