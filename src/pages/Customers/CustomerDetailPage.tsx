// ============================================================
//  src/pages/Customers/CustomerDetailPage.tsx
//  Customer profile, stats, invoice history, and repair tickets
// ============================================================
import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { customersApi, ticketsApi } from '../../api'
import type { CustomerDetailDto, InvoiceSummaryDto, TicketSummaryDto, UpdateCustomerRequest, CreateTicketRequest } from '../../types'
import { formatDate, formatINR, paymentBadgeClass, statusBadgeClass } from '../../utils/format'
import { PageLoader, Spinner } from '../../components/common/Spinner'
import { EmptyState } from '../../components/common/EmptyState'
import { Modal } from '../../components/common/Modal'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  ArrowLeftIcon, PhoneIcon, EnvelopeIcon, MapPinIcon,
  DocumentTextIcon, WrenchScrewdriverIcon, CurrencyRupeeIcon,
  PencilSquareIcon, PlusIcon,
} from '@heroicons/react/24/outline'

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const customerId = parseInt(id ?? '0')

  const [customer, setCustomer] = useState<CustomerDetailDto | null>(null)
  const [invoices, setInvoices] = useState<InvoiceSummaryDto[]>([])
  const [tickets, setTickets] = useState<TicketSummaryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'invoices' | 'tickets'>('invoices')

  // Modals
  const [showEditCustomer, setShowEditCustomer] = useState(false)
  const [showNewTicket, setShowNewTicket] = useState(false)

  const loadData = useCallback(() => {
    if (!customerId) return
    setLoading(true)
    Promise.all([
      customersApi.getById(customerId),
      customersApi.getInvoices(customerId),
      customersApi.getTickets(customerId),
    ])
      .then(([c, inv, tkt]) => {
        setCustomer(c)
        setInvoices(inv)
        setTickets(tkt)
      })
      .catch(() => toast.error('Failed to load customer profile.'))
      .finally(() => setLoading(false))
  }, [customerId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Customer Edit Form
  const { register: regCustomer, handleSubmit: handleCustomerSubmit, reset: resetCustomer } = useForm<UpdateCustomerRequest>()
  const [savingCustomer, setSavingCustomer] = useState(false)

  useEffect(() => {
    if (customer) {
      resetCustomer({
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
      })
    }
  }, [customer, resetCustomer])

  const onSaveCustomer = async (data: UpdateCustomerRequest) => {
    if (!customer) return
    setSavingCustomer(true)
    try {
      await customersApi.update(customer.id, data)
      toast.success('Customer updated.')
      setShowEditCustomer(false)
      loadData()
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to update customer.')
    } finally {
      setSavingCustomer(false)
    }
  }

  // New Ticket Form for this customer
  const { register: regTicket, handleSubmit: handleTicketSubmit, reset: resetTicket } = useForm<CreateTicketRequest>()
  const [creatingTicket, setCreatingTicket] = useState(false)

  const onCreateTicket = async (data: CreateTicketRequest) => {
    if (!customer) return
    setCreatingTicket(true)
    try {
      await ticketsApi.create({
        ...data,
        customerId: customer.id,
      })
      toast.success('Repair ticket created.')
      resetTicket({})
      setShowNewTicket(false)
      loadData()
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to create ticket.')
    } finally {
      setCreatingTicket(false)
    }
  }

  if (loading) return <PageLoader />
  if (!customer) {
    return (
      <div className="card text-center py-12 space-y-3">
        <p className="text-gray-500">Customer not found.</p>
        <Link to="/customers" className="btn-secondary text-xs">
          <ArrowLeftIcon className="h-4 w-4" /> Back to Customers
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link to="/customers" className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline mb-1">
            <ArrowLeftIcon className="h-3.5 w-3.5" /> All Customers
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{customer.fullName}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Customer since {formatDate(customer.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowEditCustomer(true)}
            className="btn-secondary text-xs px-3 py-2"
          >
            <PencilSquareIcon className="h-4 w-4" /> Edit Profile
          </button>
          <button
            onClick={() => setShowNewTicket(true)}
            className="btn-secondary text-xs px-3 py-2 text-brand-700"
          >
            <WrenchScrewdriverIcon className="h-4 w-4" /> New Ticket
          </button>
          <button
            onClick={() => navigate('/billing')}
            className="btn-primary text-xs px-3 py-2"
          >
            <PlusIcon className="h-4 w-4" /> Create Bill
          </button>
        </div>
      </div>

      {/* Profile & KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card md:col-span-1 space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <PhoneIcon className="h-4 w-4 text-gray-400 shrink-0" />
              <span>{customer.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <EnvelopeIcon className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="truncate">{customer.email || 'No email provided'}</span>
            </div>
            <div className="flex items-start gap-2 text-gray-700">
              <MapPinIcon className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <span className="text-xs leading-relaxed">{customer.address || 'No address provided'}</span>
            </div>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-brand-600">
            <DocumentTextIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-900">{customer.totalInvoices}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
            <CurrencyRupeeIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Spent</p>
            <p className="text-2xl font-bold text-gray-900">{formatINR(customer.totalSpent)}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <WrenchScrewdriverIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Repair Tickets</p>
            <p className="text-2xl font-bold text-gray-900">{customer.totalTickets}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition ${
              activeTab === 'invoices'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Invoice History ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition ${
              activeTab === 'tickets'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Repair Tickets ({tickets.length})
          </button>
        </div>

        {/* Tab 1: Invoices */}
        {activeTab === 'invoices' && (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Invoice #', 'Date', 'Ticket Ref', 'Payment', 'Method', 'Total (₹)', 'Action'].map((h) => (
                      <th key={h} className="table-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="table-td font-semibold">
                        <Link to={`/invoices/${inv.id}`} className="text-brand-700 hover:underline">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="table-td">{formatDate(inv.invoiceDate)}</td>
                      <td className="table-td text-gray-500">
                        {inv.ticketNumber ? (
                          <Link to={`/tickets/${inv.ticketId}`} className="text-brand-600 hover:underline">
                            {inv.ticketNumber}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="table-td">
                        <span className={paymentBadgeClass(inv.paymentStatus)}>{inv.paymentStatus}</span>
                      </td>
                      <td className="table-td text-gray-500">{inv.paymentMethod || '—'}</td>
                      <td className="table-td font-bold">{formatINR(inv.grandTotal)}</td>
                      <td className="table-td">
                        <Link to={`/invoices/${inv.id}`} className="text-xs text-brand-700 hover:underline">
                          View Bill →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {invoices.length === 0 && <EmptyState message="No invoices recorded for this customer." />}
            </div>
          </div>
        )}

        {/* Tab 2: Tickets */}
        {activeTab === 'tickets' && (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Ticket #', 'Device', 'Status', 'Received', 'Est. Cost', 'Action'].map((h) => (
                      <th key={h} className="table-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tickets.map((tkt) => (
                    <tr key={tkt.id} className="hover:bg-gray-50">
                      <td className="table-td font-semibold">
                        <Link to={`/tickets/${tkt.id}`} className="text-brand-700 hover:underline">
                          {tkt.ticketNumber}
                        </Link>
                      </td>
                      <td className="table-td font-medium text-gray-800">{tkt.deviceName}</td>
                      <td className="table-td">
                        <span className={statusBadgeClass(tkt.status)}>{tkt.status}</span>
                      </td>
                      <td className="table-td">{formatDate(tkt.receivedDate)}</td>
                      <td className="table-td">{tkt.estimatedCost ? formatINR(tkt.estimatedCost) : '—'}</td>
                      <td className="table-td">
                        <Link to={`/tickets/${tkt.id}`} className="text-xs text-brand-700 hover:underline">
                          Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tickets.length === 0 && <EmptyState message="No repair tickets recorded for this customer." />}
            </div>
          </div>
        )}
      </div>

      {/* Edit Customer Modal */}
      <Modal
        open={showEditCustomer}
        onClose={() => setShowEditCustomer(false)}
        title="Edit Customer"
        size="md"
      >
        <form onSubmit={handleCustomerSubmit(onSaveCustomer)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input className="input" {...regCustomer('fullName', { required: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input className="input" type="tel" {...regCustomer('phone', { required: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input className="input" type="email" {...regCustomer('email')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea rows={2} className="input resize-none" {...regCustomer('address')} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => setShowEditCustomer(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={savingCustomer} className="btn-primary">
              {savingCustomer ? <Spinner size="sm" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* New Ticket Modal */}
      <Modal
        open={showNewTicket}
        onClose={() => setShowNewTicket(false)}
        title={`New Ticket for ${customer.fullName}`}
        size="md"
      >
        <form onSubmit={handleTicketSubmit(onCreateTicket)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Device Name *</label>
            <input className="input" placeholder="e.g. 1HP Water Pump Motor" {...regTicket('deviceName', { required: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reported Issue *</label>
            <textarea rows={3} className="input resize-none" placeholder="Coil burnt, noise, etc." {...regTicket('reportedIssue', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost (₹)</label>
              <input type="number" step="0.01" min={0} className="input" {...regTicket('estimatedCost', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label>
              <input type="date" className="input" {...regTicket('expectedDeliveryDate')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} className="input resize-none" {...regTicket('notes')} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => setShowNewTicket(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={creatingTicket} className="btn-primary">
              {creatingTicket ? <Spinner size="sm" /> : 'Create Ticket'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
export default CustomerDetailPage
