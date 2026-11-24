// ============================================================
//  src/pages/RepairTickets/TicketsPage.tsx
// ============================================================
import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ticketsApi, customersApi } from '../../api'
import type { TicketSummaryDto, TicketStatus, CustomerDto, CreateTicketRequest, UpdateTicketRequest } from '../../types'
import { formatDate, formatINR } from '../../utils/format'
import { Modal } from '../../components/common/Modal'
import { PageLoader, Spinner } from '../../components/common/Spinner'
import { EmptyState } from '../../components/common/EmptyState'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon } from '@heroicons/react/24/outline'

const STATUSES: TicketStatus[] = [
  'Received','In Repair','Waiting for Parts','Ready for Pickup','Billed','Cancelled',
]

// ── Ticket Form Modal ───────────────────────────────────────
function TicketModal({ ticket, customers, open, onClose, onDone }: {
  ticket: TicketSummaryDto | null; customers: CustomerDto[];
  open: boolean; onClose: () => void; onDone: () => void;
}) {
  const isEdit = !!ticket
  type FormData = CreateTicketRequest & UpdateTicketRequest
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (ticket) {
      reset({
        deviceName: ticket.deviceName,
        reportedIssue: '',
        estimatedCost: ticket.estimatedCost,
        expectedDeliveryDate: ticket.expectedDeliveryDate?.slice(0,10),
      })
    } else {
      reset({})
    }
  }, [ticket, reset])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      if (isEdit && ticket) {
        await ticketsApi.update(ticket.id, data as UpdateTicketRequest)
        toast.success('Ticket updated.')
      } else {
        await ticketsApi.create(data as CreateTicketRequest)
        toast.success('Ticket created.')
      }
      onDone(); onClose()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed.') }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Ticket' : 'New Repair Ticket'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
            <select className="input" {...register('customerId', { required: true, valueAsNumber: true })}>
              <option value="">— Select customer —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.fullName} · {c.phone}</option>)}
            </select>
            {errors.customerId && <p className="text-xs text-red-500 mt-1">Customer required</p>}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Device Name *</label>
            <input className="input" placeholder="e.g. Bosch Angle Grinder 4&quot;"
              {...register('deviceName', { required: 'Device name required' })} />
            {errors.deviceName && <p className="text-xs text-red-500 mt-1">{errors.deviceName.message}</p>}
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reported Issue *</label>
            <textarea rows={3} className="input resize-none" placeholder="Describe the fault…"
              {...register('reportedIssue', { required: 'Issue description required' })} />
            {errors.reportedIssue && <p className="text-xs text-red-500 mt-1">{errors.reportedIssue.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost (₹)</label>
            <input type="number" step="0.01" min={0} className="input"
              {...register('estimatedCost', { valueAsNumber: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label>
            <input type="date" className="input" {...register('expectedDeliveryDate')} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} className="input resize-none" {...register('notes')} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Spinner size="sm" /> : (isEdit ? 'Save Changes' : 'Create Ticket')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Main Page ───────────────────────────────────────────────
export default function TicketsPage() {
  const navigate = useNavigate()
  const [tickets,   setTickets]   = useState<TicketSummaryDto[]>([])
  const [customers, setCustomers] = useState<CustomerDto[]>([])
  const [loading,   setLoading]   = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [editTicket, setEditTicket] = useState<TicketSummaryDto | null>(null)
  const [showForm,   setShowForm]   = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      ticketsApi.getAll(statusFilter || undefined),
      customersApi.getAll(),
    ]).then(([t, c]) => { setTickets(t); setCustomers(c) })
      .catch(() => toast.error('Failed to load tickets.'))
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await ticketsApi.updateStatus(id, status)
      toast.success(`Status updated to "${status}"`)
      load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed.') }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-gray-900">Repair Tickets</h1>
        <button onClick={() => { setEditTicket(null); setShowForm(true) }} className="btn-primary">
          <PlusIcon className="h-4 w-4" /> New Ticket
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {['', ...STATUSES].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              statusFilter === s
                ? 'bg-brand-700 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Ticket #','Customer','Device','Status','Received','Expected','Est. Cost','Actions'].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tickets.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="table-td">
                      <Link to={`/tickets/${t.id}`} className="font-medium text-brand-700 hover:underline">
                        {t.ticketNumber}
                      </Link>
                    </td>
                    <td className="table-td">{t.customerName}<br/><span className="text-xs text-gray-400">{t.customerPhone}</span></td>
                    <td className="table-td">{t.deviceName}</td>
                    <td className="table-td">
                      <select
                        value={t.status}
                        disabled={t.status === 'Billed' || t.status === 'Cancelled'}
                        onChange={e => handleStatusChange(t.id, e.target.value)}
                        className="rounded border border-gray-200 px-1.5 py-0.5 text-xs focus:ring-1 focus:ring-brand-500 disabled:opacity-60"
                      >
                        {STATUSES.filter(s => s !== 'Billed').map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="table-td">{formatDate(t.receivedDate)}</td>
                    <td className="table-td">{formatDate(t.expectedDeliveryDate)}</td>
                    <td className="table-td">{t.estimatedCost ? formatINR(t.estimatedCost) : '—'}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditTicket(t); setShowForm(true) }}
                          className="text-xs text-brand-700 hover:underline">Edit</button>
                        {t.status === 'Ready for Pickup' && (
                          <button onClick={() => navigate('/billing', { state: { ticketId: t.id } })}
                            className="text-xs font-medium text-green-700 hover:underline">
                            Convert to Bill →
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tickets.length === 0 && <EmptyState message="No tickets found." />}
          </div>
        )}
      </div>

      <TicketModal ticket={editTicket} customers={customers}
        open={showForm} onClose={() => setShowForm(false)} onDone={load} />
    </div>
  )
}
