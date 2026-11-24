// ============================================================
//  src/pages/Invoice/InvoiceDetailPage.tsx
//  View, print, download PDF, and email invoice
// ============================================================
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { invoicesApi } from '../../api'
import type { InvoiceDto } from '../../types'
import { formatDate, formatINR, paymentBadgeClass } from '../../utils/format'
import { PageLoader, Spinner } from '../../components/common/Spinner'
import toast from 'react-hot-toast'
import { EnvelopeIcon, ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline'

export function InvoiceDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const invoiceId = parseInt(id ?? '0')
  const [invoice,   setInvoice]   = useState<InvoiceDto | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [emailing,  setEmailing]  = useState(false)

  useEffect(() => {
    invoicesApi.getById(invoiceId)
      .then(setInvoice)
      .catch(() => toast.error('Invoice not found.'))
      .finally(() => setLoading(false))
  }, [invoiceId])

  const handleEmail = async () => {
    setEmailing(true)
    try {
      await invoicesApi.sendEmail(invoiceId)
      toast.success('Invoice emailed to customer!')
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed to send email.') }
    finally { setEmailing(false) }
  }

  if (loading)   return <PageLoader />
  if (!invoice)  return <p className="text-sm text-gray-500">Invoice not found.</p>

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/invoices" className="text-xs text-brand-600 hover:underline">← All Invoices</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">{invoice.invoiceNumber}</h1>
        </div>
        <div className="flex gap-2">
          <a href={invoicesApi.getPdfUrl(invoiceId)} target="_blank" rel="noreferrer"
            className="btn-secondary text-xs px-3 py-2">
            <ArrowDownTrayIcon className="h-4 w-4" /> PDF
          </a>
          <button onClick={() => window.print()} className="btn-secondary text-xs px-3 py-2">
            <PrinterIcon className="h-4 w-4" /> Print
          </button>
          {invoice.customerEmail && (
            <button onClick={handleEmail} disabled={emailing} className="btn-primary text-xs px-3 py-2">
              {emailing ? <Spinner size="sm" /> : <><EnvelopeIcon className="h-4 w-4" /> Email</>}
            </button>
          )}
        </div>
      </div>

      {/* Invoice card */}
      <div className="card print:shadow-none space-y-6" id="invoice-print">
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-4">
          <div>
            <p className="text-2xl font-bold text-brand-800">CMT</p>
            <p className="text-sm text-gray-500">Electrical Spare Parts & Repair Shop</p>
            <p className="text-xs text-gray-400 mt-1">Non-GST Invoice</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold text-gray-800">{invoice.invoiceNumber}</p>
            <p className="text-gray-500">{formatDate(invoice.invoiceDate)}</p>
            <span className={`mt-1 inline-block ${paymentBadgeClass(invoice.paymentStatus)}`}>
              {invoice.paymentStatus}
            </span>
            {invoice.ticketNumber && (
              <p className="text-xs text-gray-400 mt-1">
                Ticket: <Link to={`/tickets/${invoice.ticketId}`} className="text-brand-600 hover:underline">{invoice.ticketNumber}</Link>
              </p>
            )}
          </div>
        </div>

        {/* Bill to */}
        <div>
          <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Bill To</p>
          <p className="font-semibold text-gray-800">{invoice.customerName}</p>
          <p className="text-sm text-gray-500">{invoice.customerPhone}</p>
          {invoice.customerEmail   && <p className="text-sm text-gray-500">{invoice.customerEmail}</p>}
          {invoice.customerAddress && <p className="text-sm text-gray-500">{invoice.customerAddress}</p>}
        </div>

        {/* Items */}
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left">
            <th className="pb-2 text-xs font-semibold text-gray-500">#</th>
            <th className="pb-2 text-xs font-semibold text-gray-500">Description</th>
            <th className="pb-2 text-xs font-semibold text-gray-500">Type</th>
            <th className="pb-2 text-xs font-semibold text-gray-500 text-right">Qty</th>
            <th className="pb-2 text-xs font-semibold text-gray-500 text-right">Rate</th>
            <th className="pb-2 text-xs font-semibold text-gray-500 text-right">Total</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {invoice.items.map((item, idx) => (
              <tr key={item.id} className="py-2">
                <td className="py-2 text-gray-400 text-xs">{idx + 1}</td>
                <td className="py-2 font-medium text-gray-800">{item.itemName}</td>
                <td className="py-2 text-xs text-gray-400">{item.itemType}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">{formatINR(item.unitPrice)}</td>
                <td className="py-2 text-right font-medium">{formatINR(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t pt-4 flex flex-col items-end gap-1.5 text-sm">
          <div className="flex gap-8">
            <span className="text-gray-500">Sub Total</span>
            <span className="font-medium w-28 text-right">{formatINR(invoice.subTotal)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex gap-8">
              <span className="text-red-500">Discount</span>
              <span className="font-medium text-red-500 w-28 text-right">— {formatINR(invoice.discount)}</span>
            </div>
          )}
          <div className="flex gap-8 border-t pt-2">
            <span className="font-bold text-gray-900 text-base">Grand Total</span>
            <span className="font-bold text-brand-700 text-lg w-28 text-right">{formatINR(invoice.grandTotal)}</span>
          </div>
          {invoice.paymentMethod && (
            <div className="flex gap-8">
              <span className="text-gray-400 text-xs">Paid via</span>
              <span className="text-gray-600 text-xs w-28 text-right">{invoice.paymentMethod}</span>
            </div>
          )}
        </div>

        {invoice.notes && (
          <div className="border-t pt-3 text-sm text-gray-500">
            <span className="font-medium text-gray-700">Notes: </span>{invoice.notes}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 italic border-t pt-3">
          Thank you for your business! — CMT Electrical Shop
        </p>
      </div>
    </div>
  )
}
