import path from 'path'
import fs from 'fs'

/**
 * Retorna el adjunto CID para el logotipo oficial de AgendaPro.
 * Al incrustar el logo como CID inline (cid:logo@agendapro), clientes como Gmail,
 * Outlook y Apple Mail lo renderizan localmente y al instante, sin depender de
 * URLs externas que fallen por proxy de imágenes ni por diferencias entre localhost y producción.
 */
export function getLogoCidAttachment() {
  const candidates = [
    path.resolve(__dirname, '../assets/logo.png'),
    path.resolve(__dirname, '../../assets/logo.png'),
    path.resolve(__dirname, '../../src/assets/logo.png'),
    path.resolve(__dirname, '../src/assets/logo.png'),
    path.resolve(process.cwd(), 'src/assets/logo.png'),
    path.resolve(process.cwd(), 'dist/assets/logo.png'),
    path.resolve(process.cwd(), 'backend/src/assets/logo.png'),
    path.resolve(process.cwd(), 'backend/dist/assets/logo.png'),
    path.resolve(__dirname, '../../../frontend/public/logo.png'),
    path.resolve(__dirname, '../../../../frontend/public/logo.png'),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return {
        filename: 'logo.png',
        path: candidate,
        cid: 'logo@agendapro',
      }
    }
  }

  return null
}

/**
 * Retorna la URL pública HTTPS accesible para el logotipo oficial en correos.
 * Si appUrl apunta a localhost o está vacío, utiliza la URL oficial de producción
 * en Vercel CDN para que los proxies de Gmail/Outlook siempre puedan descargarla.
 */
export function getEmailLogoUrl(appUrl?: string): string {
  const fallbackUrl = 'https://app-agenda-pied.vercel.app/logo.png'
  if (!appUrl || typeof appUrl !== 'string') return fallbackUrl
  const clean = appUrl.trim().replace(/\/$/, '')
  if (clean.includes('localhost') || clean.includes('127.0.0.1')) {
    return fallbackUrl
  }
  return `${clean}/logo.png`
}
