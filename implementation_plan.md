# Plan de Implementación Integral: Personalización Total, Taller de Emails, Nuevos Campos y Mejoras UX

Este plan aborda de manera completa y rigurosa todos los requerimientos y correcciones solicitados para **AgendaPro**.

---

## 1. Widget de Temporizador y Picture-in-Picture (PiP)
- **Problema:** Al marcar una tarea como completada desde el widget de temporizador, la ventanita PiP queda en negro y no se cierra de forma automática.
- **Causa Raíz:** En `FloatingFocusTimer.tsx`, al completarse la tarea o desmontarse el widget (`!activeTask || !isWidgetVisible`), el portal dentro de la ventana PiP se desvincula de React pero `closePip()` no es llamado automáticamente, dejando la ventana huérfana y en color negro.
- **Solución:**
  - En `FloatingFocusTimer.tsx` y `usePictureInPicture.ts`, asegurar que al llamar a `completeCurrentTask` o al cerrarse el widget, se invoque inmediatamente `closePip()` y se limpie la referencia de la ventana flotante.
  - Añadir feedback visual de éxito ("¡Tarea completada! 🎉") antes de desvanecer y cerrar limpiamente.

---

## 2. Taller de Diseño de Plantillas de Correo (Email Template Studio)
- **Objetivo:** Transformar la gestión de plantillas en un verdadero taller de diseño donde el usuario pueda personalizar sus correos con figuras geométricas, gradientes, paletas de colores, estilos de botones y previsualización en vivo.
- **Características:**
  - **Selector de Formas Geométricas & Decoraciones:** Cabeceras con formas geométricas abstractas, curvas de acento, cuadrícula tech, badges encapsulados.
  - **Personalizador de Colores:** Header gradients (Índigo-Cian, Esmeralda-Verde, Atardecer Cálido, Elegante Oscuro, Personalizado con Color Picker), colores de fondo, color de tarjetas y textos.
  - **Estilos de Botón CTA:** Selector de radio de borde (redondeado, píldora, cuadrado), colores y sombras.
  - **Variables Dinámicas con 1 Clic:** Inserción rápida de `{{name}}`, `{{title}}`, `{{due_date}}`, `{{start_time}}`, `{{end_time}}`, `{{participants}}`, `{{materials}}`, `{{priority}}`, `{{action_url}}`, etc.
  - **Live Preview Interactivo:** Switch entre vista de escritorio y marco de smartphone móvil en tiempo real.
  - **Envío de Prueba Inmediato:** Despacho instantáneo al correo del usuario con el nuevo diseño aplicado.

---

## 3. Personalización Total de Interfaz (Modo Básico vs Avanzado & Toggles UI)
- **Objetivo:** Dar control total al docente/coordinador para ocultar o mostrar cualquier sección de la aplicación.
- **Componentes y Hooks:**
  - Crear `frontend/src/context/UiPreferencesContext.tsx` y `useUiPreferences.ts` con persistencia en `localStorage`.
  - Opciones configurables:
    - `mode`: `'basico' | 'avanzado' | 'personalizado'`
    - `showDashboardWelcome`: Banner de bienvenida
    - `showDashboardKpis`: KPIs numéricos del dashboard
    - `showDashboardPriorityDistribution`: Balance de prioridades de Eisenhower
    - `showDashboardUpcoming`: Próximos vencimientos
    - `showDashboardQuickModules`: Módulos del sistema (accesos rápidos)
    - `showTasksKpis`: KPIs en la vista de tareas
    - `showTasksQuickNav`: Accesos directos entre tabla, calendario y matriz
    - `showCalendarKpis` & `showCalendarQuickNav`: KPIs y accesos en el calendario
    - `showMatrixKpis` & `showMatrixQuickNav`: KPIs y accesos en la matriz
    - `showNewTaskTemplates`: Banner/botón de usar plantillas en formulario
    - `showNewTaskAI`: Botón de desglose con IA en formulario
    - `autoArchiveCompleted`: Archivar o separar tareas completadas para mantener la vista limpia
    - `enableTour`: Mostrar u ocultar el tour interactivo en toda la app
  - **Modo Básico:** Activa con 1 solo clic una interfaz minimalista y limpia con solo lo esencial.
  - **Modo Avanzado:** Habilita todos los módulos y herramientas ejecutivas.
  - Nueva sección visual de configuración en `ConfigPage.tsx` con interruptores claros y explicativos.

---

## 4. Corrección Definitiva a la Impresión de PDF en Reporte Ejecutivo
- **Problema:** Al presionar "Imprimir / PDF" en el Reporte Ejecutivo, la pantalla se borra y queda en blanco sin imprimir el reporte.
- **Causa Raíz:** El `@media print` en `ExecutiveReportModal.tsx` usa `body * { visibility: hidden !important; }` sobre un modal de PrimeReact renderizado en un portal con `max-h-[70vh] overflow-y-auto`. El recorte y el `overflow` destruyen la impresión.
- **Solución:**
  - Implementar un generador de impresión limpio en ventana dedicada o iframe aislado (`printWindow.document.write(...)`) con CSS puro inline de alta calidad, membrete oficial, tipografía Inter, tablas formateadas, salto de página correcto y footer con firmas institucionales.
  - Nunca altera ni oculta la pantalla principal y genera un PDF multipágina perfecto.

---

