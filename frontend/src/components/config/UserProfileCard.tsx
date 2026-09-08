import { useState } from 'react'
import { ShieldCheck, Mail, KeyRound, Calendar, Pencil, Check, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'

export function UserProfileCard() {
  const { user, updateDisplayName } = useAuth()

  const fullName =
    (user?.user_metadata?.full_name as string) ??
    (user?.user_metadata?.name as string) ??
    'Coordinador Académico'
  const email = user?.email ?? 'correo@institucion.edu'
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const provider = user?.app_metadata?.provider ?? 'google'
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Reciente'

  const [isEditing, setIsEditing] = useState(false)
  const [nameValue, setNameValue] = useState(fullName)
  const [isSaving, setIsSaving] = useState(false)

  const handleStartEdit = () => {
    setNameValue(fullName)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setNameValue(fullName)
    setIsEditing(false)
  }

  const handleSaveName = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = nameValue.trim()
    if (!trimmed) {
      toast.error('El nombre no puede estar vacío')
      return
    }

    setIsSaving(true)
    try {
      await updateDisplayName(trimmed)
      toast.success('Nombre de usuario actualizado')
      setIsEditing(false)
    } catch (err) {
      toast.error('Error al actualizar el nombre')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl p-5">
      <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/20 shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-sm font-bold text-xl">
              {fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <span
            className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-base-100 flex items-center justify-center"
            title="Cuenta activa"
          >
            <ShieldCheck className="w-3 h-3 text-white" />
          </span>
        </div>

        {/* Datos Principales */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isEditing ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-1.5 flex-wrap">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="input input-xs input-bordered rounded-lg text-xs font-semibold w-56"
                  autoFocus
                  placeholder="Tu nombre completo"
                />
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary btn-xs btn-circle"
                  title="Guardar nombre"
                >
                  {isSaving ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-ghost btn-xs btn-circle"
                  title="Cancelar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-base-content tracking-tight truncate">
                  {fullName}
                </h3>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="btn btn-ghost btn-xs btn-circle opacity-60 hover:opacity-100 transition-opacity"
                  title="Editar nombre de usuario"
                >
                  <Pencil className="w-3.5 h-3.5 text-base-content/70" />
                </button>
              </div>
            )}

            <span className="badge badge-sm badge-primary font-semibold">
              Coordinador
            </span>
            <span className="badge badge-sm badge-outline text-[11px] uppercase font-semibold text-base-content/60">
              {provider} OAuth
            </span>
          </div>

          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-base-content/70">
            <div className="flex items-center gap-1.5 truncate">
              <Mail className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
              <span className="truncate">{email}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <Calendar className="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
              <span>Miembro desde {createdAt}</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-base-200/80 flex items-center justify-between gap-2 text-[11px] text-base-content/40 truncate">
            <div className="flex items-center gap-1.5 truncate font-mono">
              <KeyRound className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">ID: {user?.id}</span>
            </div>
            <span className="text-[10px] text-base-content/40 italic">
              Editable localmente
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
