import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { env } from '../../../config/env'
import type { ChannelAdapter, DeliveryResult, NotificationPayload } from '../dispatcher.types'

export class EmailAdapter implements ChannelAdapter {
  readonly channel = 'email' as const
  private cachedTransporter: Transporter | null = null

  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    const sentAt = new Date()

    if (!payload.userEmail) {
      return {
        channel: this.channel,
        success: false,
        error: 'El usuario no tiene una dirección de correo configurada',
        sentAt,
      }
    }

    try {
      const { transporter, isEthereal } = await this.getTransporter()

      let leadLabel = ''
      if (payload.leadMinutes) {
        if (payload.leadMinutes < 60) leadLabel = `${payload.leadMinutes} min antes`
        else if (payload.leadMinutes === 60) leadLabel = '1 hora antes'
        else if (payload.leadMinutes === 120) leadLabel = '2 horas antes'
        else if (payload.leadMinutes === 1440) leadLabel = '1 día antes'
        else leadLabel = `${payload.leadMinutes / 60} horas antes`
      }

      const subject = payload.isTest
        ? '🔔 [Prueba] Notificación de Entrega · AgendaPro'
        : leadLabel
        ? `⏰ Recordatorio (${leadLabel}): ${payload.taskTitle}`
        : `⏰ Recordatorio Académico: ${payload.taskTitle}`

      const html = this.generateHtml(payload)
      const text = this.generatePlainText(payload)

      const fromAddress = env.SMTP_FROM || `"AgendaPro Académico" <${env.SMTP_USER || 'notificaciones@agendapro.edu'}>`

      const info = await transporter.sendMail({
        from: fromAddress,
        to: payload.userEmail,
        subject,
        text,
        html,
      })

      let previewUrl: string | undefined

      if (isEthereal) {
        const testUrl = nodemailer.getTestMessageUrl(info)
        if (testUrl) {
          previewUrl = testUrl as string
          console.log(`[EmailAdapter] 🌐 Correo enviado vía Ethereal. Ver en: ${previewUrl}`)
        }
      } else {
        console.log(`[EmailAdapter] ✉️ Correo enviado exitosamente vía SMTP real a ${payload.userEmail}`)
      }

      return {
        channel: this.channel,
        success: true,
        messageId: info.messageId,
        previewUrl,
        sentAt,
      }
    } catch (err) {
      let errorMsg = err instanceof Error ? err.message : 'Error desconocido al enviar email'
      
      // Diagnóstico detallado para Google y SMTP
      if (errorMsg.includes('535') || errorMsg.includes('BadCredentials') || errorMsg.includes('Username and Password not accepted')) {
        errorMsg = 'Google rechazó la contraseña: Si usas Gmail, debes generar una "Contraseña de aplicación" de 16 caracteres en Google (Seguridad > Verificación en 2 pasos > Contraseñas de aplicaciones), NO la contraseña habitual.'
      } else if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ETIMEDOUT')) {
        errorMsg = 'No se pudo conectar con el servidor SMTP. Verifica el host y el puerto.'
      }

