const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

export interface ForgotPasswordResponse {
  success: boolean
  message: string
}

export interface RecordLoginResponse {
  recorded: boolean
  isNewDevice: boolean
  device: string
}

export const authService = {
  /**
   * Solicita el restablecimiento de contraseña.
   * Solo aplicable para cuentas registradas con correo y contraseña.
   * Si es cuenta Google OAuth, el backend devuelve error descriptivo con isOAuth: true.
   */
  async requestPasswordReset(email: string): Promise<ForgotPasswordResponse> {
    const res = await fetch(`${backendUrl}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()
    if (!res.ok) {
      const err = new Error(data.error || 'Error al procesar la solicitud de restablecimiento.')
      // @ts-expect-error custom property
      err.isOAuth = data.isOAuth
      throw err
    }

    return data
  },

  /**
   * Registra el dispositivo y la sesión tras autenticación.
   * Detecta si es un dispositivo no reconocido y despacha alerta por correo.
   */
  async recordLogin(token: string): Promise<RecordLoginResponse | null> {
    try {
      const res = await fetch(`${backendUrl}/api/v1/auth/record-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        return null
      }

      return await res.json()
    } catch (err) {
      console.warn('[authService.recordLogin] Advertencia registrando dispositivo:', err)
      return null
    }
  },
}
