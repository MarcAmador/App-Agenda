export interface LeadTimeConfig {
  value: number
  bit: number
  label: string
}

export const LEAD_TIME_CONFIGS: LeadTimeConfig[] = [
  { value: 3, bit: 1 << 0, label: '3 minutos antes' },
  { value: 5, bit: 1 << 1, label: '5 minutos antes' },
  { value: 10, bit: 1 << 2, label: '10 minutos antes' },
  { value: 15, bit: 1 << 3, label: '15 minutos antes' },
  { value: 30, bit: 1 << 4, label: '30 minutos antes' },
  { value: 60, bit: 1 << 5, label: '1 hora antes' },
  { value: 120, bit: 1 << 6, label: '2 horas antes' },
  { value: 1440, bit: 1 << 7, label: '1 día antes (24 horas)' },
]

/**
 * Codifica un arreglo de minutos seleccionados en un entero compatible con la columna
 * `reminder_lead_time_minutes` de la base de datos sin requerir migraciones DDL destructivas.
 */
export function encodeLeadTimes(times: number[]): number {
  if (!times || times.length === 0) return 60

  let mask = 0
  for (const t of times) {
    const config = LEAD_TIME_CONFIGS.find((c) => c.value === t)
    if (config) {
      mask |= config.bit
    }
  }

  // Si no coincidió con ninguna configuración conocida, retornar el primer valor o default
  if (mask === 0) return times[0] ?? 60

  return 100000 + mask
}

/**
 * Decodifica el entero de la BD a un arreglo de minutos para despacho individual.
 * Si el valor es menor a 100000 (dato legacy), lo trata como un solo valor entero.
 */
export function decodeLeadTimes(storedVal: number | null | undefined): number[] {
  if (!storedVal || storedVal <= 0) return [60]

  if (storedVal >= 100000) {
    const mask = storedVal - 100000
    const matched = LEAD_TIME_CONFIGS.filter((c) => (mask & c.bit) !== 0).map((c) => c.value)
    return matched.length > 0 ? matched : [60]
  }

  // Compatibilidad hacia atrás: registro único legacy (ej. 15, 60)
  return [storedVal]
}

export function formatLeadTimeText(minutes: number): string {
  if (minutes < 60) return `${minutes} minutos antes`
  if (minutes === 60) return '1 hora antes'
  if (minutes === 120) return '2 horas antes'
  if (minutes === 1440) return '1 día antes'
  return `${minutes / 60} horas antes`
}
