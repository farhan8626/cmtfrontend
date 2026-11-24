// ============================================================
//  src/types/index.ts – Shared TypeScript types (mirrors backend DTOs)
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ---- Auth ----
export interface LoginRequest  { email: string; password: string; }
export interface LoginResponse {
  userId: number; fullName: string; email: string;
  role: string; token: string; expiresAt: string;
}
export interface UserDto {
  id: number; fullName: string; email: string;
  role: string; isActive: boolean; createdAt: string;
}
export interface CreateUserRequest  { fullName: string; email: string; password: string; role: string; }
export interface UpdateUserRequest  { fullName: string; email: string; role: string; isActive: boolean; }

// ---- Customers ----
export interface CustomerDto {
  id: number; fullName: string; phone: string;
  email?: string; address?: string; createdAt: string;
}
export interface CustomerDetailDto extends CustomerDto {
  totalInvoices: number; totalSpent: number; totalTickets: number;
}
export interface CreateCustomerRequest { fullName: string; phone: string; email?: string; address?: string; }
export interface UpdateCustomerRequest extends CreateCustomerRequest {}

// ---- Products ----
export interface ProductDto {
  id: number; sku: string; name: string; category: string; brand?: string;
  purchasePrice: number; sellingPrice: number;
  stockQuantity: number; lowStockThreshold: number;
  isLowStock: boolean; updatedAt: string;
}
export interface CreateProductRequest {
  sku: string; name: string; category: string; brand?: string;
  purchasePrice: number; sellingPrice: number;
  stockQuantity: number; lowStockThreshold: number;
}
export interface UpdateProductRequest {
  sku: string; name: string; category: string; brand?: string;
  purchasePrice: number; sellingPrice: number; lowStockThreshold: number;
}
export interface StockInRequest { quantity: number; notes?: string; }

// ---- Repair Services ----
export interface RepairServiceDto {
  id: number; serviceName: string; description?: string;
  baseCharge: number; isActive: boolean;
}
export interface CreateRepairServiceRequest { serviceName: string; description?: string; baseCharge: number; }
export interface UpdateRepairServiceRequest extends CreateRepairServiceRequest { isActive: boolean; }

// ---- Repair Tickets ----
export type TicketStatus =
  | 'Received' | 'In Repair' | 'Waiting for Parts'
  | 'Ready for Pickup' | 'Billed' | 'Cancelled';

export interface TicketSummaryDto {
  id: number; ticketNumber: string;
  customerName: string; customerPhone: string;
  deviceName: string; status: TicketStatus;
  receivedDate: string; expectedDeliveryDate?: string;
  estimatedCost?: number;
}
export interface TicketDto extends TicketSummaryDto {
  customerId: number; reportedIssue: string;
  completedDate?: string; invoiceId?: number; invoiceNumber?: string;
  notes?: string; createdByUserId: number; createdByName: string;
  createdAt: string; updatedAt: string;
}
export interface CreateTicketRequest {
  customerId: number; deviceName: string; reportedIssue: string;
  estimatedCost?: number; expectedDeliveryDate?: string; notes?: string;
}
export interface UpdateTicketRequest {
  deviceName: string; reportedIssue: string;
  estimatedCost?: number; expectedDeliveryDate?: string; notes?: string;
}

// ---- Invoices ----
export interface InvoiceItemRequest {
  itemType: 'Product' | 'Service';
  productId?: number; serviceId?: number;
  itemName: string; quantity: number; unitPrice: number;
}
export interface InvoiceItemDto extends InvoiceItemRequest {
  id: number; lineTotal: number;
}
export interface CreateInvoiceRequest {
  customerId: number; ticketId?: number;
  invoiceDate: string; subTotal: number;
  discount: number; grandTotal: number;
  paymentStatus: string; paymentMethod?: string;
  notes?: string; items: InvoiceItemRequest[];
}
export interface InvoiceSummaryDto {
  id: number; invoiceNumber: string; invoiceDate: string;
  customerName: string; grandTotal: number;
  paymentStatus: string; paymentMethod?: string;
  ticketId?: number; ticketNumber?: string;
}
export interface InvoiceDto extends InvoiceSummaryDto {
  customerId: number; customerPhone: string;
  customerEmail?: string; customerAddress?: string;
  subTotal: number; discount: number; notes?: string;
  createdByUserId: number; createdByName: string;
  createdAt: string; items: InvoiceItemDto[];
}
export interface CreateInvoiceResult { newInvoiceId: number; newInvoiceNumber: string; }
export interface UpdatePaymentRequest { paymentStatus: string; paymentMethod?: string; }

// ---- Dashboard ----
export interface DashboardKpiDto {
  todaysSales: number; todaysInvoiceCount: number;
  monthlyRevenue: number; monthlyInvoiceCount: number;
  activeRepairTickets: number; readyForPickup: number;
  overdueTickets: number; lowStockItemCount: number;
  totalCustomers: number; totalProducts: number;
}
export interface RecentInvoiceDto {
  id: number; invoiceNumber: string; invoiceDate: string;
  customerName: string; customerPhone: string;
  grandTotal: number; paymentStatus: string; paymentMethod?: string;
  ticketId?: number; ticketNumber?: string;
}
export interface LowStockProductDto {
  id: number; sku: string; name: string; category: string; brand?: string;
  stockQuantity: number; lowStockThreshold: number;
  sellingPrice: number; shortfallQty: number;
}
export interface UrgentTicketDto {
  id: number; ticketNumber: string; deviceName: string;
  status: string; expectedDeliveryDate?: string;
  receivedDate: string; customerName: string;
  customerPhone: string; daysOverdue: number;
}
export interface DashboardSummaryDto {
  kpi: DashboardKpiDto;
  recentInvoices: RecentInvoiceDto[];
  lowStockProducts: LowStockProductDto[];
  urgentTickets: UrgentTicketDto[];
}
