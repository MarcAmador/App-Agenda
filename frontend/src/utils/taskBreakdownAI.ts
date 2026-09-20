/**
 * Motor de Desglose Pedagógico Inteligente con IA para Actividades Docentes.
 * Analiza el título, descripción y contexto curricular para descomponer tareas
 * en secuencias de subtareas breves, accionables y con lista de materiales requeridos.
 */

export interface TaskBreakdownResult {
  subtasks: string[]
  suggestedTags: string[]
  suggestedCategory?: string
  suggestedMaterials: string[]
  estimatedTotalMinutes: number
}

interface BreakdownTemplate {
  keywords: RegExp
  category: string
  tags: string[]
  materials: string[]
  estimatedMinutes: number
  subtasks: (title: string) => string[]
}

const DOMAIN_BREAKDOWNS: BreakdownTemplate[] = [
  // 1. Evaluaciones y Exámenes
  {
    keywords: /(examen|evaluaci[oó]n|prueba|parcial|test|quiz|bimestral|trimestral|recuperaci[oó]n)/i,
    category: 'Examen',
    tags: ['Examen', 'Evaluación', 'Notas'],
    materials: [
      'Hojas impresas de la prueba',
      'Listado de asistencia y control',
      'Rúbrica y clave de respuestas',
      'Lapiceros para revisión',
    ],
    estimatedMinutes: 60,
    subtasks: (title) => [
      `Diseñar temario y reactivos de ${title}`,
      'Enviar borrador a Coordinación para aprobación',
      'Imprimir y foliar copias según número de alumnos',
      'Aplicar prueba en el aula y registrar asistencia',
      'Calificar pruebas y asentar notas en la plataforma',
    ],
  },
  // 2. Proyectos, Talleres y Ferias
  {
    keywords: /(feria|proyecto|concurso|exposici[oó]n|festival|acto|evento|olimpiada|taller)/i,
    category: 'Planificación',
    tags: ['Proyecto', 'Taller', 'Estudiantes'],
    materials: [
      'Proyector / Pantalla y cables HDMI',
      'Hojas de instrucciones y rúbrica',
      'Material de papelería (cartulinas, marcadores, cinta)',
      'Listado de grupos y diplomas de reconocimiento',
    ],
    estimatedMinutes: 90,
    subtasks: (title) => [
      `Definir objetivos, cronograma y rúbrica de ${title}`,
      'Organizar equipos y asignar temas a los alumnos',
      'Coordinar salón o espacio físico y equipo técnico',
      'Supervisar presentaciones y evaluar con la rúbrica',
    ],
  },
  // 3. Planificaciones Curriculares y Unidades
  {
    keywords: /(planificaci[oó]n|unidad|did[aá]ctica|curr[ií]culo|syllabus|programa|dosificaci[oó]n)/i,
    category: 'Planificación',
    tags: ['Planificación', 'Currículo', 'Didáctica'],
    materials: [
      'Currículo Nacional Base (CNB) o plan de estudios',
      'Libros de texto y bibliografía guía',
      'Plantilla institucional de planificación',
    ],
    estimatedMinutes: 75,
    subtasks: (title) => [
      `Definir competencias e indicadores de logro para ${title}`,
      'Diseñar la secuencia didáctica (inicio, desarrollo y cierre)',
      'Seleccionar lecturas, ejercicios y recursos de apoyo',
      'Subir planificación al sistema institucional para revisión',
    ],
  },
  // 4. Calificaciones, Boletas y Cuadros
  {
    keywords: /(notas|calificaciones|boletas|cuadros|promedios|zonas|cierre|actas)/i,
    category: 'Entrega de notas',
    tags: ['Secretaría', 'Notas', 'Boletas'],
    materials: [
      'Registro de zonas y tareas acumuladas',
      'Acceso al portal institucional de notas',
      'Cuadro impreso para firma de responsabilidad',
    ],
    estimatedMinutes: 45,
    subtasks: () => [
      'Consolidar zonas y notas acumuladas del período',
      'Ingresar calificaciones en la plataforma académica',
      'Detectar alumnos con riesgo de reprobación',
      'Imprimir y firmar cuadros finales para Secretaría',
    ],
  },
  // 5. Reuniones, Claustros y Atención a Padres
  {
    keywords: /(reuni[oó]n|claustro|padres|consejo|comit[eé]|asamblea|tutor[ií]a|citaci[oó]n)/i,
    category: 'Reunión',
    tags: ['Reunión', 'Seguimiento', 'Docencia'],
    materials: [
      'Agenda de la sesión',
      'Libro de actas o cuaderno de acuerdos',
      'Historial de rendimiento y conducta del estudiante',
    ],
    estimatedMinutes: 45,
    subtasks: (title) => [
      `Revisar puntos clave y agenda para ${title}`,
      'Reunir evidencias y reportes pertinentes',
      'Asistir a la sesión y acordar compromisos concretos',
      'Registrar acta firmada y programar seguimiento',
    ],
  },
  // 6. Preparación de Clases y Laboratorios
  {
    keywords: /(clase|laboratorio|gu[ií]a|diapositivas|presentaci[oó]n|pr[aá]ctica)/i,
    category: 'Planificación',
    tags: ['Clase', 'Laboratorio', 'Didáctica'],
    materials: [
      'Presentación digital o guía de trabajo',
      'Marcadores de pizarra y borrador',
      'Insumos o instrumentos de laboratorio requeridos',
    ],
    estimatedMinutes: 40,
    subtasks: (title) => [
      `Definir el propósito de aprendizaje de ${title}`,
      'Preparar la guía de ejercicios o presentación',
      'Verificar materiales y espacio de trabajo',
      'Publicar recursos en el aula virtual',
    ],
  },
]

/**
 * Desglosa una actividad académica en pasos prácticos y materiales sugeridos.
 */
export async function breakdownTaskWithAI({
  title,
  description,
  category,
}: {
  title: string
  description?: string
  category?: string
}): Promise<TaskBreakdownResult> {
  // Simular micro-latencia cognitiva de 250ms
  await new Promise((res) => setTimeout(res, 250))

  const cleanTitle = title.trim()
  const fullText = `${cleanTitle} ${description || ''}`

  // 1. Buscar coincidencia en plantillas especializadas de dominio
  for (const template of DOMAIN_BREAKDOWNS) {
    if (template.keywords.test(fullText)) {
      return {
        subtasks: template.subtasks(cleanTitle),
        suggestedTags: template.tags,
        suggestedCategory: category || template.category,
        suggestedMaterials: template.materials,
        estimatedTotalMinutes: template.estimatedMinutes,
      }
    }
  }

  // 2. Desglose heurístico conciso y práctico cuando no hay match específico
  return {
    subtasks: [
      `Preparar temario y requerimientos para "${cleanTitle}"`,
      'Elaborar el material didáctico o documento principal',
      'Coordinar con los participantes y confirmar fechas',
      'Ejecutar la actividad y documentar evidencias',
    ],
    suggestedTags: ['Actividad', 'Docencia'],
    suggestedCategory: category || 'Planificación',
    suggestedMaterials: [
      'Hojas de trabajo o apuntes',
      'Equipo audiovisual / Computadora',
      'Cuaderno de registro o control',
    ],
    estimatedTotalMinutes: 45,
  }
}
