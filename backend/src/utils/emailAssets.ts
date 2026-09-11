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
