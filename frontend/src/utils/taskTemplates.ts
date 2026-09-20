import type { TaskPriority, TaskScope } from '@/types/database.types'

export interface AcademicTaskTemplate {
  id: string
  title: string
  description: string
  category: string
  priority: TaskPriority
  scope_period: TaskScope
  tags: string[]
  materials?: string[]
  participants?: string[]
  subtasks: { id: string; text: string; completed: boolean }[]
  isCustom?: boolean
}

const DEFAULT_TEMPLATES: AcademicTaskTemplate[] = [
  {
    id: 'tpl_examen_parcial',
    title: 'Evaluación Bimestral / Examen Parcial',
    description: 'Elaboración, revisión por coordinación, aplicación y calificación de la prueba del período escolar.',
    category: 'Examen',
    priority: 'urgente_importante',
    scope_period: 'bimestral',
    tags: ['Examen', 'Evaluación', 'Notas'],
    materials: ['Hojas de examen impresas', 'Listado de asistencia', 'Clave de respuestas', 'Lapicero rojo'],
    participants: ['Estudiantes del grado', 'Coordinación Académica'],
    subtasks: [
      { id: '1', text: 'Elaborar temario y reactivos de evaluación', completed: false },
      { id: '2', text: 'Enviar borrador a Coordinación para aprobación', completed: false },
      { id: '3', text: 'Imprimir y foliar exámenes según nómina', completed: false },
      { id: '4', text: 'Aplicar prueba en el aula y registrar asistencia', completed: false },
      { id: '5', text: 'Calificar pruebas y asentar notas en sistema', completed: false },
    ],
  },
  {
    id: 'tpl_claustro_docente',
    title: 'Reunión de Claustro Docente / Sesión de Área',
    description: 'Participación en el claustro institucional, análisis de rendimiento y alineación de acuerdos.',
    category: 'Reunión',
    priority: 'importante_no_urgente',
    scope_period: 'mensual',
    tags: ['Claustro', 'Coordinación', 'Docencia'],
    materials: ['Agenda del claustro', 'Libro de actas', 'Reporte de casos prioritarios'],
    participants: ['Cuerpo Docente', 'Dirección', 'Coordinación'],
    subtasks: [
      { id: '1', text: 'Revisar agenda y compromisos anteriores', completed: false },
      { id: '2', text: 'Preparar informe de rendimiento del grupo', completed: false },
      { id: '3', text: 'Participar en la sesión y registrar acuerdos', completed: false },
      { id: '4', text: 'Firmar minuta y programar seguimientos', completed: false },
    ],
  },
  {
    id: 'tpl_cuadros_calificaciones',
    title: 'Cierre de Período y Entrega de Cuadros de Notas',
    description: 'Consolidación de zonas acumuladas, ingreso a plataforma y entrega a secretaría.',
    category: 'Entrega de notas',
    priority: 'urgente_importante',
    scope_period: 'bimestral',
    tags: ['Secretaría', 'Notas', 'Boletas'],
    materials: ['Planilla de zonas acumuladas', 'Cuadro consolidado para firma', 'Listado de reprobados'],
    participants: ['Docente Titular', 'Secretaría Académica'],
    subtasks: [
      { id: '1', text: 'Totalizar notas de tareas, proyectos y examen', completed: false },
      { id: '2', text: 'Ingresar calificaciones a la plataforma en línea', completed: false },
      { id: '3', text: 'Generar reporte de estudiantes en riesgo', completed: false },
      { id: '4', text: 'Imprimir cuadro consolidado firmado y entregar a Secretaría', completed: false },
    ],
  },
  {
    id: 'tpl_planificacion_curricular',
    title: 'Planificación de Unidad Didáctica',
    description: 'Diseño de competencias, metodología, recursos y criterios de evaluación de la unidad.',
    category: 'Planificación',
    priority: 'importante_no_urgente',
    scope_period: 'mensual',
    tags: ['Currículo', 'Planificación', 'Didáctica'],
    materials: ['CNB / Plan de estudios', 'Guías y libros de texto', 'Plantilla digital de planificación'],
    participants: ['Docente de área', 'Coordinador Pedagógico'],
    subtasks: [
      { id: '1', text: 'Definir competencias e indicadores de logro', completed: false },
      { id: '2', text: 'Diseñar actividades de inicio, desarrollo y cierre', completed: false },
      { id: '3', text: 'Seleccionar lecturas y recursos multimedia', completed: false },
      { id: '4', text: 'Cargar planificación al sistema para validación', completed: false },
    ],
  },
  {
    id: 'tpl_atencion_padres',
    title: 'Atención y Conferencia con Padres de Familia',
    description: 'Entrevista personalizada con tutores para dar seguimiento académico y conductual.',
    category: 'Reunión',
    priority: 'importante_no_urgente',
    scope_period: 'semanal',
    tags: ['Padres', 'Tutoría', 'Orientación'],
    materials: ['Expediente del estudiante', 'Boleta de calificaciones parciales', 'Formato de acta de compromiso'],
    participants: ['Padres / Tutores', 'Estudiante', 'Docente Guía'],
    subtasks: [
      { id: '1', text: 'Emitir citación formal con fecha y hora', completed: false },
      { id: '2', text: 'Recopilar notas, asistencias y reportes del alumno', completed: false },
      { id: '3', text: 'Realizar la reunión y definir plan de mejora', completed: false },
      { id: '4', text: 'Firmar acta de compromisos y archivar', completed: false },
    ],
  },
]

const STORAGE_KEY = 'agendapro_custom_templates'

export function getDefaultTemplates(): AcademicTaskTemplate[] {
  return DEFAULT_TEMPLATES
}

export function getCustomTemplates(): AcademicTaskTemplate[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function getAllTemplates(): AcademicTaskTemplate[] {
  return [...getDefaultTemplates(), ...getCustomTemplates()]
}

export function saveCustomTemplate(template: Omit<AcademicTaskTemplate, 'id' | 'isCustom'>): AcademicTaskTemplate {
  const customTemplates = getCustomTemplates()
  const newTemplate: AcademicTaskTemplate = {
    ...template,
    id: `tpl_custom_${Date.now()}`,
    isCustom: true,
  }

  const updated = [newTemplate, ...customTemplates]
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }
  return newTemplate
}

export function deleteCustomTemplate(id: string): void {
  const customTemplates = getCustomTemplates()
  const updated = customTemplates.filter((t) => t.id !== id)
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }
}
