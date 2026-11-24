// ============================================================
//  src/api/index.ts  –  Typed API service functions
// ============================================================
import client from './client'
import type {
  LoginRequest, LoginResponse, UserDto, CreateUserRequest, UpdateUserRequest,
  CustomerDto, CustomerDetailDto, CreateCustomerRequest, UpdateCustomerRequest,
  ProductDto, CreateProductRequest, UpdateProductRequest, StockInRequest,
  RepairServiceDto, CreateRepairServiceRequest, UpdateRepairServiceRequest,
  TicketSummaryDto, TicketDto, CreateTicketRequest, UpdateTicketRequest,
  InvoiceSummaryDto, InvoiceDto, CreateInvoiceRequest, CreateInvoiceResult, UpdatePaymentRequest,
  DashboardSummaryDto, ApiResponse,
} from '../types'

// ── Helpers ──────────────────────────────────────────────────
const data = <T>(res: { data: ApiResponse<T> }) => res.data.data

// ── Auth ─────────────────────────────────────────────────────
export const authApi = {
  login:          (body: LoginRequest)                 => client.post<ApiResponse<LoginResponse>>('/auth/login', body).then(data),
  me:             ()                                   => client.get<ApiResponse<UserDto>>('/auth/me').then(data),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
                                                         client.post<ApiResponse<null>>('/auth/change-password', body),
}

// ── Users ─────────────────────────────────────────────────────
export const usersApi = {
  getAll:  ()                                   => client.get<ApiResponse<UserDto[]>>('/users').then(data),
  getById: (id: number)                         => client.get<ApiResponse<UserDto>>(`/users/${id}`).then(data),
  create:  (body: CreateUserRequest)            => client.post<ApiResponse<UserDto>>('/users', body).then(data),
  update:  (id: number, body: UpdateUserRequest) => client.put<ApiResponse<UserDto>>(`/users/${id}`, body).then(data),
}

// ── Customers ─────────────────────────────────────────────────
export const customersApi = {
  getAll:     (search?: string)                        => client.get<ApiResponse<CustomerDto[]>>('/customers', { params: { search } }).then(data),
  getById:    (id: number)                             => client.get<ApiResponse<CustomerDetailDto>>(`/customers/${id}`).then(data),
  create:     (body: CreateCustomerRequest)            => client.post<ApiResponse<CustomerDto>>('/customers', body).then(data),
  update:     (id: number, body: UpdateCustomerRequest) => client.put<ApiResponse<CustomerDto>>(`/customers/${id}`, body).then(data),
  getInvoices:(id: number, page = 1, pageSize = 20)   => client.get<ApiResponse<InvoiceSummaryDto[]>>(`/customers/${id}/invoices`, { params: { page, pageSize } }).then(data),
  getTickets: (id: number)                             => client.get<ApiResponse<TicketSummaryDto[]>>(`/customers/${id}/tickets`).then(data),
}

// ── Products ─────────────────────────────────────────────────
export const productsApi = {
  getAll:        (search?: string, category?: string) => client.get<ApiResponse<ProductDto[]>>('/products', { params: { search, category } }).then(data),
  getById:       (id: number)                         => client.get<ApiResponse<ProductDto>>(`/products/${id}`).then(data),
  getCategories: ()                                   => client.get<ApiResponse<string[]>>('/products/categories').then(data),
  create:        (body: CreateProductRequest)         => client.post<ApiResponse<ProductDto>>('/products', body).then(data),
  update:        (id: number, body: UpdateProductRequest) => client.put<ApiResponse<ProductDto>>(`/products/${id}`, body).then(data),
  stockIn:       (id: number, body: StockInRequest)   => client.post<ApiResponse<null>>(`/products/${id}/stock-in`, body),
}

// ── Repair Services ───────────────────────────────────────────
export const servicesApi = {
  getAll:  (activeOnly = true)                            => client.get<ApiResponse<RepairServiceDto[]>>('/repair-services', { params: { activeOnly } }).then(data),
  getById: (id: number)                                   => client.get<ApiResponse<RepairServiceDto>>(`/repair-services/${id}`).then(data),
  create:  (body: CreateRepairServiceRequest)             => client.post<ApiResponse<RepairServiceDto>>('/repair-services', body).then(data),
  update:  (id: number, body: UpdateRepairServiceRequest) => client.put<ApiResponse<RepairServiceDto>>(`/repair-services/${id}`, body).then(data),
}

// ── Repair Tickets ────────────────────────────────────────────
export const ticketsApi = {
  getAll:       (status?: string, customerId?: number) => client.get<ApiResponse<TicketSummaryDto[]>>('/tickets', { params: { status, customerId } }).then(data),
  getById:      (id: number)                           => client.get<ApiResponse<TicketDto>>(`/tickets/${id}`).then(data),
  create:       (body: CreateTicketRequest)            => client.post<ApiResponse<TicketDto>>('/tickets', body).then(data),
  update:       (id: number, body: UpdateTicketRequest) => client.put<ApiResponse<TicketDto>>(`/tickets/${id}`, body).then(data),
  updateStatus: (id: number, status: string)           => client.patch<ApiResponse<TicketDto>>(`/tickets/${id}/status`, { status }).then(data),
}

// ── Invoices ──────────────────────────────────────────────────
export const invoicesApi = {
  getAll:        (params?: { customerId?: number; paymentStatus?: string; page?: number; pageSize?: number }) =>
                   client.get<ApiResponse<InvoiceSummaryDto[]>>('/invoices', { params }).then(data),
  getById:       (id: number)                           => client.get<ApiResponse<InvoiceDto>>(`/invoices/${id}`).then(data),
  create:        (body: CreateInvoiceRequest)           => client.post<ApiResponse<CreateInvoiceResult>>('/invoices', body).then(data),
  updatePayment: (id: number, body: UpdatePaymentRequest) => client.patch<ApiResponse<null>>(`/invoices/${id}/payment`, body),
  getPdfUrl:     (id: number)                           => `/api/invoices/${id}/pdf`,
  sendEmail:     (id: number)                           => client.post<ApiResponse<null>>(`/invoices/${id}/email`),
}

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardApi = {
  getSummary: () => client.get<ApiResponse<DashboardSummaryDto>>('/dashboard').then(data),
}
