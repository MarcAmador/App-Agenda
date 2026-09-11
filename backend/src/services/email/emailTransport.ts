import nodemailer, { type TransportOptions } from 'nodemailer'
import fs from 'fs'
import { smtpStore } from '../../config/smtpStore'
import { getEmailLogoUrl } from '../../utils/emailAssets'

export interface SendEmailOptions {
  to: string
  toName?: string
  subject: string
  html: string
  text?: string
  fromName?: string
  fromEmail?: string
  attachments?: Array<{
    filename: string
    path?: string
    content?: string | Buffer
    cid?: string
  }>
}

export interface VerifyEmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
}

export interface VerifyResult {
  success: boolean
  latencyMs: number
  message: string
  details: Record<string, unknown>
}

export function isBrevoProvider(cfg: { host?: string; pass?: string }): boolean {
  const host = (cfg.host || '').toLowerCase()
  const pass = (cfg.pass || '').trim()
  return (
    host.includes('brevo') ||
    host.includes('sendinblue') ||
    pass.startsWith('xkeysib-') ||
    Boolean(process.env.BREVO_API_KEY)
  )
}

export function isResendProvider(cfg: { host?: string; pass?: string }): boolean {
  const host = (cfg.host || '').toLowerCase()
  const pass = (cfg.pass || '').trim()
  return (
    host.includes('resend') ||
    pass.startsWith('re_') ||
    Boolean(process.env.RESEND_API_KEY)
  )
}

/**
 * Envía un correo electrónico a través de la vía óptima:
 * 1. Brevo HTTPS API (Puerto 443) si la clave inicia con 'xkeysib-' o el host es 'api.brevo.com'.
 * 2. Resend HTTPS API (Puerto 443) si la clave inicia con 're_' o el host es 'resend'.
 * 3. SMTP estándar (Nodemailer) como fallback si se dispone de puertos abiertos.
 */
export async function sendEmailMessage(options: SendEmailOptions): Promise<{ messageId: string }> {
  const cfg = smtpStore.get()
  const effectivePass = (process.env.BREVO_API_KEY || cfg.pass || '').replace(/\s+/g, '')

  let fromName = options.fromName || cfg.fromName || 'AgendaPro Académico'
  if (fromName.toLowerCase().includes('nivora')) {
    fromName = 'AgendaPro Académico'
  }
  const fromEmail = options.fromEmail || cfg.fromEmail || cfg.user || 'alertas.agendapro@gmail.com'

  // URL pública CDN del logo para incrustación directa en el diseño HTML
  const logoUrl = getEmailLogoUrl(cfg.appUrl)
  // Reemplazar referencias legacy cid:logo@agendapro por la URL pública HTTPS de CDN
  const cleanHtml = (options.html || '').replace(/cid:logo@agendapro/g, logoUrl)

  // Filtrar adjuntos para NO adjuntar el logotipo como archivo descargable (evita que aparezca al pie del correo)
  const customAttachments = (options.attachments || []).filter(
    (att) => att.cid !== 'logo@agendapro' && att.filename !== 'logo.png'
  )

  // ─── 1. VÍA BREVO API (HTTPS PUERTO 443 — INMUNE A BLOQUEOS DE RENDER) ─────
  if (isBrevoProvider({ host: cfg.host, pass: effectivePass })) {
    const apiKey = process.env.BREVO_API_KEY || effectivePass

    // Preparar únicamente adjuntos legítimos explícitos (nunca el logo)
    const brevoAttachments: Array<{ name: string; content: string }> = []

    for (const att of customAttachments) {
      if (att.path && fs.existsSync(att.path)) {
        const fileBase64 = fs.readFileSync(att.path).toString('base64')
        brevoAttachments.push({
          name: att.filename,
          content: fileBase64,
        })
      } else if (att.content) {
        const contentStr = Buffer.isBuffer(att.content)
          ? att.content.toString('base64')
          : Buffer.from(att.content).toString('base64')
        brevoAttachments.push({
          name: att.filename,
          content: contentStr,
        })
      }
    }

    const payload = {
      sender: {
        name: fromName,
        email: fromEmail,
      },
      to: [
        {
          email: options.to,
          name: options.toName || options.to.split('@')[0],
        },
      ],
      subject: options.subject,
      htmlContent: cleanHtml,
      textContent: options.text || undefined,
      ...(brevoAttachments.length > 0 ? { attachment: brevoAttachments } : {}),
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = (await res.json()) as any

    if (!res.ok) {
      const errMsg = data?.message || data?.error || `Error HTTP ${res.status} desde la API de Brevo`
      throw new Error(`[Brevo API Error] ${errMsg}`)
    }

    const messageId = data?.messageId || `brevo-${Date.now()}`
    console.log(`[EmailTransport] 🚀 Correo despachado exitosamente vía Brevo API (Puerto 443) → ${options.to} [${messageId}]`)
    return { messageId }
  }

  // ─── 2. VÍA RESEND API (HTTPS PUERTO 443) ──────────────────────────────────
  if (isResendProvider({ host: cfg.host, pass: effectivePass })) {
    const apiKey = process.env.RESEND_API_KEY || effectivePass

    const payload = {
      from: `"${fromName}" <${fromEmail}>`,
      to: [options.to],
      subject: options.subject,
      html: cleanHtml,
      text: options.text || undefined,
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = (await res.json()) as any

    if (!res.ok) {
      const errMsg = data?.message || `Error HTTP ${res.status} desde la API de Resend`
      throw new Error(`[Resend API Error] ${errMsg}`)
    }

    const messageId = data?.id || `resend-${Date.now()}`
    console.log(`[EmailTransport] 🚀 Correo despachado exitosamente vía Resend API (Puerto 443) → ${options.to} [${messageId}]`)
    return { messageId }
  }

  // ─── 3. VÍA SMTP ESTÁNDAR (NODEMAILER — FALLBACK LOCAL / PUERTOS ABIERTOS) ──
  if (!cfg.user || !cfg.pass) {
    throw new Error(
      'No hay credenciales de correo configuradas. ' +
      'Configura tu API Key de Brevo (recomendado para Render gratuito) o credenciales SMTP en el SuperAdmin.'
    )
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    family: 4,
    pool: true,
    maxConnections: 3,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 25000,
    auth: {
      user: cfg.user,
      pass: cfg.pass.replace(/\s+/g, ''),
    },
  } as TransportOptions)

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: options.to,
    subject: options.subject,
    html: cleanHtml,
    text: options.text,
    attachments: customAttachments.length > 0 ? customAttachments : undefined,
  })

  console.log(`[EmailTransport] 🔌 Correo despachado exitosamente vía SMTP (${cfg.host}:${cfg.port}) → ${options.to}`)
  return { messageId: info.messageId }
}

