-- =====================================================================================
-- MIGRACIÓN: SISTEMA ADMINISTRATIVO Y SUPERADMIN DE AGENDA PRO
-- Fecha: 2026-09-09
-- Descripción: Tablas para roles (super_admin, admin, support, user), plantillas de correo,
--              configuración global, logs de auditoría y registros de email del sistema.
-- =====================================================================================

-- 1. TABLA: public.user_roles (Roles y Estados de Usuarios)
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'support', 'user')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    banned_until TIMESTAMPTZ DEFAULT NULL,
    last_active_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

-- 2. TABLA: public.email_templates (Plantillas Oficiales de Correo)
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    subject VARCHAR(255) NOT NULL,
    header_title VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    button_text VARCHAR(100),
    button_url VARCHAR(255),
    footer_text TEXT,
    available_variables JSONB NOT NULL DEFAULT '[]'::JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

-- 3. TABLA: public.app_settings (Configuración Global del SaaS)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'global_config',
    app_name VARCHAR(100) NOT NULL DEFAULT 'AgendaPro Académico',
    app_logo_url TEXT DEFAULT '',
    app_favicon_url TEXT DEFAULT '',
    app_description TEXT DEFAULT 'Plataforma SaaS de productividad profesional y gestión de agenda académica',
    global_banner_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    global_banner_text TEXT DEFAULT 'Bienvenido al nuevo ciclo académico en AgendaPro.',
    global_banner_type VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (global_banner_type IN ('info', 'warning', 'error', 'success')),
    theme_palette VARCHAR(50) NOT NULL DEFAULT 'light',
    allow_signups BOOLEAN NOT NULL DEFAULT TRUE,
    allow_google_oauth BOOLEAN NOT NULL DEFAULT TRUE,
    allowed_email_domains TEXT[] DEFAULT '{}'::TEXT[],
    smtp_host VARCHAR(150) DEFAULT 'smtp.gmail.com',
    smtp_port INTEGER DEFAULT 587,
    smtp_secure BOOLEAN DEFAULT FALSE,
    smtp_user VARCHAR(150) DEFAULT '',
    smtp_pass VARCHAR(255) DEFAULT '',
    smtp_from_name VARCHAR(100) DEFAULT 'AgendaPro Académico',
    smtp_from_email VARCHAR(150) DEFAULT '',
    daily_email_limit INTEGER DEFAULT 500,
    email_retry_attempts INTEGER DEFAULT 3,
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME WITHOUT TIME ZONE DEFAULT '22:00',
    quiet_hours_end TIME WITHOUT TIME ZONE DEFAULT '07:00',
    timezone VARCHAR(50) DEFAULT 'America/Guatemala',
    default_language VARCHAR(10) DEFAULT 'es',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

-- 4. TABLA: public.audit_logs (Registro de Auditoría de Acciones Administrativas)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email VARCHAR(255) NOT NULL,
    actor_name VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    user_agent TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'warning')),
    details JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

-- 5. TABLA: public.system_email_logs (Centro de Correo y Estados de Despacho)
CREATE TABLE IF NOT EXISTS public.system_email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    template_slug VARCHAR(50) REFERENCES public.email_templates(slug) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'delivered', 'failed')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    sent_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

