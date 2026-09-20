-- ==============================================================================
-- MIGRACIÓN: 20260913000001_task_times_and_resources.sql
-- DESCRIPCIÓN: Añadir campos de horario (hora inicio y fin), participantes
-- y lista de materiales a la tabla de tareas académicas.
-- ==============================================================================

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS participants TEXT[] DEFAULT '{}'::TEXT[],
ADD COLUMN IF NOT EXISTS materials TEXT[] DEFAULT '{}'::TEXT[];

COMMENT ON COLUMN public.tasks.start_time IS 'Hora de inicio de la actividad académica (HH:MM:SS)';
COMMENT ON COLUMN public.tasks.end_time IS 'Hora de finalización estimada o límite de la actividad académica (HH:MM:SS)';
COMMENT ON COLUMN public.tasks.participants IS 'Listado de participantes, docentes, grupos o personas convocadas a la actividad';
COMMENT ON COLUMN public.tasks.materials IS 'Listado de materiales, recursos o equipos necesarios para ejecutar la actividad';
