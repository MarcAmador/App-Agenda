-- ==============================================================================
-- Migración: 20260912000001_notification_toggles.sql
-- Descripción: Añade columnas booleanas para el control granular de notificaciones,
--              resúmenes matutinos, alertas de seguridad y modo No Molestar (DND).
-- ==============================================================================

ALTER TABLE public.user_preferences
    ADD COLUMN IF NOT EXISTS daily_digest_enabled BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS weekly_digest_enabled BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS login_alerts_enabled BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS task_reminders_enabled BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS dnd_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_preferences.daily_digest_enabled IS 'Indica si el usuario recibe el Daily Academic Digest de las 7:00 AM';
COMMENT ON COLUMN public.user_preferences.weekly_digest_enabled IS 'Indica si el usuario recibe el reporte de planificación semanal';
COMMENT ON COLUMN public.user_preferences.login_alerts_enabled IS 'Indica si se envían correos de advertencia ante inicios de sesión en nuevos dispositivos';
COMMENT ON COLUMN public.user_preferences.task_reminders_enabled IS 'Indica si se despachan recordatorios automáticos de tareas antes de su vencimiento';
COMMENT ON COLUMN public.user_preferences.dnd_enabled IS 'Modo No Molestar: silencia temporalmente todos los envíos salientes';
