import { EmailAdapter } from '../services/dispatcher/adapters/email.adapter'
import { WhatsAppAdapter } from '../services/dispatcher/adapters/whatsapp.adapter'

describe('Notification Dispatcher Adapters', () => {
  describe('EmailAdapter', () => {
    const adapter = new EmailAdapter()

    it('returns error when userEmail is missing', async () => {
      const result = await adapter.send({
        taskTitle: 'Tarea sin correo',
        userName: 'Carlos',
      })

      expect(result.channel).toBe('email')
      expect(result.success).toBe(false)
      expect(result.error).toContain('El usuario no tiene una dirección de correo')
    })

    it('generates rich HTML with task details and Eisenhower priority', () => {
      // Accedemos al método privado mediante cast para prueba unitaria
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const html = (adapter as any).generateHtml({
        taskTitle: 'Revisión Curricular',
        taskDescription: 'Alineación de competencias pedagógicas',
        dueDate: '2026-10-30',
        dueTime: '11:00:00',
        priority: 'urgente_importante',
        userName: 'Dra. Patricia Gómez',
        userEmail: 'patricia@colegio.edu',
      })

      expect(html).toContain('AgendaPro')
      expect(html).toContain('Revisión Curricular')
      expect(html).toContain('Alineación de competencias pedagógicas')
      expect(html).toContain('2026-10-30')
      expect(html).toContain('Dra. Patricia Gómez')
    })
  })

  describe('WhatsAppAdapter', () => {
    const adapter = new WhatsAppAdapter()

    it('returns error when phoneNumber is missing', async () => {
      const result = await adapter.send({
        taskTitle: 'Tarea sin teléfono',
        userName: 'Carlos',
      })

      expect(result.channel).toBe('whatsapp')
      expect(result.success).toBe(false)
      expect(result.error).toContain('El usuario no tiene un número de teléfono')
    })

    it('generates direct wa.me URL with properly encoded message and emojis', async () => {
      const result = await adapter.send({
        taskTitle: 'Reunión de Claustro de Docentes',
        taskDescription: 'Entrega de boletas del tercer bimestre',
        dueDate: '2026-10-18',
        dueTime: '16:00:00',
        priority: 'importante_no_urgente',
        userName: 'Prof. Mario Alvarado',
        phoneNumber: '+50255554321',
      })

      expect(result.channel).toBe('whatsapp')
      expect(result.success).toBe(true)
      expect(result.directUrl).toBeDefined()
      expect(result.directUrl).toContain('https://wa.me/50255554321?text=')
      // Decodificamos el texto para validar los emojis y contenido
      const decodedUrl = decodeURIComponent(result.directUrl!)
      expect(decodedUrl).toContain('⏰ *Recordatorio AgendaPro*')
      expect(decodedUrl).toContain('Reunión de Claustro de Docentes')
      expect(decodedUrl).toContain('Prof. Mario Alvarado')
      expect(decodedUrl).toContain('2026-10-18')
    })
  })
})
