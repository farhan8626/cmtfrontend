// ============================================================
//  src/pages/Invoice/InvoicesListPage.tsx + InvoiceDetailPage.tsx
// ============================================================
import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { invoicesApi } from '../../api'
import type { InvoiceSummaryDto } from '../../types'
import { formatDate, formatINR, paymentBadgeClass } from '../../utils/format'
import { PageLoader } from '../../components/common/Spinner'
import { EmptyState } from '../../components/common/EmptyState'
import toast from 'react-hot-toast'

export function InvoicesListPage() {
  const [invoices, setInvoices] = useState<InvoiceSummaryDto[]>([])
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)

  const load = useCallback(() => {
    setLoading(true)
    invoicesApi.getAll({ page, pageSize: 25 })
      .then(setInvoices)
      .catch(() => toast.error('Failed to load invoices.'))
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Invoices</h1>
        <Link to="/billing" className="btn-primary"><span>+ New Invoice</span></Link>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['Invoice #','Date','Customer','Ticket','Amount','Status','Method'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="table-td">
                      <Link to={`/invoices/${inv.id}`} className="font-medium text-brand-700 hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="table-td">{formatDate(inv.invoiceDate)}</td>
                    <td className="table-td">{inv.customerName}</td>
                    <td className="table-td text-xs text-gray-400">{inv.ticketNumber ?? '—'}</td>
                    <td className="table-td font-medium">{formatINR(inv.grandTotal)}</td>
                    <td className="table-td"><span className={paymentBadgeClass(inv.paymentStatus)}>{inv.paymentStatus}</span></td>
                    <td className="table-td text-gray-500">{inv.paymentMethod ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {invoices.length === 0 && <EmptyState message="No invoices yet." />}
          </div>
        )}
      </div>
      {invoices.length === 25 && (
        <div className="text-center">
          <button onClick={() => setPage(p => p + 1)} className="btn-secondary">Load more</button>
        </div>
      )}
    </div>
  )
}
