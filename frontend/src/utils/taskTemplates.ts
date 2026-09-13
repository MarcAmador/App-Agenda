import type { TaskPriority, TaskScope } from '@/types/database.types'

export interface AcademicTaskTemplate {
  id: string
  title: string
  description: string
  category: string
  priority: TaskPriority
  scope_period: TaskScope
  tags: string[]
  subtasks: { id: string; text: string; completed: boolean }[]
  isCustom?: boolean
}

const DEFAULT_TEMPLATES: AcademicTaskTemplate[] = [
  {
    id: 'tpl_examen_parcial',
    title: 'Evaluación Bimestral / Examen Parcial',
    description: 'Planificación, elaboración, aplicación y calificación de la prueba sumativa del período escolar.',
    category: 'Examen',
    priority: 'urgente_importante',
    scope_period: 'bimestral',
    tags: ['Examen', 'Evaluación', 'Notas'],
    subtasks: [
      { id: '1', text: 'Elaborar temario, tabla de especificaciones y ponderación de contenidos', completed: false },
      { id: '2', text: 'Enviar borrador a Coordinación Académica para revisión y aprobación', completed: false },
      { id: '3', text: 'Diagramar, imprimir y foliar evaluaciones según nómina de estudiantes', completed: false },
      { id: '4', text: 'Aplicar examen en aula y registrar asistencia formal', completed: false },
      { id: '5', text: 'Calificar pruebas, retroalimentar a estudiantes y asentar notas en cuadro', completed: false },
    ],
  },
  {
    id: 'tpl_claustro_docente',
    title: 'Reunión de Claustro Docente / Sesión de Área',
    description: 'Participación en el claustro institucional, análisis de rendimiento estudiantil y alineación curricular.',
    category: 'Reunión',
    priority: 'importante_no_urgente',
    scope_period: 'mensual',
    tags: ['Claustro', 'Coordinación', 'Docencia'],
    subtasks: [
      { id: '1', text: 'Revisar agenda y acuerdos de la sesión anterior', completed: false },
      { id: '2', text: 'Preparar informe de rendimiento académico y casos de atención especial', completed: false },
      { id: '3', text: 'Asistir puntualmente y participar en los puntos de debate y toma de decisiones', completed: false },
      { id: '4', text: 'Firmar minuta de acuerdos y programar compromisos asignados', completed: false },
    ],
  },
  {
    id: 'tpl_cuadros_calificaciones',
    title: 'Cierre de Período y Entrega de Cuadros de Notas',
    description: 'Consolidación de zonas acumuladas, ingreso a plataforma académica institucional y entrega formal a secretaría.',
    category: 'Entrega de notas',
    priority: 'urgente_importante',
    scope_period: 'bimestral',
    tags: ['Secretaría', 'Notas', 'Boletas'],
    subtasks: [
      { id: '1', text: 'Totalizar notas de tareas, proyectos y exámenes en plantilla de control', completed: false },
      { id: '2', text: 'Cargar notas oficiales al sistema institucional en línea', completed: false },
      { id: '3', text: 'Cotejar promedios generales y emitir listado de reprobados / alertas', completed: false },
      { id: '4', text: 'Imprimir cuadro consolidado firmado y entregar a Secretaría Académica', completed: false },
    ],
  },
  {
    id: 'tpl_planificacion_curricular',
    title: 'Planificación de Unidad de Aprendizaje',
    description: 'Diseño curricular de competencias, contenidos, metodología y criterios de evaluación para la siguiente unidad.',
    category: 'Planificación',
    priority: 'importante_no_urgente',
    scope_period: 'mensual',
    tags: ['Currículo', 'Planificación', 'Didáctica'],
    subtasks: [
      { id: '1', text: 'Definir competencias, indicadores de logro y contenidos clave', completed: false },
      { id: '2', text: 'Seleccionar lecturas obligatorias, material audiovisual y guías de trabajo', completed: false },
      { id: '3', text: 'Diseñar rúbricas y criterios de evaluación formativa y sumativa', completed: false },
      { id: '4', text: 'Cargar plan de unidad a la plataforma institucional para revisión', completed: false },
    ],
  },
  {
    id: 'tpl_atencion_padres',
    title: 'Atención y Conferencia con Padres de Familia',
    description: 'Entrevista personalizada con padres o tutores para seguimiento académico y formativo del alumno.',
    category: 'Reunión',
    priority: 'importante_no_urgente',
    scope_period: 'semanal',
    tags: ['Padres', 'Tutoría', 'Orientación'],
    subtasks: [
      { id: '1', text: 'Emitir citación formal con fecha, hora y objetivo de la conferencia', completed: false },
      { id: '2', text: 'Recopilar historial de calificaciones, asistencias y conducta del estudiante', completed: false },
      { id: '3', text: 'Desarrollar la reunión, acordar plan de mejora y compromisos mutuos', completed: false },
      { id: '4', text: 'Firmar acta de compromisos y archivar copia en expediente', completed: false },
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
