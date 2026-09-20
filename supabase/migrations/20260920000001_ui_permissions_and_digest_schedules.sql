-- Migración: Permisos de UI para SuperAdmin, Configuración de Gmail API y Horarios de Resúmenes
-- Fecha: 2026-09-20

-- 1. Ampliar app_settings para control de proveedor de correo y permisos de UI
ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS email_provider VARCHAR(50) NOT NULL DEFAULT 'gmail_api',
ADD COLUMN IF NOT EXISTS gmail_client_id TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS gmail_client_secret TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS gmail_refresh_token TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS ui_feature_permissions JSONB NOT NULL DEFAULT '{
  "showDashboardWelcome": true,
  "showDashboardKpis": true,
  "showDashboardPriorityDistribution": true,
  "showDashboardUpcoming": true,
  "showDashboardQuickModules": true,
  "showTasksKpis": true,
  "showTasksQuickNav": true,
  "showTasksViewSelector": true,
  "showTasksExport": true,
  "showCalendarKpis": true,
  "showCalendarQuickNav": true,
  "showMatrixKpis": true,
  "showMatrixQuickNav": true,
  "showNewTaskTemplates": true,
  "showNewTaskAI": true,
  "showNewTaskResources": true,
  "showNewTaskParticipants": true,
  "showNewTaskMaterials": true,
  "viewModeKanban": true,
  "viewModeCalendario": true,
  "viewModeMatriz": true,
  "autoArchiveCompleted": true,
  "enableTour": true
}'::JSONB;

-- Asegurar que el proveedor por defecto en global_config sea gmail_api si no estaba definido
UPDATE public.app_settings
SET email_provider = 'gmail_api'
WHERE id = 'global_config' AND (email_provider IS NULL OR email_provider = '');

-- 2. Ampliar user_preferences para horarios personalizados de Daily y Weekly Digest
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS daily_digest_time VARCHAR(10) NOT NULL DEFAULT '07:00',
ADD COLUMN IF NOT EXISTS weekly_digest_day VARCHAR(15) NOT NULL DEFAULT 'monday',
ADD COLUMN IF NOT EXISTS weekly_digest_time VARCHAR(10) NOT NULL DEFAULT '08:00';

COMMENT ON COLUMN public.user_preferences.daily_digest_time IS 'Hora local del usuario para recibir el resumen diario (ej: 07:00)';
COMMENT ON COLUMN public.user_preferences.weekly_digest_day IS 'Día de la semana para el resumen semanal (monday, sunday, etc.)';
COMMENT ON COLUMN public.user_preferences.weekly_digest_time IS 'Hora local del usuario para recibir el resumen semanal (ej: 08:00)';
