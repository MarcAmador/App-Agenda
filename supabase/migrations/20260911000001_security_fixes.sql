-- Migración correctiva de seguridad y rendimiento
-- 1. Revocar acceso público a app_settings y restringir a admin y service_role
DROP POLICY IF EXISTS "app_settings_select_policy" ON public.app_settings;

CREATE POLICY "app_settings_admin_select_policy" ON public.app_settings
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('super_admin', 'admin')
            AND user_roles.status = 'active'
        )
    );

CREATE POLICY "app_settings_admin_modify_policy" ON public.app_settings
    FOR ALL USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('super_admin', 'admin')
            AND user_roles.status = 'active'
        )
    );

-- 2. Asegurar que public.tasks esté en la publicación de supabase_realtime para reactividad
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'tasks'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- 3. RPC para conteo eficiente de tareas por usuario (evita descargar todas las tareas en memoria)
CREATE OR REPLACE FUNCTION get_user_tasks_counts()
RETURNS TABLE(user_id uuid, tasks_count bigint) AS $$
    SELECT user_id, COUNT(*) as tasks_count 
    FROM public.tasks 
    WHERE deleted_at IS NULL 
    GROUP BY user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