-- 6. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_status ON public.user_roles(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_email_logs_status ON public.system_email_logs(status);
CREATE INDEX IF NOT EXISTS idx_system_email_logs_created_at ON public.system_email_logs(created_at DESC);

-- 7. SEED INICIAL: CONFIGURACIÓN GLOBAL POR DEFECTO
INSERT INTO public.app_settings (id, app_name)
VALUES ('global_config', 'AgendaPro Académico')
ON CONFLICT (id) DO NOTHING;

-- 8. SEED INICIAL: LAS 9 PLANTILLAS OFICIALES DE CORREO
INSERT INTO public.email_templates (slug, name, description, subject, header_title, body_html, button_text, button_url, footer_text, available_variables)
VALUES
(
    'recordatorio_tarea',
    'Recordatorio de Tarea Próxima',
    'Notificación anticipada de actividades académicas por vencer.',
    '⏰ Recordatorio: {{title}} vence pronto',
    '¡Hola {{name}}! Tienes una tarea por vencer',
    '<p>Te recordamos que la actividad académica <strong>{{title}}</strong> programada para el <strong>{{due_date}}</strong> a las <strong>{{due_time}}</strong> está próxima a cumplirse.</p><p><strong>Cuadrante de Prioridad:</strong> {{priority}}</p>',
    'Ver y Gestionar Tarea',
    '{{action_url}}',
    'AgendaPro Académico • Notificación automatizada de seguimiento',
    '["name", "title", "due_date", "due_time", "priority", "action_url", "app_name"]'::JSONB
),
(
    'tarea_vencida',
    'Alerta de Tarea Vencida',
    'Aviso urgente cuando una tarea sobrepasa su fecha límite sin completarse.',
    '🚨 Tarea Vencida: {{title}}',
    'Atención: Actividad pendiente no completada',
    '<p>La actividad docente <strong>{{title}}</strong> alcanzó su fecha límite el <strong>{{due_date}}</strong> y aún no figura como completada.</p><p>Por favor revisa el avance de la tarea o actualiza su estado si ya fue entregada.</p>',
    'Actualizar Estado de Tarea',
    '{{action_url}}',
    'AgendaPro Académico • Control y seguimiento de plazos',
    '["name", "title", "due_date", "priority", "action_url", "app_name"]'::JSONB
),
(
    'bienvenida',
    'Bienvenida a la Plataforma',
    'Correo de bienvenida para nuevos docentes y coordinadores registrados.',
    '🎉 ¡Te damos la bienvenida a AgendaPro, {{name}}!',
    '¡Tu nuevo centro de productividad académica!',
    '<p>Nos entusiasma tenerte en AgendaPro. Nuestra plataforma está optimizada para que organices tus actividades escolares, gestiones con la Matriz de Eisenhower y automatices tus recordatorios para nunca olvidar un compromiso.</p>',
    'Comenzar a Planificar',
    '{{action_url}}',
    'Equipo de AgendaPro • Transformando la gestión docente',
    '["name", "action_url", "app_name"]'::JSONB
),
(
    'verificacion_email',
    'Verificación de Correo Electrónico',
    'Validación de la dirección de correo para la activación de la cuenta.',
    '✉️ Confirma tu dirección de correo electrónico',
    'Verifica tu cuenta en AgendaPro',
    '<p>Para garantizar la seguridad de tu cuenta institucional y recibir los avisos de tus tareas sin interrupciones, haz clic en el siguiente enlace para verificar tu correo.</p>',
    'Confirmar mi Correo',
    '{{action_url}}',
    'Si no solicitaste esta cuenta, puedes descartar este mensaje de forma segura.',
    '["name", "action_url", "app_name"]'::JSONB
),
(
    'recuperacion_password',
    'Restablecimiento de Contraseña',
    'Enlace seguro para recuperar el acceso a la cuenta.',
    '🔐 Restablece tu contraseña de AgendaPro',
    '¿Olvidaste tu contraseña?',
    '<p>Hemos recibido una solicitud para cambiar la contraseña de tu cuenta asociada a <strong>{{name}}</strong>. Haz clic en el botón para ingresar una nueva contraseña segura.</p>',
    'Restablecer Contraseña',
    '{{action_url}}',
    'Este enlace expirará en 60 minutos por motivos de seguridad.',
    '["name", "action_url", "app_name"]'::JSONB
),
(
    'resumen_diario',
    'Resumen Matutino Diario',
    'Despacho diario con las prioridades académicas de la jornada.',
    '☀️ Tus prioridades académicas de hoy, {{name}}',
    'Resumen Matutino de Actividades',
    '<p>¡Buenos días, {{name}}! Para hoy tienes <strong>{{tasks_today_count}}</strong> actividades programadas, incluyendo <strong>{{urgent_tasks_count}}</strong> tareas urgentes en el Cuadrante 1.</p>',
    'Ver mi Agenda de Hoy',
    '{{action_url}}',
    'AgendaPro Diario • Despachado a las 07:00 AM',
    '["name", "tasks_today_count", "urgent_tasks_count", "action_url", "app_name"]'::JSONB
),
(
    'resumen_semanal',
    'Planificación Semanal',
    'Panorama de actividades académicas para toda la semana.',
    '📅 Planificación Semanal: {{week_range}}',
    'Resumen Semanal de Actividades',
    '<p>Aquí tienes el panorama de tu semana académica. Tienes un total de <strong>{{total_week_tasks}}</strong> compromisos agendados. Te recomendamos revisar tus entregas de actas y coordinaciones docentes.</p>',
    'Abrir Calendario Semanal',
    '{{action_url}}',
    'AgendaPro Académico • Planificación estratégica docente',
    '["name", "week_range", "total_week_tasks", "action_url", "app_name"]'::JSONB
),
(
    'nuevo_dispositivo',
    'Nuevo Dispositivo Detectado',
    'Alerta de inicio de sesión desde un nuevo navegador o IP.',
    '🛡️ Inicio de sesión desde un nuevo dispositivo',
    'Alerta de Seguridad en tu Cuenta',
    '<p>Hemos detectado un inicio de sesión en tu cuenta de AgendaPro desde un dispositivo no reconocido previamente.</p><p><strong>IP:</strong> {{ip_address}}<br/><strong>Fecha y Hora:</strong> {{login_time}}<br/><strong>Navegador / Sistema:</strong> {{user_agent}}</p>',
    'Revisar Sesiones Activas',
    '{{action_url}}',
    'Si fuiste tú, no es necesario realizar ninguna acción.',
    '["name", "ip_address", "login_time", "user_agent", "action_url", "app_name"]'::JSONB
),
(
    'seguridad',
    'Aviso General de Seguridad',
    'Notificaciones sobre cambios críticos en la cuenta o políticas.',
    '⚠️ Aviso Importante de Seguridad en tu Cuenta',
    'Actualización de Seguridad',
    '<p>Se ha realizado un cambio sensible en tu cuenta de AgendaPro (cambio de correo, restablecimiento de contraseña o cierre forzado de sesiones).</p><p>Si no autorizaste este cambio, por favor contacta a soporte de inmediato.</p>',
    'Ir al Centro de Seguridad',
    '{{action_url}}',
    'AgendaPro Académico • Centro de Confianza y Seguridad',
    '["name", "action_details", "action_url", "app_name"]'::JSONB
)
ON CONFLICT (slug) DO NOTHING;

-- 9. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_email_logs ENABLE ROW LEVEL SECURITY;

-- 10. POLÍTICAS RLS BÁSICAS
DROP POLICY IF EXISTS "app_settings_select_policy" ON public.app_settings;
CREATE POLICY "app_settings_select_policy" ON public.app_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "email_templates_select_policy" ON public.email_templates;
CREATE POLICY "email_templates_select_policy" ON public.email_templates
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "user_roles_self_select_policy" ON public.user_roles;
CREATE POLICY "user_roles_self_select_policy" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);
