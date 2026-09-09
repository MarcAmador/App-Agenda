export interface LeadTimeOption {
  label: string
  value: number
  bit: number
}

export const LEAD_TIME_OPTIONS: LeadTimeOption[] = [
  { label: '3 minutos antes', value: 3, bit: 1 << 0 },
  { label: '5 minutos antes', value: 5, bit: 1 << 1 },
  { label: '10 minutos antes', value: 10, bit: 1 << 2 },
  { label: '15 minutos antes', value: 15, bit: 1 << 3 },
  { label: '30 minutos antes', value: 30, bit: 1 << 4 },
  { label: '1 hora antes (Recomendado)', value: 60, bit: 1 << 5 },
  { label: '2 horas antes', value: 120, bit: 1 << 6 },
  { label: '1 día antes (24 horas)', value: 1440, bit: 1 << 7 },
]

/**
 * Codifica múltiples tiempos en un entero almacenable en `reminder_lead_time_minutes`.
 */
export function encodeLeadTimes(times: number[]): number {
  if (!times || times.length === 0) return 60

  let mask = 0
  for (const t of times) {
    const opt = LEAD_TIME_OPTIONS.find((c) => c.value === t)
    if (opt) {
      mask |= opt.bit
    }
  }

  if (mask === 0) return times[0] ?? 60
  return 100000 + mask
}

/**
 * Decodifica el entero de la BD a un arreglo de números seleccionados.
 */
export function decodeLeadTimes(storedVal: number | null | undefined): number[] {
  if (!storedVal || storedVal <= 0) return [60]

  if (storedVal >= 100000) {
    const mask = storedVal - 100000
    const matched = LEAD_TIME_OPTIONS.filter((c) => (mask & c.bit) !== 0).map((c) => c.value)
    return matched.length > 0 ? matched : [60]
  }

  return [storedVal]
}
