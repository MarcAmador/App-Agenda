import { useEffect, useState } from 'react'
import { adminService, type AdminUser } from '@/services/admin.service'
import {
  Users,
  Search,
  ShieldAlert,
  UserCheck,
  UserX,
  Trash2,
  RotateCcw,
  Eye,
  AlertTriangle,
  Mail,
  Layers,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modales
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null)
  const [userToStatus, setUserToStatus] = useState<{ user: AdminUser; newStatus: 'active' | 'suspended' } | null>(null)
  const [userRoleUpdate, setUserRoleUpdate] = useState<{ user: AdminUser; newRole: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadUsers = async () => {
    try {
      setLoading(true)
      const res = await adminService.getUsers({
        search: search.trim() || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      })
      setUsers(res.users)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Error cargando usuarios: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers()
    }, 250)
    return () => clearTimeout(timer)
  }, [search, roleFilter, statusFilter])

  const handleRoleChangeConfirm = async () => {
    if (!userRoleUpdate) return
    try {
      setActionLoading(true)
      await adminService.updateUserRole(userRoleUpdate.user.id, userRoleUpdate.newRole)
      toast.success(`Rol actualizado a "${userRoleUpdate.newRole}" exitosamente.`)
      setUserRoleUpdate(null)
      loadUsers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Error al actualizar rol: ${msg}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleStatusChangeConfirm = async () => {
    if (!userToStatus) return
    try {
      setActionLoading(true)
      await adminService.updateUserStatus(userToStatus.user.id, userToStatus.newStatus)
      toast.success(
        userToStatus.newStatus === 'suspended'
          ? 'Usuario suspendido de la plataforma.'
          : 'Usuario reactivado con éxito.'
      )
      setUserToStatus(null)
      loadUsers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Error cambiando estado: ${msg}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleResetSessions = async (user: AdminUser) => {
    try {
      await adminService.resetUserSessions(user.id)
      toast.success(`Sesiones revocadas para ${user.email}.`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Error revocando sesiones: ${msg}`)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return
    try {
      setActionLoading(true)
      await adminService.deleteUser(userToDelete.id)
      toast.success(`Usuario ${userToDelete.email} eliminado permanentemente.`)
      setUserToDelete(null)
      loadUsers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Error eliminando usuario: ${msg}`)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* ─── Encabezado ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            Gestión de Usuarios y Roles
            <Users className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            Administración centralizada de cuentas docentes, permisos de acceso, suspensión y trazabilidad.
          </p>
        </div>
      </div>

      {/* ─── Barra de Filtros y Búsqueda ─────────────────────────────────────── */}
      <div className="card bg-base-100 border border-base-300 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Buscador */}
          <div className="relative">
            <Search className="w-4 h-4 text-base-content/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-bordered input-sm w-full pl-9"
            />
          </div>

          {/* Filtro por Rol */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="select select-bordered select-sm w-full"
          >
            <option value="all">Todos los Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="support">Support</option>
            <option value="user">User (Docente)</option>
          </select>

          {/* Filtro por Estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select select-bordered select-sm w-full"
          >
            <option value="all">Todos los Estados</option>
            <option value="active">Activos</option>
            <option value="suspended">Suspendidos</option>
          </select>
        </div>
      </div>

      {/* ─── Tabla de Usuarios (DaisyUI Table) ────────────────────────────────── */}
      <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200/80 text-xs font-bold uppercase tracking-wider text-base-content/70">
                <th>Usuario</th>
                <th>Proveedor</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Tareas</th>
                <th>Último Acceso</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-primary"></span>
                    <p className="text-xs text-base-content/60 mt-2">Cargando directorio de usuarios...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-base-content/50 text-sm">
                    No se encontraron usuarios que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover">
                    {/* Usuario */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="mask mask-squircle w-10 h-10 bg-base-300">
                            <img
                              src={
                                u.avatarUrl ||
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${u.email}`
                              }
                              alt={u.fullName}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-sm">{u.fullName}</div>
                          <div className="text-xs text-base-content/60 font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Proveedor */}
                    <td>
                      {u.provider === 'google' ? (
                        <span className="badge badge-sm badge-outline gap-1 font-semibold border-primary/40 text-primary">
                          <span className="font-black text-xs">G</span> Google OAuth
                        </span>
                      ) : (
                        <span className="badge badge-sm badge-outline gap-1 font-semibold border-base-content/30">
                          <Mail className="w-3 h-3" /> Email/Password
                        </span>
                      )}
                    </td>

                    {/* Rol */}
                    <td>
                      <select
                        value={u.role}
                        disabled={u.role === 'super_admin'}
                        onChange={(e) => setUserRoleUpdate({ user: u, newRole: e.target.value })}
                        className={`select select-xs font-bold rounded-lg ${
                          u.role === 'super_admin'
                            ? 'bg-primary text-primary-content border-none font-extrabold cursor-not-allowed'
                            : u.role === 'admin'
                            ? 'bg-secondary/20 text-secondary border-secondary/30'
                            : u.role === 'support'
                            ? 'bg-accent/20 text-accent border-accent/30'
                            : 'bg-base-200 border-base-300'
                        }`}
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="admin">Admin</option>
                        <option value="support">Support</option>
                        <option value="user">User</option>
                      </select>
                    </td>

                    {/* Estado */}
                    <td>
                      {u.status === 'suspended' ? (
                        <span className="badge badge-error badge-sm font-semibold gap-1">
                          <UserX className="w-3 h-3" /> Suspendido
                        </span>
                      ) : (
                        <span className="badge badge-success badge-sm font-semibold gap-1">
                          <UserCheck className="w-3 h-3" /> Activo
                        </span>
                      )}
                    </td>

                    {/* Tareas creadas */}
                    <td>
                      <span className="font-semibold text-xs flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        {u.tasksCount}
                      </span>
                    </td>

                    {/* Último login */}
                    <td className="text-xs text-base-content/70">
                      {u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleDateString() : 'Nunca'}
                    </td>

                    {/* Acciones */}
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Ver detalles */}
                        <button
                          onClick={() => setSelectedUser(u)}
                          title="Ver actividad y detalles"
                          className="btn btn-ghost btn-xs btn-square"
                        >
                          <Eye className="w-4 h-4 text-primary" />
                        </button>

                        {/* Suspender / Reactivar */}
                        {u.role !== 'super_admin' && (
                          <button
                            onClick={() =>
                              setUserToStatus({
                                user: u,
                                newStatus: u.status === 'suspended' ? 'active' : 'suspended',
                              })
                            }
                            title={u.status === 'suspended' ? 'Reactivar cuenta' : 'Suspender cuenta'}
                            className="btn btn-ghost btn-xs btn-square text-warning"
                          >
                            {u.status === 'suspended' ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          </button>
                        )}

                        {/* Resetear sesiones */}
                        <button
                          onClick={() => handleResetSessions(u)}
                          title="Cerrar sesiones remotas"
                          className="btn btn-ghost btn-xs btn-square text-info"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        {/* Eliminar */}
                        {u.role !== 'super_admin' && (
                          <button
                            onClick={() => setUserToDelete(u)}
                            title="Eliminar usuario permanentemente"
                            className="btn btn-ghost btn-xs btn-square text-error"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal de Inspección / Actividad de Usuario ───────────────────────── */}
      {selectedUser && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg border border-base-300">
            <h3 className="font-extrabold text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Detalle de Usuario & Actividad
            </h3>

            <div className="mt-4 flex items-center gap-4 p-4 rounded-2xl bg-base-200">
              <div className="avatar">
                <div className="mask mask-squircle w-14 h-14">
                  <img
                    src={selectedUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedUser.email}`}
                    alt={selectedUser.fullName}
                  />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-base">{selectedUser.fullName}</h4>
                <p className="text-xs text-base-content/70 font-mono">{selectedUser.email}</p>
                <div className="flex gap-2 mt-1">
                  <span className="badge badge-sm badge-primary uppercase font-bold">{selectedUser.role}</span>
                  <span className={`badge badge-sm font-semibold ${selectedUser.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                    {selectedUser.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
              <div className="p-3 rounded-xl bg-base-200/60 border border-base-300">
                <span className="text-base-content/60 block">ID de Usuario:</span>
                <span className="font-mono text-[11px] truncate block font-semibold">{selectedUser.id}</span>
              </div>
              <div className="p-3 rounded-xl bg-base-200/60 border border-base-300">
                <span className="text-base-content/60 block">Proveedor Auth:</span>
                <span className="font-semibold uppercase">{selectedUser.provider}</span>
              </div>
              <div className="p-3 rounded-xl bg-base-200/60 border border-base-300">
                <span className="text-base-content/60 block">Tareas Registradas:</span>
                <span className="font-bold text-sm text-primary">{selectedUser.tasksCount} tareas</span>
              </div>
              <div className="p-3 rounded-xl bg-base-200/60 border border-base-300">
                <span className="text-base-content/60 block">Fecha de Registro:</span>
                <span className="font-semibold">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="modal-action mt-6">
              <button onClick={() => setSelectedUser(null)} className="btn btn-sm btn-outline">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal de Confirmación de Rol ────────────────────────────────────── */}
      {userRoleUpdate && (
        <div className="modal modal-open">
          <div className="modal-box border border-base-300">
            <h3 className="font-extrabold text-lg text-warning flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Confirmar Cambio de Rol
            </h3>
            <p className="text-sm mt-3 text-base-content/80">
              ¿Estás seguro de que deseas cambiar el rol de <strong>{userRoleUpdate.user.email}</strong> a{' '}
              <span className="badge badge-warning font-bold">{userRoleUpdate.newRole}</span>?
            </p>
            <div className="modal-action">
              <button
                onClick={() => setUserRoleUpdate(null)}
                disabled={actionLoading}
                className="btn btn-sm btn-ghost"
              >
                Cancelar
              </button>
              <button
                onClick={handleRoleChangeConfirm}
                disabled={actionLoading}
                className="btn btn-sm btn-warning gap-1.5"
              >
                {actionLoading && <span className="loading loading-spinner loading-xs"></span>}
                Confirmar Rol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal de Confirmación de Suspensión / Reactivación ──────────────── */}
      {userToStatus && (
        <div className="modal modal-open">
          <div className="modal-box border border-base-300">
            <h3 className="font-extrabold text-lg text-warning flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {userToStatus.newStatus === 'suspended' ? 'Suspender Acceso' : 'Reactivar Acceso'}
            </h3>
            <p className="text-sm mt-3 text-base-content/80">
              {userToStatus.newStatus === 'suspended'
                ? `El usuario ${userToStatus.user.email} perderá acceso al sistema y sus recordatorios programados se pausarán.`
                : `Se restaurará el acceso normal para ${userToStatus.user.email}.`}
            </p>
            <div className="modal-action">
              <button
                onClick={() => setUserToStatus(null)}
                disabled={actionLoading}
                className="btn btn-sm btn-ghost"
              >
                Cancelar
              </button>
              <button
                onClick={handleStatusChangeConfirm}
                disabled={actionLoading}
                className={`btn btn-sm ${userToStatus.newStatus === 'suspended' ? 'btn-error' : 'btn-success'} gap-1.5`}
              >
                {actionLoading && <span className="loading loading-spinner loading-xs"></span>}
                {userToStatus.newStatus === 'suspended' ? 'Suspender Usuario' : 'Reactivar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal de Confirmación de Eliminación ────────────────────────────── */}
      {userToDelete && (
        <div className="modal modal-open">
          <div className="modal-box border border-error/40">
            <h3 className="font-extrabold text-lg text-error flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Eliminar Usuario de Forma Definitiva
            </h3>
            <p className="text-sm mt-3 text-base-content/80">
              Esta acción eliminará de forma irreversible al usuario <strong>{userToDelete.email}</strong>, incluyendo todas sus tareas, recordatorios y preferencias asociadas en Supabase Auth.
            </p>
            <div className="modal-action">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={actionLoading}
                className="btn btn-sm btn-ghost"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="btn btn-sm btn-error gap-1.5"
              >
                {actionLoading && <span className="loading loading-spinner loading-xs"></span>}
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
