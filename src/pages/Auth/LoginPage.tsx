// ============================================================
//  src/pages/Auth/LoginPage.tsx
// ============================================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { authApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import type { LoginRequest } from '../../types'
import { Spinner } from '../../components/common/Spinner'
import { BoltIcon } from '@heroicons/react/24/solid'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>()

  const onSubmit = async (data: LoginRequest) => {
    setLoading(true)
    try {
      const res = await authApi.login(data)
      login(res)
      toast.success(`Welcome, ${res.fullName}!`)
      navigate('/', { replace: true })
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-800 to-brand-900 p-4">
      <div className="w-full max-w-sm">
        {/* Logo card */}
        <div className="mb-6 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 mb-3">
            <BoltIcon className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">CMT</h1>
          <p className="text-brand-200 text-sm mt-1">Electrical Spare Parts & Repair Shop</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <h2 className="mb-6 text-center text-xl font-semibold text-gray-800">Sign In</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="admin@cmt.local"
                className="input"
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="input"
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
              {loading ? <Spinner size="sm" /> : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-brand-300">
          © {new Date().getFullYear()} CMT Electrical Shop
        </p>
      </div>
    </div>
  )
}
