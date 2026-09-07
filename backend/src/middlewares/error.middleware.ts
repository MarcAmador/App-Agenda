import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

/**
 * Manejador centralizado de errores.
 * Captura errores de validación Zod, errores de Supabase y errores genéricos.
 * Debe registrarse como el último middleware en Express.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[ErrorHandler]', err)

  // Errores de validación Zod: payload malformado
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Datos de entrada inválidos',
      issues: err.flatten().fieldErrors,
    })
    return
  }

  // Errores genéricos con status code
  if (err instanceof Error) {
    const statusCode = (err as Error & { statusCode?: number }).statusCode ?? 500
    res.status(statusCode).json({
      error: err.message || 'Error interno del servidor',
    })
    return
  }

  res.status(500).json({ error: 'Error interno del servidor' })
}
