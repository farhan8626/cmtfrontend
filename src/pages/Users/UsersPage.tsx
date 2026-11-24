// ============================================================
//  src/pages/Users/UsersPage.tsx
//  Admin-only User management & role assignment
// ============================================================
import { useEffect, useState, useCallback } from 'react'
import { usersApi } from '../../api'
import type { UserDto, CreateUserRequest, UpdateUserRequest } from '../../types'
import { formatDate } from '../../utils/format'
import { Modal } from '../../components/common/Modal'
import { PageLoader, Spinner } from '../../components/common/Spinner'
import { EmptyState } from '../../components/common/EmptyState'
import { useAuth } from '../../context/AuthContext'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, MagnifyingGlassIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

function UserModal({
  user,
  open,
  onClose,
  onDone,
}: {
  user: UserDto | null
  open: boolean
  onClose: () => void
  onDone: () => void
}) {
  const isEdit = !!user
  type FormData = CreateUserRequest & { isActive?: boolean }
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        password: '',
      })
    } else {
      reset({
        fullName: '',
        email: '',
        role: 'Staff',
        isActive: true,
        password: '',
      })
    }
  }, [user, reset])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      if (isEdit && user) {
        await usersApi.update(user.id, {
          fullName: data.fullName,
          email: data.email,
          role: data.role,
          isActive: data.isActive ?? true,
        } as UpdateUserRequest)
        toast.success('User updated successfully.')
      } else {
        await usersApi.create({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          role: data.role,
        })
        toast.success('User created successfully.')
      }
      onDone()
      onClose()
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Operation failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit User' : 'Add New User'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            className="input"
            placeholder="e.g. Ramesh Kumar"
            {...register('fullName', { required: 'Name is required' })}
          />
          {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
          <input
            type="email"
            className="input"
            placeholder="user@cmt.local"
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              className="input"
              placeholder="Min 6 characters"
              {...register('password', {
                required: !isEdit ? 'Password is required' : false,
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
          <select className="input" {...register('role', { required: true })}>
            <option value="Staff">Staff (Billing, Tickets, Inventory)</option>
            <option value="Admin">Admin (Full Control + User & Service Mgmt)</option>
          </select>
        </div>

        {isEdit && (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActiveUser"
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              {...register('isActive')}
            />
            <label htmlFor="isActiveUser" className="text-sm font-medium text-gray-700 select-none">
              Account Active (able to log in)
            </label>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Spinner size="sm" /> : isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editUser, setEditUser] = useState<UserDto | null>(null)
  const [showModal, setShowModal] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    usersApi.getAll()
      .then(setUsers)
      .catch(() => toast.error('Failed to load users.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = users.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">User Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Control staff logins, roles, and administrative access</p>
        </div>
        <button
          onClick={() => {
            setEditUser(null)
            setShowModal(true)
          }}
          className="btn-primary"
        >
          <PlusIcon className="h-4 w-4" /> Add User
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Search by name, email, or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <PageLoader />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Name & Email', 'Role', 'Status', 'Registered Date', 'Actions'].map((h) => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => {
                  const isSelf = currentUser?.id === u.id
                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 font-bold">
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {u.fullName} {isSelf && <span className="text-xs text-brand-600 font-normal">(You)</span>}
                            </p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-td">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            u.role === 'Admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {u.role === 'Admin' && <ShieldCheckIcon className="h-3.5 w-3.5" />}
                          {u.role}
                        </span>
                      </td>
                      <td className="table-td">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="table-td text-gray-500">{formatDate(u.createdAt)}</td>
                      <td className="table-td">
                        <button
                          onClick={() => {
                            setEditUser(u)
                            setShowModal(true)
                          }}
                          className="text-xs text-brand-700 hover:underline font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <EmptyState message="No users found." />}
          </div>
        )}
      </div>

      <UserModal
        user={editUser}
        open={showModal}
        onClose={() => setShowModal(false)}
        onDone={load}
      />
    </div>
  )
}
