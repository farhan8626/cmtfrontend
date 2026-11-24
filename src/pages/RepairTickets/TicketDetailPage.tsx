// ============================================================
//  src/pages/RepairTickets/TicketDetailPage.tsx
//  Detailed ticket tracking, status pipeline, and actions
// ============================================================
import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ticketsApi } from '../../api'
import type { TicketDto, TicketStatus, UpdateTicketRequest } from '../../types'
import { formatDate, formatINR, statusBadgeClass } from '../../utils/format'
import { PageLoader, Spinner } from '../../components/common/Spinner'
import { Modal } from '../../components/common/Modal'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  ArrowLeftIcon, WrenchScrewdriverIcon, CheckCircleIcon,
  ClockIcon, UserIcon, DevicePhoneMobileIcon, PencilSquareIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline'

const PIPELINE_STATUSES: TicketStatus[] = [
  'Received', 'In Repair', 'Waiting for Parts', 'Ready for Pickup', 'Billed'
]

const STATUS_OPTIONS: TicketStatus[] = [
  'Received', 'In Repair', 'Waiting for Parts', 'Ready for Pickup', 'Cancelled'
]

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const ticketId = parseInt(id ?? '0')

  const [ticket, setTicket] = useState<TicketDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const loadTicket = useCallback(() => {
    if (!ticketId) return
    setLoading(true)
    ticketsApi.getById(ticketId)
      .then(setTicket)
      .catch(() => toast.error('Failed to load repair ticket.'))
      .finally(() => setLoading(false))
  }, [ticketId])

  useEffect(() => {
    loadTicket()
  }, [loadTicket])

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return
    setUpdatingStatus(true)
    try {
      await ticketsApi.updateStatus(ticket.id, newStatus)
      toast.success(`Status updated to ${newStatus}`)
      loadTicket()
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to update status.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Edit Ticket Modal
  const { register, handleSubmit, reset } = useForm<UpdateTicketRequest>()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (ticket) {
      reset({
        deviceName: ticket.deviceName,
        reportedIssue: ticket.reportedIssue,
        estimatedCost: ticket.estimatedCost,
        expectedDeliveryDate: ticket.expectedDeliveryDate ? ticket.expectedDeliveryDate.slice(0, 10) : '',
        notes: ticket.notes || '',
      })
    }
  }, [ticket, reset])

  const onSaveEdit = async (data: UpdateTicketRequest) => {
    if (!ticket) return
    setSaving(true)
    try {
      await ticketsApi.update(ticket.id, data)
      toast.success('Ticket details updated.')
      setShowEditModal(false)
      loadTicket()
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to update ticket.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />
  if (!ticket) {
    return (
      <div className="card text-center py-12 space-y-3">
        <p className="text-gray-500">Ticket not found.</p>
        <Link to="/tickets" className="btn-secondary text-xs">
          <ArrowLeftIcon className="h-4 w-4" /> Back to Tickets
        </Link>
      </div>
    )
  }

  const currentIdx = PIPELINE_STATUSES.indexOf(ticket.status as TicketStatus)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link to="/tickets" className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline mb-1">
            <ArrowLeftIcon className="h-3.5 w-3.5" /> All Tickets
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{ticket.ticketNumber}</h1>
            <span className={statusBadgeClass(ticket.status)}>{ticket.status}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Received on {formatDate(ticket.receivedDate)} · Created by {ticket.createdByName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {ticket.status !== 'Billed' && ticket.status !== 'Cancelled' && (
            <button
              onClick={() => setShowEditModal(true)}
              className="btn-secondary text-xs px-3 py-2"
            >
              <PencilSquareIcon className="h-4 w-4" /> Edit Details
            </button>
          )}

          {ticket.status === 'Ready for Pickup' && (
            <button
              onClick={() => navigate('/billing', { state: { ticketId: ticket.id } })}
              className="btn-primary bg-green-600 hover:bg-green-700 text-xs px-3 py-2"
            >
              <DocumentCheckIcon className="h-4 w-4" /> Convert to Bill →
            </button>
          )}

          {ticket.status === 'Billed' && ticket.invoiceId && (
            <Link
              to={`/invoices/${ticket.invoiceId}`}
              className="btn-primary text-xs px-3 py-2"
            >
              View Invoice ({ticket.invoiceNumber}) →
            </Link>
          )}
        </div>
      </div>

      {/* Visual Status Pipeline */}
      {ticket.status !== 'Cancelled' && (
        <div className="card p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Repair Workflow Progress</h2>
          <div className="relative">
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100">
              <div
                style={{ width: `${Math.max(10, ((currentIdx + 1) / PIPELINE_STATUSES.length) * 100)}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand-600 transition-all duration-500"
              />
            </div>
            <div className="grid grid-cols-5 text-center text-xs">
              {PIPELINE_STATUSES.map((step, idx) => {
                const isPassed = currentIdx >= idx
                const isCurrent = currentIdx === idx
                return (
                  <div key={step} className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-colors ${
                        isCurrent
                          ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                          : isPassed
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </div>
                    <span className={`text-[11px] font-medium ${isCurrent ? 'text-brand-700 font-semibold' : 'text-gray-500'}`}>
                      {step}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick status update control */}
          {ticket.status !== 'Billed' && (
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">Change Status:</span>
              <div className="flex items-center gap-2">
                <select
                  disabled={updatingStatus}
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {updatingStatus && <Spinner size="sm" />}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Device & Issue (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          <div className="card space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <DevicePhoneMobileIcon className="h-5 w-5 text-brand-600" />
              <h2 className="font-semibold text-gray-900">Device & Fault Information</h2>
            </div>

            <div>
              <p className="text-xs text-gray-500">Device Name / Model</p>
              <p className="text-base font-medium text-gray-900 mt-0.5">{ticket.deviceName}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Reported Issue</p>
              <div className="mt-1 p-3 bg-red-50/50 rounded-lg border border-red-100 text-sm text-gray-800 whitespace-pre-wrap">
                {ticket.reportedIssue}
              </div>
            </div>

            {ticket.notes && (
              <div>
                <p className="text-xs text-gray-500">Technician / Shop Notes</p>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                  {ticket.notes}
                </div>
              </div>
            )}
          </div>

          {/* Delivery & Timeline */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <ClockIcon className="h-5 w-5 text-brand-600" />
              <h2 className="font-semibold text-gray-900">Timeline & Dates</h2>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Received Date</p>
                <p className="font-medium text-gray-800 mt-0.5">{formatDate(ticket.receivedDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Expected Delivery</p>
                <p className="font-medium text-gray-800 mt-0.5">
                  {ticket.expectedDeliveryDate ? formatDate(ticket.expectedDeliveryDate) : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Completed Date</p>
                <p className="font-medium text-gray-800 mt-0.5">
                  {ticket.completedDate ? formatDate(ticket.completedDate) : 'Pending'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar info (1 col) */}
        <div className="space-y-6">
          {/* Customer Card */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <UserIcon className="h-5 w-5 text-brand-600" />
              <h2 className="font-semibold text-gray-900">Customer Details</h2>
            </div>
            <div>
              <Link
                to={`/customers/${ticket.customerId}`}
                className="font-bold text-brand-700 hover:underline text-base"
              >
                {ticket.customerName}
              </Link>
              <p className="text-sm text-gray-600 mt-0.5">📞 {ticket.customerPhone}</p>
            </div>
            <Link
              to={`/customers/${ticket.customerId}`}
              className="text-xs text-brand-600 hover:underline inline-block pt-1"
            >
              View Customer History →
            </Link>
          </div>

          {/* Financial summary */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <WrenchScrewdriverIcon className="h-5 w-5 text-brand-600" />
              <h2 className="font-semibold text-gray-900">Repair Estimate</h2>
            </div>
            <div>
              <p className="text-xs text-gray-500">Estimated Cost</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">
                {ticket.estimatedCost ? formatINR(ticket.estimatedCost) : '₹0.00'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Non-GST estimated repair & labor charges</p>
            </div>

            {ticket.status === 'Billed' && ticket.invoiceNumber && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-1 font-semibold text-green-800">
                  <CheckCircleIcon className="h-4 w-4" /> Billed Successfully
                </div>
                <p className="text-green-700">Invoice: {ticket.invoiceNumber}</p>
                <Link to={`/invoices/${ticket.invoiceId}`} className="text-brand-700 underline font-medium block">
                  Open Invoice Bill
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Ticket Modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Ticket – ${ticket.ticketNumber}`}
        size="md"
      >
        <form onSubmit={handleSubmit(onSaveEdit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Device Name *</label>
            <input className="input" {...register('deviceName', { required: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reported Issue *</label>
            <textarea rows={3} className="input resize-none" {...register('reportedIssue', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                className="input"
                {...register('estimatedCost', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label>
              <input type="date" className="input" {...register('expectedDeliveryDate')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} className="input resize-none" {...register('notes')} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Spinner size="sm" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
export default TicketDetailPage
