// ============================================================
//  src/utils/format.ts  –  INR currency, dates, status badges
// ============================================================

/** Format a number as Indian Rupees: ₹1,250.00 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount)
}

/** Format a date string as 22-Nov-2026 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

/** Ticket status → Tailwind badge class */
export function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    'Received':          'badge-blue',
    'In Repair':         'badge-yellow',
    'Waiting for Parts': 'badge-yellow',
    'Ready for Pickup':  'badge-green',
    'Billed':            'badge-gray',
    'Cancelled':         'badge-red',
  }
  return map[status] ?? 'badge-gray'
}

/** Payment status → badge class */
export function paymentBadgeClass(status: string): string {
  const map: Record<string, string> = {
    'Paid':    'badge-green',
    'Pending': 'badge-red',
    'Partial': 'badge-yellow',
  }
  return map[status] ?? 'badge-gray'
}
