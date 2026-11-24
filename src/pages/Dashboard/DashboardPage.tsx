// ============================================================
//  src/pages/Dashboard/DashboardPage.tsx
// ============================================================
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../../api'
import type { DashboardSummaryDto } from '../../types'
import { formatINR, formatDate, statusBadgeClass, paymentBadgeClass } from '../../utils/format'
import { PageLoader } from '../../components/common/Spinner'
import {
  CurrencyRupeeIcon, WrenchScrewdriverIcon,
  ExclamationTriangleIcon, CubeIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

function KpiCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub?: string;
  icon: React.ReactNode; color: string
}) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data,    setData]    = useState<DashboardSummaryDto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.getSummary()
      .then(setData)
      .catch(() => toast.error('Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />
  if (!data)   return <p className="text-sm text-gray-500">No data available.</p>

  const { kpi, recentInvoices, lowStockProducts, urgentTickets } = data

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Today's Sales"   value={formatINR(kpi.todaysSales)}
          sub={`${kpi.todaysInvoiceCount} invoice(s)`}
          icon={<CurrencyRupeeIcon className="h-5 w-5 text-green-700" />}
          color="bg-green-100" />
        <KpiCard label="Monthly Revenue" value={formatINR(kpi.monthlyRevenue)}
          sub={`${kpi.monthlyInvoiceCount} invoice(s)`}
          icon={<CurrencyRupeeIcon className="h-5 w-5 text-brand-700" />}
          color="bg-brand-100" />
        <KpiCard label="Active Repairs"  value={String(kpi.activeRepairTickets)}
          sub={`${kpi.readyForPickup} ready for pickup`}
          icon={<WrenchScrewdriverIcon className="h-5 w-5 text-yellow-700" />}
          color="bg-yellow-100" />
        <KpiCard label="Low Stock Items" value={String(kpi.lowStockItemCount)}
          sub={`${kpi.overdueTickets} overdue ticket(s)`}
          icon={<CubeIcon className="h-5 w-5 text-red-700" />}
          color="bg-red-100" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Recent Invoices</h2>
            <Link to="/invoices" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="table-th">Invoice</th>
                <th className="table-th">Customer</th>
                <th className="table-th text-right">Amount</th>
                <th className="table-th">Status</th>
              </tr></thead>
              <tbody>
                {recentInvoices.map(inv => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="table-td">
                      <Link to={`/invoices/${inv.id}`} className="font-medium text-brand-700 hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                      <div className="text-xs text-gray-400">{formatDate(inv.invoiceDate)}</div>
                    </td>
                    <td className="table-td">{inv.customerName}</td>
                    <td className="table-td text-right font-medium">{formatINR(inv.grandTotal)}</td>
                    <td className="table-td"><span className={paymentBadgeClass(inv.paymentStatus)}>{inv.paymentStatus}</span></td>
                  </tr>
                ))}
                {recentInvoices.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-sm text-gray-400">No invoices yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Low Stock Alerts</h2>
            <Link to="/inventory" className="text-xs text-brand-600 hover:underline">View inventory</Link>
          </div>
          <div className="space-y-2">
            {lowStockProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.sku} · {p.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-700">{p.stockQuantity} left</p>
                  <p className="text-xs text-gray-400">min {p.lowStockThreshold}</p>
                </div>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-400">All stock levels OK ✓</p>
            )}
          </div>
        </div>

        {/* Urgent Tickets */}
        {urgentTickets.length > 0 && (
          <div className="card lg:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
              <h2 className="font-semibold text-gray-800">Overdue Repair Tickets</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  <th className="table-th">Ticket</th>
                  <th className="table-th">Device</th>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Expected</th>
                  <th className="table-th text-right">Overdue</th>
                </tr></thead>
                <tbody>
                  {urgentTickets.map(t => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="table-td">
                        <Link to={`/tickets/${t.id}`} className="font-medium text-brand-700 hover:underline">{t.ticketNumber}</Link>
                      </td>
                      <td className="table-td">{t.deviceName}</td>
                      <td className="table-td">{t.customerName}</td>
                      <td className="table-td"><span className={statusBadgeClass(t.status)}>{t.status}</span></td>
                      <td className="table-td">{formatDate(t.expectedDeliveryDate)}</td>
                      <td className="table-td text-right font-medium text-red-600">{t.daysOverdue}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
