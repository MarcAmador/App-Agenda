/**
 * Motor de Desglose Pedagógico Inteligente con IA para Actividades Docentes.
 * Analiza el título, descripción y contexto curricular para descomponer tareas complejas
 * en secuencias de subtareas lógicas, accionables y con estimación de tiempo.
 */

export interface TaskBreakdownResult {
  subtasks: string[]
  suggestedTags: string[]
  suggestedCategory?: string
  estimatedTotalMinutes: number
}

interface BreakdownTemplate {
  keywords: RegExp
  category: string
  tags: string[]
  estimatedMinutes: number
  subtasks: (title: string) => string[]
}

const DOMAIN_BREAKDOWNS: BreakdownTemplate[] = [
  // 1. Evaluaciones y Exámenes
  {
    keywords: /(examen|evaluaci[oó]n|prueba|parcial|test|quiz|bimestral|trimestral|recuperaci[oó]n)/i,
    category: 'Examen',
    tags: ['Evaluación', 'Prueba', 'Calificaciones'],
    estimatedMinutes: 90,
    subtasks: (title) => [
      `Definir tabla de especificaciones, competencias a evaluar y ponderación para ${title}`,
      'Elaborar el instrumento de evaluación (reactivos, preguntas o casos prácticos)',
      'Diseñar la clave de respuestas y rúbrica o escala de valoración detallada',
      'Enviar el borrador a Coordinación Académica para revisión y aprobación curricular',
      'Diagramar, fotocopiar y foliar las pruebas según la nómina oficial del grupo',
      'Aplicar la prueba en el aula, supervisar y registrar asistencia',
      'Calificar las evaluaciones, realizar retroalimentación a estudiantes y asentar en cuadro de notas',
    ],
  },
  // 2. Proyectos y Ferias Científicas / Culturales
  {
    keywords: /(feria|proyecto|concurso|exposici[oó]n|festival|acto|evento|olimpiada)/i,
    category: 'Planificación',
    tags: ['Proyecto', 'Evento', 'Estudiantes'],
    estimatedMinutes: 180,
    subtasks: (title) => [
      `Elaborar las bases, rúbricas y cronograma general de ${title}`,
      'Presentar la convocatoria e integrar los equipos de trabajo de estudiantes',
      'Monitorear avances intermedios y brindar asesoría metodológica a cada grupo',
      'Gestionar los espacios físicos, requerimientos técnicos y jurado calificador',
      'Coordinar el montaje, inauguración y desarrollo de las presentaciones',
      'Evaluar el desempeño estudiantil y entregar reconocimientos a los participantes',
    ],
  },
  // 3. Planificaciones Curriculares y Unidades
  {
    keywords: /(planificaci[oó]n|unidad|did[aá]ctica|curr[ií]culo|syllabus|programa|dosificaci[oó]n)/i,
    category: 'Planificación',
    tags: ['Planificación', 'Currículo', 'Didáctica'],
    estimatedMinutes: 120,
    subtasks: (title) => [
      `Alinear los objetivos de ${title} con el CNB y estándares del grado`,
      'Diseñar la secuencia didáctica: actividades de inicio, desarrollo y cierre',
      'Seleccionar bibliografía, lecturas de apoyo y recursos digitales o audiovisuales',
      'Diseñar instrumentos de evaluación diagnóstica, formativa y sumativa',
      'Cargar el plan a la plataforma académica institucional y solicitar validación',
    ],
  },
  // 4. Calificaciones y Boletas
  {
    keywords: /(notas|calificaciones|boletas|cuadros|promedios|zonas|cierre)/i,
    category: 'Entrega de notas',
    tags: ['Secretaría', 'Notas', 'Cierre'],
    estimatedMinutes: 75,
    subtasks: () => [
      'Consolidar y verificar las ponderaciones de tareas, proyectos y exámenes en planilla',
      'Ingresar las calificaciones al sistema institucional en línea',
      'Generar reporte de alertas de estudiantes en riesgo de reprobación y citaciones requeridas',
      'Cotejar promedios finales, imprimir cuadros de control y estampar firma de responsabilidad',
      'Entregar la documentación completa a Secretaría Académica para emisión de boletas',
    ],
  },
  // 5. Reuniones y Claustros
  {
    keywords: /(reuni[oó]n|claustro|padres|consejo|comit[eé]|asamblea|tutor[ií]a)/i,
    category: 'Reunión',
    tags: ['Reunión', 'Claustro', 'Seguimiento'],
    estimatedMinutes: 60,
    subtasks: (title) => [
      `Revisar los puntos de agenda previa y objetivos clave de ${title}`,
      'Recopilar la información y evidencias necesarias (reportes de notas, asistencias o casos especiales)',
      'Asistir puntualmente y registrar acuerdos, compromisos y plazos establecidos',
      'Elaborar la minuta o acta formal de la sesión y archivar en el expediente correspondiente',
      'Programar el seguimiento y cumplimiento de las acciones asignadas',
    ],
  },
  // 6. Preparación de Clases y Materiales
  {
    keywords: /(clase|taller|laboratorio|gu[ií]a|material|diapositivas|presentaci[oó]n)/i,
    category: 'Planificación',
    tags: ['Clase', 'Material', 'Didáctica'],
    estimatedMinutes: 50,
    subtasks: (title) => [
      `Definir el propósito de aprendizaje y pregunta detonadora de ${title}`,
      'Diseñar el material visual / diapositivas interactivas o guía de ejercicios prácticos',
      'Verificar el funcionamiento de enlaces, recursos multimedia o equipos de laboratorio',
      'Preparar la actividad de evaluación formativa rápida (cierre / ticket de salida)',
      'Subir los recursos de estudio al aula virtual (Classroom / Teams / Drive)',
    ],
  },
]

/**
 * Desglosa una actividad académica en pasos pedagógicos accionables.
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
  // Simular latencia de análisis cognitivo (350ms para micro-animación)
  await new Promise((res) => setTimeout(res, 350))

  const cleanTitle = title.trim()
  const fullText = `${cleanTitle} ${description || ''}`

  // Buscar coincidencia en plantillas especializadas de dominio
  for (const template of DOMAIN_BREAKDOWNS) {
    if (template.keywords.test(fullText)) {
      return {
        subtasks: template.subtasks(cleanTitle),
        suggestedTags: template.tags,
        suggestedCategory: category || template.category,
        estimatedTotalMinutes: template.estimatedMinutes,
      }
    }
  }

  // Generador heurístico general en 5 fases pedagógicas (Taxonomía de Bloom)
  return {
    subtasks: [
      `Fase 1: Definir los objetivos pedagógicos y criterios de éxito para "${cleanTitle}"`,
      'Fase 2: Recopilar fuentes de información, recursos didácticos y herramientas necesarias',
      'Fase 3: Elaborar el borrador o estructura de la actividad con rúbrica de verificación',
      'Fase 4: Ejecutar o implementar la actividad con los estudiantes o equipo de trabajo',
      'Fase 5: Evaluar resultados, documentar evidencias de aprendizaje y retroalimentar',
    ],
    suggestedTags: ['Actividad', 'Docencia', 'Académico'],
    suggestedCategory: category || 'clases',
    estimatedTotalMinutes: 60,
  }
}
