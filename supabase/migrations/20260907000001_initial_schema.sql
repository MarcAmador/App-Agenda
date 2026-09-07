-- =====================================================================================
-- MIGRACIÓN INICIAL: ESQUEMA DE BASE DE DATOS PARA AGENDA & GESTIÓN ACADÉMICA SAAS
-- Fecha: 2026-09-07
-- Descripción: Enums, tablas (tasks, user_preferences, reminder_logs), índices, triggers y RLS
-- =====================================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE public.task_status AS ENUM (
            'pendiente',
            'en_curso',
            'completada',
            'perdida',
            'anulada',
            'archivada'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
        CREATE TYPE public.task_priority AS ENUM (
            'urgente_importante',      -- Cuadrante 1: Hacer ya
            'importante_no_urgente',  -- Cuadrante 2: Planificar
            'urgente_no_importante',  -- Cuadrante 3: Delegar
            'no_urgente_baja'         -- Cuadrante 4: Eliminar / Baja prioridad
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_scope') THEN
        CREATE TYPE public.task_scope AS ENUM (
            'diario',
            'semanal',
            'mensual',
            'bimestral',
            'anual'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') THEN
        CREATE TYPE public.notification_channel AS ENUM (
            'email',
            'whatsapp',
            'telegram'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status') THEN
        CREATE TYPE public.notification_status AS ENUM (
            'pending',
            'sent',
            'failed'
        );
    END IF;
END $$;

-- 3. TABLA: public.tasks (Tareas y Actividades Académicas)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status public.task_status NOT NULL DEFAULT 'pendiente',
    priority public.task_priority NOT NULL DEFAULT 'importante_no_urgente',
    due_date DATE,
    due_time TIME WITHOUT TIME ZONE,
    location VARCHAR(255),
    scope_period public.task_scope NOT NULL DEFAULT 'semanal',
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}'::TEXT[],
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    shared_with UUID[] DEFAULT '{}'::UUID[],
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

-- 4. TABLA: public.user_preferences (Configuración y Perfil de Notificaciones)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_channels public.notification_channel[] NOT NULL DEFAULT '{email}'::public.notification_channel[],
    phone_number VARCHAR(30),
    telegram_chat_id VARCHAR(50),
    reminder_lead_time_minutes INTEGER NOT NULL DEFAULT 60,
    theme VARCHAR(20) NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

-- 5. TABLA: public.reminder_logs (Cola y Registro de Notificaciones)
CREATE TABLE IF NOT EXISTS public.reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel public.notification_channel NOT NULL,
    status public.notification_status NOT NULL DEFAULT 'pending',
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

-- 6. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_scope_period ON public.tasks(scope_period);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON public.tasks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_user_active ON public.tasks(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reminder_logs_queue ON public.reminder_logs(scheduled_for, status) WHERE status = 'pending';

-- 7. TRIGGERS Y FUNCIONES: updated_at AUTOMÁTICO
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::TEXT, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER trg_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 8. TRIGGER: CREACIÓN AUTOMÁTICA DE PREFERENCIAS AL REGISTRARSE UN USUARIO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 9. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

-- 10. POLÍTICAS RLS: public.tasks
DROP POLICY IF EXISTS "tasks_select_policy" ON public.tasks;
CREATE POLICY "tasks_select_policy" ON public.tasks
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR auth.uid() = ANY(shared_with)
    );

DROP POLICY IF EXISTS "tasks_insert_policy" ON public.tasks;
CREATE POLICY "tasks_insert_policy" ON public.tasks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks_update_policy" ON public.tasks;
CREATE POLICY "tasks_update_policy" ON public.tasks
    FOR UPDATE
    USING (
        auth.uid() = user_id 
        OR auth.uid() = ANY(shared_with)
    )
    WITH CHECK (
        auth.uid() = user_id 
        OR auth.uid() = ANY(shared_with)
    );

DROP POLICY IF EXISTS "tasks_delete_policy" ON public.tasks;
CREATE POLICY "tasks_delete_policy" ON public.tasks
    FOR DELETE
    USING (auth.uid() = user_id);

-- 11. POLÍTICAS RLS: public.user_preferences
DROP POLICY IF EXISTS "user_preferences_select_policy" ON public.user_preferences;
CREATE POLICY "user_preferences_select_policy" ON public.user_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_preferences_insert_policy" ON public.user_preferences;
CREATE POLICY "user_preferences_insert_policy" ON public.user_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_preferences_update_policy" ON public.user_preferences;
CREATE POLICY "user_preferences_update_policy" ON public.user_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_preferences_delete_policy" ON public.user_preferences;
CREATE POLICY "user_preferences_delete_policy" ON public.user_preferences
    FOR DELETE
    USING (auth.uid() = user_id);

-- 12. POLÍTICAS RLS: public.reminder_logs
DROP POLICY IF EXISTS "reminder_logs_select_policy" ON public.reminder_logs;
CREATE POLICY "reminder_logs_select_policy" ON public.reminder_logs
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reminder_logs_insert_policy" ON public.reminder_logs;
CREATE POLICY "reminder_logs_insert_policy" ON public.reminder_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reminder_logs_update_policy" ON public.reminder_logs;
CREATE POLICY "reminder_logs_update_policy" ON public.reminder_logs
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