/**
 * Diagnostica y valida la conexión del proveedor de correo configurado.
 */
export async function verifyEmailTransport(config: VerifyEmailConfig): Promise<VerifyResult> {
  const startTime = Date.now()
  const cleanPass = (config.pass || '').trim().replace(/\s+/g, '')
  const cleanHost = (config.host || '').trim().toLowerCase()

  // ─── VERIFICAR BREVO API ───────────────────────────────────────────────────
  if (isBrevoProvider({ host: cleanHost, pass: cleanPass })) {
    const apiKey = cleanPass || process.env.BREVO_API_KEY || ''
    if (!apiKey) {
      return {
        success: false,
        latencyMs: 0,
        message: 'Fallo: Ingresa tu clave API de Brevo (inicia con xkeysib-).',
        details: { provider: 'Brevo API', error: 'API Key ausente' },
      }
    }

    try {
      const res = await fetch('https://api.brevo.com/v3/account', {
        headers: {
          'api-key': apiKey,
          Accept: 'application/json',
        },
      })

      const latencyMs = Date.now() - startTime
      const data = (await res.json()) as any

      if (!res.ok) {
        return {
          success: false,
          latencyMs,
          message: `Fallo de autenticación en Brevo: ${data?.message || 'Clave de API inválida'}`,
          details: { provider: 'Brevo API', port: 443, status: res.status, ...data },
        }
      }

      const accountEmail = data?.email || config.user || 'Cuenta verificada'
      const planType = data?.plan?.[0]?.type || 'Free'

      return {
        success: true,
        latencyMs,
        message: `¡Conexión exitosa con la API de Brevo (HTTPS Puerto 443)! Cuenta: ${accountEmail} (Plan ${planType} - 300 correos/día).`,
        details: {
          provider: 'Brevo REST API',
          protocol: 'HTTPS',
          port: 443,
          accountEmail,
          plan: planType,
          credits: data?.plan?.[0]?.credits,
        },
      }
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime
      const msg = err instanceof Error ? err.message : String(err)
      return {
        success: false,
        latencyMs,
        message: `Error al conectar con la API de Brevo por HTTPS: ${msg}`,
        details: { provider: 'Brevo API', error: msg },
      }
    }
  }

  // ─── VERIFICAR RESEND API ──────────────────────────────────────────────────
  if (isResendProvider({ host: cleanHost, pass: cleanPass })) {
    const apiKey = cleanPass || process.env.RESEND_API_KEY || ''
    try {
      const res = await fetch('https://api.resend.com/api-keys', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      })

      const latencyMs = Date.now() - startTime
      const data = (await res.json()) as any

      if (!res.ok) {
        return {
          success: false,
          latencyMs,
          message: `Fallo de autenticación en Resend: ${data?.message || 'API Key inválida'}`,
          details: { provider: 'Resend API', port: 443, ...data },
        }
      }

      return {
        success: true,
        latencyMs,
        message: '¡Conexión exitosa con la API de Resend (HTTPS Puerto 443)!',
        details: { provider: 'Resend REST API', protocol: 'HTTPS', port: 443 },
      }
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime
      const msg = err instanceof Error ? err.message : String(err)
      return {
        success: false,
        latencyMs,
        message: `Error al conectar con Resend: ${msg}`,
        details: { provider: 'Resend API', error: msg },
      }
    }
  }

  // ─── VERIFICAR SMTP TRADICIONAL (NODEMAILER) ───────────────────────────────
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: Number(config.port) || 587,
      secure: Boolean(config.secure),
      auth: {
        user: config.user.trim(),
        pass: cleanPass,
      },
      family: 4,
      connectionTimeout: 12000,
    } as TransportOptions)

    await transporter.verify()
    const latencyMs = Date.now() - startTime

    return {
      success: true,
      latencyMs,
      message: `Conexión SMTP exitosa con ${config.host}:${config.port} en ${latencyMs}ms.`,
      details: {
        provider: 'SMTP',
        host: config.host,
        port: config.port,
        user: config.user,
        protocol: config.secure ? 'SMTPS (SSL)' : 'STARTTLS',
        family: 'IPv4',
      },
    }
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime
    const errorMessage = err instanceof Error ? err.message : String(err)

    let advice = ''
    if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT') || errorMessage.includes('ENETUNREACH')) {
      advice = ' (Nota: El plan gratuito de Render bloquea los puertos SMTP 25, 465 y 587. Te sugerimos usar Brevo en el puerto 443 HTTPS).'
    }

    return {
      success: false,
      latencyMs,
      message: `Fallo de conexión SMTP: ${errorMessage}${advice}`,
      details: { error: errorMessage, host: config.host, port: config.port },
    }
  }
}
