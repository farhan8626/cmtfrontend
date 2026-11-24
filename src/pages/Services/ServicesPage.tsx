// ============================================================
//  src/pages/Services/ServicesPage.tsx
//  Admin-only Repair Services management (base charges in ₹)
// ============================================================
import { useEffect, useState, useCallback } from 'react'
import { servicesApi } from '../../api'
import type { RepairServiceDto, CreateRepairServiceRequest, UpdateRepairServiceRequest } from '../../types'
import { formatINR } from '../../utils/format'
import { Modal } from '../../components/common/Modal'
import { PageLoader, Spinner } from '../../components/common/Spinner'
import { EmptyState } from '../../components/common/EmptyState'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, MagnifyingGlassIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline'

function ServiceModal({
  service,
  open,
  onClose,
  onDone,
}: {
  service: RepairServiceDto | null
  open: boolean
  onClose: () => void
  onDone: () => void
}) {
  const isEdit = !!service
  type FormData = CreateRepairServiceRequest & { isActive?: boolean }
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (service) {
      reset({
        serviceName: service.serviceName,
        description: service.description || '',
        baseCharge: service.baseCharge,
        isActive: service.isActive,
      })
    } else {
      reset({
        serviceName: '',
        description: '',
        baseCharge: 0,
        isActive: true,
      })
    }
  }, [service, reset])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      if (isEdit && service) {
        await servicesApi.update(service.id, {
          serviceName: data.serviceName,
          description: data.description,
          baseCharge: data.baseCharge,
          isActive: data.isActive ?? true,
        } as UpdateRepairServiceRequest)
        toast.success('Service updated.')
      } else {
        await servicesApi.create({
          serviceName: data.serviceName,
          description: data.description,
          baseCharge: data.baseCharge,
        })
        toast.success('Repair service created.')
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
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Repair Service' : 'Add Repair Service'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
          <input
            className="input"
            placeholder="e.g. Motor Rewinding (1HP), Armature Turning"
            {...register('serviceName', { required: 'Service name is required' })}
          />
          {errors.serviceName && <p className="text-xs text-red-500 mt-1">{errors.serviceName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Base Charge (₹) *</label>
          <input
            type="number"
            step="0.01"
            min={0}
            className="input"
            {...register('baseCharge', { required: 'Base charge required', valueAsNumber: true })}
          />
          {errors.baseCharge && <p className="text-xs text-red-500 mt-1">{errors.baseCharge.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows={3}
            className="input resize-none"
            placeholder="Details of what this repair work includes…"
            {...register('description')}
          />
        </div>

        {isEdit && (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActive"
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              {...register('isActive')}
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 select-none">
              Active Service (available in billing & repair tickets)
            </label>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Spinner size="sm" /> : isEdit ? 'Save Changes' : 'Create Service'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function ServicesPage() {
  const [services, setServices] = useState<RepairServiceDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  const [editService, setEditService] = useState<RepairServiceDto | null>(null)
  const [showModal, setShowModal] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    servicesApi.getAll(showActiveOnly)
      .then(setServices)
      .catch(() => toast.error('Failed to load repair services.'))
      .finally(() => setLoading(false))
  }, [showActiveOnly])

  useEffect(() => {
    load()
  }, [load])

  const filtered = services.filter((s) =>
    s.serviceName.toLowerCase().includes(search.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Repair Services</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage standard labor charges and electrical repair service offerings</p>
        </div>
        <button
          onClick={() => {
            setEditService(null)
            setShowModal(true)
          }}
          className="btn-primary"
        >
          <PlusIcon className="h-4 w-4" /> Add Service
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search service name or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-gray-600 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={showActiveOnly}
            onChange={(e) => setShowActiveOnly(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          Show Active Only
        </label>
      </div>

      {/* Services Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <PageLoader />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Service Name', 'Description', 'Base Charge (₹)', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-50 text-brand-700">
                          <WrenchScrewdriverIcon className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-gray-900">{s.serviceName}</span>
                      </div>
                    </td>
                    <td className="table-td text-gray-500 max-w-md truncate">
                      {s.description || '—'}
                    </td>
                    <td className="table-td font-bold text-gray-900">
                      {formatINR(s.baseCharge)}
                    </td>
                    <td className="table-td">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-td">
                      <button
                        onClick={() => {
                          setEditService(s)
                          setShowModal(true)
                        }}
                        className="text-xs text-brand-700 hover:underline font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <EmptyState message="No repair services found." />}
          </div>
        )}
      </div>

      <ServiceModal
        service={editService}
        open={showModal}
        onClose={() => setShowModal(false)}
        onDone={load}
      />
    </div>
  )
}
