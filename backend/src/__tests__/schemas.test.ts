import { CreateTaskSchema, UpdateTaskSchema, TaskFiltersSchema } from '../schemas/task.schemas'
import { UpdateUserPreferencesSchema, SendTestNotificationSchema } from '../schemas/preferences.schemas'
import { encodeLeadTimes, decodeLeadTimes } from '../utils/leadTimes'

describe('Backend Schemas Validation', () => {
  describe('CreateTaskSchema', () => {
    it('successfully parses valid task data with defaults', () => {
      const valid = {
        title: 'Planificación Bimestral',
      }
      const parsed = CreateTaskSchema.parse(valid)
      expect(parsed.title).toBe('Planificación Bimestral')
      expect(parsed.status).toBe('pendiente')
      expect(parsed.priority).toBe('importante_no_urgente')
      expect(parsed.scope_period).toBe('semanal')
      expect(parsed.tags).toEqual([])
      expect(parsed.is_shared).toBe(false)
    })

    it('validates date and time format', () => {
      const validDateTime = {
        title: 'Examen Final de Matemáticas',
        due_date: '2026-11-20',
        due_time: '09:00:00',
      }
      const parsed = CreateTaskSchema.parse(validDateTime)
      expect(parsed.due_date).toBe('2026-11-20')
      expect(parsed.due_time).toBe('09:00:00')
    })

    it('rejects invalid title (empty string)', () => {
      const invalid = { title: '' }
      expect(() => CreateTaskSchema.parse(invalid)).toThrow()
    })

    it('rejects invalid date format', () => {
      const invalid = { title: 'Tarea', due_date: '20-11-2026' }
      expect(() => CreateTaskSchema.parse(invalid)).toThrow(/Formato de fecha inválido/)
    })
  })

  describe('UpdateTaskSchema', () => {
    it('allows partial updates of only status or priority', () => {
      const partial = { status: 'completada' as const, priority: 'urgente_importante' as const }
      const parsed = UpdateTaskSchema.parse(partial)
      expect(parsed.status).toBe('completada')
      expect(parsed.priority).toBe('urgente_importante')
    })
  })

  describe('TaskFiltersSchema', () => {
    it('provides defaults for pagination', () => {
      const parsed = TaskFiltersSchema.parse({})
      expect(parsed.page).toBe(1)
      expect(parsed.limit).toBe(20)
      expect(parsed.include_archived).toBe(false)
    })
  })

  describe('Preferences Schemas', () => {
    it('validates UpdateUserPreferencesSchema phone format', () => {
      const valid = { phone_number: '+50212345678', reminder_lead_time_minutes: 60 }
      const parsed = UpdateUserPreferencesSchema.parse(valid)
      expect(parsed.phone_number).toBe('+50212345678')
      expect(parsed.reminder_lead_time_minutes).toBe(60)
    })

    it('rejects phone number with letters or invalid characters', () => {
      const invalid = { phone_number: 'abc123' }
      expect(() => UpdateUserPreferencesSchema.parse(invalid)).toThrow(/Formato de teléfono inválido/)
    })

    it('validates SendTestNotificationSchema with valid channels', () => {
      const valid = { channel: 'whatsapp', destination: '+50212345678' }
      const parsed = SendTestNotificationSchema.parse(valid)
      expect(parsed.channel).toBe('whatsapp')
    })

    it('rejects invalid notification channel', () => {
      const invalid = { channel: 'discord' }
      expect(() => SendTestNotificationSchema.parse(invalid)).toThrow()
    })

    it('validates lead times with 3, 5, 10 minutes and encoded multi-select', () => {
      const threeMin = { reminder_lead_time_minutes: 3 }
      expect(UpdateUserPreferencesSchema.parse(threeMin).reminder_lead_time_minutes).toBe(3)

      const encodedMulti = { reminder_lead_time_minutes: encodeLeadTimes([3, 5, 10]) }
      const parsed = UpdateUserPreferencesSchema.parse(encodedMulti)
      expect(parsed.reminder_lead_time_minutes).toBeGreaterThan(100000)
      expect(decodeLeadTimes(parsed.reminder_lead_time_minutes)).toEqual([3, 5, 10])
    })

    it('correctly handles legacy single lead time values', () => {
      expect(decodeLeadTimes(15)).toEqual([15])
      expect(decodeLeadTimes(60)).toEqual([60])
      expect(decodeLeadTimes(null)).toEqual([60])
    })
  })
})
