// ============================================================
//  src/pages/Customers/CustomersPage.tsx
// ============================================================
import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { customersApi } from '../../api'
import type { CustomerDto, CreateCustomerRequest } from '../../types'
import { formatDate } from '../../utils/format'
import { Modal } from '../../components/common/Modal'
import { PageLoader, Spinner } from '../../components/common/Spinner'
import { EmptyState } from '../../components/common/EmptyState'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

function CustomerModal({ customer, open, onClose, onDone }: {
  customer: CustomerDto | null; open: boolean;
  onClose: () => void; onDone: () => void;
}) {
  const isEdit = !!customer
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateCustomerRequest>()
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (customer) reset(customer); else reset({}) }, [customer, reset])

  const onSubmit = async (data: CreateCustomerRequest) => {
    setLoading(true)
    try {
      if (isEdit && customer) {
        await customersApi.update(customer.id, data)
        toast.success('Customer updated.')
      } else {
        await customersApi.create(data)
        toast.success('Customer created.')
      }
      onDone(); onClose()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed.') }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Customer' : 'Add Customer'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input className="input" {...register('fullName', { required: 'Name required' })} />
          {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
          <input className="input" type="tel" {...register('phone', { required: 'Phone required' })} />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input className="input" type="email" {...register('email')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea rows={2} className="input resize-none" {...register('address')} />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Spinner size="sm" /> : (isEdit ? 'Save Changes' : 'Add Customer')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerDto[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [editCustomer, setEditCustomer] = useState<CustomerDto | null>(null)
  const [showForm,     setShowForm]     = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    customersApi.getAll(search || undefined)
      .then(setCustomers)
      .catch(() => toast.error('Failed to load customers.'))
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-gray-900">Customers</h1>
        <button onClick={() => { setEditCustomer(null); setShowForm(true) }} className="btn-primary">
          <PlusIcon className="h-4 w-4" /> Add Customer
        </button>
      </div>
      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input className="input pl-9" placeholder="Search name or phone…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['Name','Phone','Email','Address','Since','Actions'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="table-td">
                      <Link to={`/customers/${c.id}`} className="font-medium text-brand-700 hover:underline">{c.fullName}</Link>
                    </td>
                    <td className="table-td">{c.phone}</td>
                    <td className="table-td text-gray-500">{c.email ?? '—'}</td>
                    <td className="table-td text-gray-500 max-w-[180px] truncate">{c.address ?? '—'}</td>
                    <td className="table-td">{formatDate(c.createdAt)}</td>
                    <td className="table-td">
                      <button onClick={() => { setEditCustomer(c); setShowForm(true) }}
                        className="text-xs text-brand-700 hover:underline">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {customers.length === 0 && <EmptyState message="No customers found." />}
          </div>
        )}
      </div>
      <CustomerModal customer={editCustomer} open={showForm}
        onClose={() => setShowForm(false)} onDone={load} />
    </div>
  )
}