      console.error('[EmailAdapter] Error al despachar correo:', errorMsg)
      return {
        channel: this.channel,
        success: false,
        error: errorMsg,
        sentAt,
      }
    }
  }

  /**
   * Resetea el transporter en caché al actualizar variables de entorno en tiempo de ejecución
   */
  public resetTransporter(): void {
    this.cachedTransporter = null
  }

  /**
   * Inicializa el transporte SMTP real (Gmail, Outlook, etc.) o Ethereal para tests
   */
  private async getTransporter(): Promise<{ transporter: Transporter; isEthereal: boolean }> {
    // Si hay credenciales SMTP configuradas en .env o runtime
    if (env.SMTP_USER && env.SMTP_PASS) {
      if (!this.cachedTransporter) {
        const cleanPass = env.SMTP_PASS.replace(/\s+/g, '')
        const host = env.SMTP_HOST || 'smtp.gmail.com'
        const port = Number(env.SMTP_PORT) || 587
        const secure = env.SMTP_SECURE === 'true'

        this.cachedTransporter = nodemailer.createTransport({
          host,
          port,
          secure,
          family: 4,
          auth: {
            user: env.SMTP_USER,
            pass: cleanPass,
          },
        } as any)
      }
      return { transporter: this.cachedTransporter, isEthereal: false }
    }

    // Fallback de demostración / test interactivo: Cuenta Ethereal temporal
    const testAccount = await nodemailer.createTestAccount()
    const etherealTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })

    return { transporter: etherealTransporter, isEthereal: true }
  }

  private generatePlainText(payload: NotificationPayload): string {
    const appUrl = env.CORS_ORIGIN || 'http://localhost:5180'
    return `
AgendaPro · Alerta de Productividad Académica
--------------------------------------------------
Hola ${payload.userName},

${payload.isTest ? 'Este es un mensaje de prueba para verificar tu canal de correo.' : 'Tienes una actividad próxima a vencer en tu agenda:'}

Título: ${payload.taskTitle}
${payload.taskDescription ? `Detalles: ${payload.taskDescription}` : ''}
Fecha Límite: ${payload.dueDate ?? 'Hoy'} ${payload.dueTime ? `a las ${payload.dueTime.substring(0, 5)}` : ''}
Prioridad: ${payload.priority ?? 'General'}

Gestiona tus actividades ingresando a tu portal de AgendaPro:
${appUrl}/tareas
    `.trim()
  }

  private generateHtml(payload: NotificationPayload): string {
    const appUrl = env.CORS_ORIGIN || 'http://localhost:5180'
    const priorityColor =
      payload.priority?.toLowerCase().includes('urgente') && payload.priority?.toLowerCase().includes('importante')
        ? '#ef4444' // Q1 Red
        : payload.priority?.toLowerCase().includes('importante')
        ? '#10b981' // Q2 Green
        : payload.priority?.toLowerCase().includes('urgente')
        ? '#f59e0b' // Q3 Amber
        : '#64748b' // Q4 Gray

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerta AgendaPro</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Contenedor Principal -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
          
          <!-- Encabezado con Degradado -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #0284c7 50%, #06b6d4 100%); padding: 36px 32px; text-align: center;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; width: 48px; height: 48px; background-color: rgba(255, 255, 255, 0.2); border-radius: 14px; line-height: 48px; text-align: center; margin-bottom: 12px;">
                      <span style="font-size: 24px;">📅</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.03em;">AgendaPro</h1>
                    <p style="margin: 6px 0 0 0; color: rgba(255, 255, 255, 0.85); font-size: 13px; font-weight: 500;">Gestión Académica & Productividad</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cuerpo del Mensaje -->
          <tr>
            <td style="padding: 36px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #334155;">
                Hola <strong>${payload.userName}</strong>,
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #64748b;">
                ${payload.isTest 
                  ? 'Te confirmamos que tu canal de correo está <strong>correctamente configurado y activo</strong> para recibir alertas oportunas de tus actividades.' 
                  : 'Tienes una actividad programada en tu agenda académica que requiere tu seguimiento:'}
              </p>

              <!-- Tarjeta de la Tarea -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px;">
                    <!-- Badges de Alerta y Prioridad -->
                    <div style="margin-bottom: 12px;">
                      ${payload.leadMinutes ? `
                      <div style="display: inline-block; padding: 4px 10px; background-color: #e0f2fe; border: 1px solid #bae6fd; border-radius: 20px; font-size: 11px; font-weight: 700; color: #0284c7; margin-right: 6px;">
                        ⏳ Alerta ${payload.leadMinutes < 60 ? `${payload.leadMinutes} min antes` : payload.leadMinutes === 60 ? '1 hora antes' : `${payload.leadMinutes / 60}h antes`}
                      </div>` : ''}

                      ${payload.priority ? `
                      <div style="display: inline-block; padding: 4px 10px; background-color: ${priorityColor}15; border: 1px solid ${priorityColor}40; border-radius: 20px; font-size: 11px; font-weight: 700; color: ${priorityColor}; text-transform: uppercase; letter-spacing: 0.05em;">
                        ⚡ ${payload.priority}
                      </div>` : ''}
                    </div>

                    <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #0f172a; line-height: 24px;">
                      ${payload.taskTitle}
                    </h2>

                    ${payload.taskDescription ? `
                    <p style="margin: 0 0 18px 0; font-size: 13px; line-height: 20px; color: #475569;">
                      ${payload.taskDescription}
                    </p>` : '<div style="height: 12px;"></div>'}

                    <!-- Metadatos -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 1px solid #e2e8f0; padding-top: 14px;">
                      <tr>
                        <td style="font-size: 12px; color: #64748b; padding-bottom: 6px;">
                          📅 <strong>Fecha de Entrega:</strong> ${payload.dueDate ?? 'Hoy'}
                        </td>
                      </tr>
                      ${payload.dueTime ? `
                      <tr>
                        <td style="font-size: 12px; color: #64748b;">
                          ⏰ <strong>Hora Límite:</strong> ${payload.dueTime.substring(0, 5)}
                        </td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Botón de Acción -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/tareas" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4f46e5 0%, #0284c7 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 12px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">
                      Abrir en AgendaPro →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8; text-align: center;">
                Puedes modificar tus preferencias de notificación en cualquier momento desde el <a href="${appUrl}/config" style="color: #4f46e5; text-decoration: underline;">Panel de Configuración</a>.
              </p>
            </td>
          </tr>

          <!-- Pie de Página -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 16px;">
                © 2026 AgendaPro SaaS · Plataforma de Productividad y Gestión Académica.<br>
                Este es un mensaje automático generado por tu sistema de agenda.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()
  }
}
