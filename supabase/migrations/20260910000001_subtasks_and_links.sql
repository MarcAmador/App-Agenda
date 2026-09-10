-- ==============================================================================
-- MIGRACIÓN: 20260910000001_subtasks_and_links.sql
-- DESCRIPCIÓN: Añadir soporte para Subtareas (Checklists) y Enlaces a Recursos
-- (Google Drive, Teams, Classroom, Meet, etc.) en la tabla de tareas académicas.
-- ==============================================================================

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::JSONB;

COMMENT ON COLUMN public.tasks.checklist IS 'Lista de subtareas en formato JSON: [{ id, text, completed }]';
COMMENT ON COLUMN public.tasks.links IS 'Lista de enlaces a recursos en formato JSON: [{ id, title, url, type }]';