## 5. Nuevos Campos en Tareas: Hora Inicio, Hora Fin, Participantes y Materiales
- **Base de Datos & Schemas:**
  - Migración SQL `20260913000001_task_times_and_resources.sql`:
    ```sql
    ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS start_time TIME,
    ADD COLUMN IF NOT EXISTS end_time TIME,
    ADD COLUMN IF NOT EXISTS participants TEXT[] DEFAULT '{}'::TEXT[],
    ADD COLUMN IF NOT EXISTS materials TEXT[] DEFAULT '{}'::TEXT[];
    ```
  - Actualizar `database.types.ts` y `task.schemas.ts` (Zod).
- **Formularios & Modales:**
  - `TaskFormModal.tsx`: Inputs para Hora de inicio, Hora fin (opcional), Participantes (chips/etiquetas) y Materiales a utilizar.
  - `TaskDetailModal.tsx`: Visualización elegante de horarios, lista de participantes con avatar/ícono y materiales requeridos con badges.
- **Integración con Correos:**
  - `email.adapter.ts` y `emailTransport.ts`: Inclusión automática en el HTML y texto plano de horarios (ej. `14:00 - 15:30`), participantes convocados y materiales requeridos.

---

## 6. Mejora de Redacción y Gramática en Correos y Notificaciones
- **Problema:** Mensajes automáticos mal redactados como *"tienes 1 actividades pendientes; o tienes 0 actividades pendientes incluyendo 1 actividad vencida..."*.
- **Solución:**
  - Implementar formateador dinámico de texto en `notification.dispatcher.ts` y `admin.service.ts`:
    - Si 0 tareas: `"¡Excelente noticia! No tienes actividades pendientes programadas para hoy. Tu agenda está al día."`
    - Si 1 tarea: `"Para hoy tienes 1 actividad programada..."`
    - Si > 1: `"Para hoy tienes N actividades programadas..."`
    - Tareas vencidas: Tratadas en sección de alerta independiente únicamente cuando existan (`> 0`), nunca combinadas de forma contradictoria.

---

## 7. PWA, Título Limpio ("AgendaPro") y Registro Móvil
- **Problema:** En PC el nombre aparece duplicado/triplicado en la barra superior (`AgendaPro Gestión Docente Inteligente - Produtividad y Gestión Docente`) y en móvil hay dificultades de instalación.
- **Solución:**
  - `index.html`: Cambiar estrictamente `<title>AgendaPro</title>`.
  - `manifest.webmanifest`: `"name": "AgendaPro"`, `"short_name": "AgendaPro"`, `"id": "/"`.
  - `sw.js`: Corregir clonación de respuesta en revalidación de caché.
  - `usePWAInstall.ts`: Modal o guía amigable de instalación para iOS (Safari Compartir > Agregar a Inicio) y Android.

---

## 8. Modal de Concentración y Formulario de Tarea
- **Formulario de Tarea:** Permite ocultar las opciones de plantillas y desglose con IA según preferencias o switch rápido.
- **Modal de Concentración ("¿Qué hago ahora?"):**
  - Selector de bloques de tiempo predefinidos (15, 25, 45, 60 min).
  - Visualización limpia de materiales y participantes.
  - Sincronización impecable con el temporizador flotante sin duplicar ni bloquear estados.

---

## 9. Tour Interactivo Condicional y Desactivable
- **Problema:** Descripciones demasiado largas y técnicas que fallan o muestran pasos irrelevantes si el elemento está oculto.
- **Solución:**
  - Textos pedagógicos, concisos y útiles para docentes.
  - **Condicionalidad en tiempo real:** Si un elemento no está visible en el DOM (porque el usuario lo ocultó en sus preferencias), el tour lo omite automáticamente y recalcula el progreso.
  - Interruptor en Configuración para activar/desactivar el tour completamente.

---

## 10. Plantillas de Tareas y Desglose IA Enriquecido
- **Desglose con IA (`taskBreakdownAI.ts`):**
  - Desglose contextual e inteligente (no más "Fase 1: Definir...", "Fase 2: Recopilar...").
  - Incluye automáticamente el listado de **Materiales sugeridos** (`suggestedMaterials`), que se inyectan en el nuevo campo de materiales del formulario.
- **Plantillas (`taskTemplates.ts` & `TaskTemplatesModal.tsx`):**
  - Diseño visual moderno con materiales recomendados, tiempos estimados y subtareas claras.

---

## Plan de Verificación
1. **Compilación Frontend:** `npm run build --prefix frontend` (0 errores de TypeScript y empaquetado de Vite limpio).
2. **Pruebas Backend:** `npm test --prefix backend` (23/23 tests pasando).
3. **Validación del Widget:** Iniciar temporizador, marcar tarea como completada -> verificar que la ventana PiP se cierra automáticamente sin quedar en negro.
4. **Validación de Impresión PDF:** Abrir Reporte Ejecutivo -> Imprimir / PDF -> verificar que se genera el documento imprimible completo sin borrar la pantalla.
5. **Validación de Preferencias UI:** Cambiar entre Modo Básico y Avanzado -> verificar que los elementos se ocultan/muestran correctamente en Dashboard, Tareas, Matriz y Calendario.
6. **Validación de Taller de Emails:** Diseñar plantilla con figuras y colores -> enviar correo de prueba -> verificar renderizado fiel.
