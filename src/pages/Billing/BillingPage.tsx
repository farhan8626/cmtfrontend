// ============================================================
//  src/pages/Billing/BillingPage.tsx
//  Hybrid Non-GST billing screen:
//  – Load from Repair Ticket (via navigate state) or fresh
//  – Add Spare Parts (live stock validation) + Repair Services
//  – SubTotal, Discount, Grand Total in ₹ (no tax)
//  – Submits via sp_CreateInvoiceWithStockUpdate
// ============================================================
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { customersApi, productsApi, servicesApi, ticketsApi, invoicesApi } from '../../api'
import type {
  CustomerDto, ProductDto, RepairServiceDto, TicketDto,
  InvoiceItemRequest, CreateInvoiceRequest,
} from '../../types'
import { formatINR } from '../../utils/format'
import { PageLoader, Spinner } from '../../components/common/Spinner'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline'

interface LineItem extends InvoiceItemRequest { key: number }

let _key = 0
const nextKey = () => ++_key

export default function BillingPage() {
  useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const preTicketId: number | undefined = (location.state as any)?.ticketId

  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Reference data
  const [customers, setCustomers] = useState<CustomerDto[]>([])
  const [products,  setProducts]  = useState<ProductDto[]>([])
  const [services,  setServices]  = useState<RepairServiceDto[]>([])

  // Form state
  const [customerId,  setCustomerId]  = useState<number>(0)
  const [ticketId,    setTicketId]    = useState<number | undefined>(preTicketId)
  const [ticket,      setTicket]      = useState<TicketDto | null>(null)
  const [items,       setItems]       = useState<LineItem[]>([])
  const [discount,    setDiscount]    = useState(0)
  const [payStatus,   setPayStatus]   = useState('Paid')
  const [payMethod,   setPayMethod]   = useState('Cash')
  const [notes,       setNotes]       = useState('')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0,10))

  // Load reference data
  useEffect(() => {
    Promise.all([customersApi.getAll(), productsApi.getAll(), servicesApi.getAll()])
      .then(([c, p, s]) => { setCustomers(c); setProducts(p); setServices(s) })
      .catch(() => toast.error('Failed to load billing data.'))
      .finally(() => setLoading(false))
  }, [])

  // Load ticket if pre-filled from "Convert to Bill"
  useEffect(() => {
    if (!preTicketId) return
    ticketsApi.getById(preTicketId).then(t => {
      setTicket(t)
      setCustomerId(t.customerId)
      setTicketId(t.id)
      // Pre-fill estimated cost as a service line if set
      if (t.estimatedCost) {
        setItems([{ key: nextKey(), itemType: 'Service', itemName: `Repair: ${t.deviceName}`, quantity: 1, unitPrice: t.estimatedCost }])
      }
    }).catch(() => toast.error('Failed to load ticket.'))
  }, [preTicketId])

  // Computed totals
  const subTotal   = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const grandTotal = Math.max(0, subTotal - discount)

  // Add a product line
  const addProduct = (productId: number) => {
    const p = products.find(x => x.id === productId)
    if (!p) return
    setItems(prev => [...prev, {
      key: nextKey(), itemType: 'Product',
      productId: p.id, itemName: p.name,
      quantity: 1, unitPrice: p.sellingPrice,
    }])
  }

  // Add a service line
  const addService = (serviceId: number) => {
    const s = services.find(x => x.id === serviceId)
    if (!s) return
    setItems(prev => [...prev, {
      key: nextKey(), itemType: 'Service',
      serviceId: s.id, itemName: s.serviceName,
      quantity: 1, unitPrice: s.baseCharge,
    }])
  }

  const updateItem = (key: number, field: keyof LineItem, value: any) => {
    setItems(prev => prev.map(i => i.key === key ? { ...i, [field]: value } : i))
  }

  const removeItem = (key: number) => setItems(prev => prev.filter(i => i.key !== key))

  const handleSubmit = async () => {
    if (!customerId) { toast.error('Select a customer.'); return }
    if (items.length === 0) { toast.error('Add at least one item.'); return }
    if (grandTotal < 0)     { toast.error('Grand total cannot be negative.'); return }

    setSubmitting(true)
    try {
      const payload: CreateInvoiceRequest = {
        customerId, ticketId,
        invoiceDate, subTotal,
        discount, grandTotal,
        paymentStatus: payStatus,
        paymentMethod: payMethod || undefined,
        notes: notes || undefined,
        items: items.map(({ key: _k, ...rest }) => rest),
      }
      const result = await invoicesApi.create(payload)
      toast.success(`Invoice ${result.newInvoiceNumber} created!`)
      navigate(`/invoices/${result.newInvoiceId}`)
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to create invoice.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900">
        {ticket ? `Bill for Ticket ${ticket.ticketNumber}` : 'New Invoice'}
      </h1>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left: form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header info */}
          <div className="card grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
              {ticket ? (
                <p className="text-sm font-medium text-gray-800">
                  {customers.find(c => c.id === customerId)?.fullName ?? '—'}
                </p>
              ) : (
                <select className="input" value={customerId || ''} onChange={e => setCustomerId(+e.target.value)}>
                  <option value="">— Select customer —</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.fullName} · {c.phone}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
              <input type="date" className="input" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
            </div>
            {ticket && (
              <div className="col-span-2 rounded-lg bg-blue-50 p-3 text-sm">
                <span className="font-medium text-brand-700">{ticket.ticketNumber}</span>
                {' '}&mdash; {ticket.deviceName} · <span className="italic text-gray-500">{ticket.status}</span>
              </div>
            )}
          </div>

          {/* Add items */}
          <div className="card space-y-3">
            <h2 className="font-semibold text-gray-800">Line Items</h2>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <select className="input text-sm py-1.5"
                  defaultValue=""
                  onChange={e => { if (e.target.value) { addProduct(+e.target.value); e.target.value = '' } }}>
                  <option value="">+ Add Spare Part</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.stockQuantity} in stock) — {formatINR(p.sellingPrice)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <select className="input text-sm py-1.5"
                  defaultValue=""
                  onChange={e => { if (e.target.value) { addService(+e.target.value); e.target.value = '' } }}>
                  <option value="">+ Add Service</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.serviceName} — {formatINR(s.baseCharge)}</option>)}
                </select>
              </div>
              <button onClick={() => setItems(prev => [...prev, {
                key: nextKey(), itemType: 'Service', itemName: '', quantity: 1, unitPrice: 0,
              }])} className="btn-secondary text-xs py-1.5 px-3">
                <PlusIcon className="h-4 w-4" /> Custom
              </button>
            </div>

            {/* Items table */}
            {items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-2 w-6">#</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2 w-20">Qty</th>
                    <th className="pb-2 w-28">Rate (₹)</th>
                    <th className="pb-2 w-28 text-right">Total (₹)</th>
                    <th className="pb-2 w-8" />
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((item, idx) => (
                      <tr key={item.key} className="align-middle">
                        <td className="py-2 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="py-2 pr-2">
                          <input className="input py-1 text-sm"
                            value={item.itemName}
                            onChange={e => updateItem(item.key, 'itemName', e.target.value)} />
                          <span className="text-xs text-gray-400 ml-1">{item.itemType}</span>
                        </td>
                        <td className="py-2 pr-2">
                          <input type="number" min={0.001} step={0.001} className="input py-1 text-sm w-20"
                            value={item.quantity}
                            onChange={e => updateItem(item.key, 'quantity', parseFloat(e.target.value) || 0)} />
                        </td>
                        <td className="py-2 pr-2">
                          <input type="number" min={0} step={0.01} className="input py-1 text-sm w-28"
                            value={item.unitPrice}
                            onChange={e => updateItem(item.key, 'unitPrice', parseFloat(e.target.value) || 0)} />
                        </td>
                        <td className="py-2 text-right font-medium">
                          {formatINR(item.quantity * item.unitPrice)}
                        </td>
                        <td className="py-2">
                          <button onClick={() => removeItem(item.key)} className="text-red-400 hover:text-red-600">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {items.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-6">No items added yet.</p>
            )}
          </div>

          {/* Notes */}
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} className="input resize-none" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        {/* Right: totals + payment */}
        <div className="space-y-4">
          <div className="card space-y-3">
            <h2 className="font-semibold text-gray-800">Totals</h2>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sub Total</span>
              <span className="font-medium">{formatINR(subTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Discount (₹)</span>
              <input type="number" min={0} step={0.01} className="input w-28 py-1 text-sm text-right"
                value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-bold text-gray-900">Grand Total</span>
              <span className="font-bold text-brand-700 text-lg">{formatINR(grandTotal)}</span>
            </div>
          </div>

          <div className="card space-y-3">
            <h2 className="font-semibold text-gray-800">Payment</h2>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select className="input" value={payStatus} onChange={e => setPayStatus(e.target.value)}>
                {['Paid','Pending','Partial'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Method</label>
              <select className="input" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                {['Cash','UPI','Card'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={submitting || items.length === 0}
            className="btn-primary w-full justify-center py-3 text-base">
            {submitting ? <Spinner size="sm" /> : '📄 Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  )
}
