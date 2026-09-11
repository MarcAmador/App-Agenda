import dns from 'dns'
import os from 'os'

/**
 * ─── Configuración de Red IPv4 Forzada ─────────────────────────────────────────
 * Render (y contenedores Linux en la nube) carecen de enrutamiento IPv6 público.
 * Sin embargo, interfaces locales como `eth0` tienen asignadas direcciones
 * link-local IPv6 (fe80::).
 *
 * Nodemailer (v10) y Node.js intentan resolver registros AAAA (IPv6) por defecto.
 * Al seleccionar una dirección IPv6 (ej. smtp.gmail.com -> 2607:f8b0:...),
 * la llamada al socket del kernel de Linux falla inmediatamente con:
 *   "connect ENETUNREACH 2607:f8b0:... - Local (:::0)" o "Connection timeout".
 *
 * Este módulo garantiza a nivel de proceso que:
 * 1. os.networkInterfaces() solo exponga interfaces IPv4.
 * 2. dns.setDefaultResultOrder('ipv4first') priorice IPv4 en getaddrinfo.
 * 3. dns.resolve6 reporte ENODATA de forma limpia sin romper resolvers DNS.
 */

// 1. Filtrar os.networkInterfaces para reportar únicamente IPv4
const originalNetworkInterfaces = os.networkInterfaces
os.networkInterfaces = function () {
  const ifaces = originalNetworkInterfaces.call(os)
  const filtered: NodeJS.Dict<os.NetworkInterfaceInfo[]> = {}
  for (const [name, list] of Object.entries(ifaces)) {
    if (list) {
      filtered[name] = list.filter((item) => item.family === 'IPv4' || (item.family as unknown as number) === 4)
    }
  }
  return filtered
}

// 2. Orden de resolución por defecto: IPv4 primero
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first')
}

// 3. Desactivar resolución activa de registros AAAA (IPv6) retornando ENODATA
const nodataError = (hostname: string) => {
  const err = new Error(`queryAaaa ENODATA ${hostname}`) as NodeJS.ErrnoException
  err.code = 'ENODATA'
  err.errno = -3008
  err.syscall = 'queryAaaa'
  ;(err as any).hostname = hostname
  return err
}

// Interceptar dns.resolve6 (callback style)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
dns.resolve6 = function (hostname: string, options: unknown, callback?: unknown): any {
  const cb = (typeof options === 'function' ? options : callback) as (
    err: NodeJS.ErrnoException | null,
    addresses: string[]
  ) => void
  if (typeof cb === 'function') {
    return cb(nodataError(hostname), [])
  }
  return []
} as any

// Interceptar dns.promises.resolve6
if (dns.promises) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dns.promises.resolve6 = (async function (hostname: string): Promise<any> {
    throw nodataError(hostname)
  }) as any
}

// Interceptar instancias de dns.Resolver
if (dns.Resolver) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dns.Resolver.prototype.resolve6 = function (hostname: string, options: unknown, callback?: unknown): any {
    const cb = (typeof options === 'function' ? options : callback) as (
      err: NodeJS.ErrnoException | null,
      addresses: string[]
    ) => void
    if (typeof cb === 'function') {
      return cb(nodataError(hostname), [])
    }
    return []
  } as any
}

console.log('🌐 [NetworkConfig] Modo de red IPv4 forzado activo (prevención ENETUNREACH / timeout)')
