// ============================================================
//  src/App.tsx  –  Router + route declarations
// ============================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { Layout } from './components/layout/Layout'
import { PageLoader } from './components/common/Spinner'

// Lazy page imports
const LoginPage          = lazy(() => import('./pages/Auth/LoginPage'))
const DashboardPage      = lazy(() => import('./pages/Dashboard/DashboardPage'))
const InventoryPage      = lazy(() => import('./pages/Inventory/InventoryPage'))
const TicketsPage        = lazy(() => import('./pages/RepairTickets/TicketsPage'))
const TicketDetailPage  = lazy(() => import('./pages/RepairTickets/TicketDetailPage'))
const CustomersPage      = lazy(() => import('./pages/Customers/CustomersPage'))
const CustomerDetailPage= lazy(() => import('./pages/Customers/CustomerDetailPage'))
const BillingPage        = lazy(() => import('./pages/Billing/BillingPage'))
const InvoicesListPage   = lazy(() => import('./pages/Invoice/InvoicesListPage').then(m => ({ default: m.InvoicesListPage })))
const InvoiceDetailPage  = lazy(() => import('./pages/Invoice/InvoiceDetailPage').then(m => ({ default: m.InvoiceDetailPage })))
const ServicesPage       = lazy(() => import('./pages/Services/ServicesPage'))
const UsersPage          = lazy(() => import('./pages/Users/UsersPage'))

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <BrowserRouter>
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><PageLoader /></div>}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected – all roles */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index                 element={<DashboardPage />} />
                <Route path="inventory"      element={<InventoryPage />} />
                <Route path="tickets"        element={<TicketsPage />} />
                <Route path="tickets/:id"    element={<TicketDetailPage />} />
                <Route path="customers"      element={<CustomersPage />} />
                <Route path="customers/:id"  element={<CustomerDetailPage />} />
                <Route path="billing"        element={<BillingPage />} />
                <Route path="invoices"       element={<InvoicesListPage />} />
                <Route path="invoices/:id"   element={<InvoiceDetailPage />} />

                {/* Admin-only */}
                <Route element={<ProtectedRoute adminOnly />}>
                  <Route path="services"     element={<ServicesPage />} />
                  <Route path="users"        element={<UsersPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
