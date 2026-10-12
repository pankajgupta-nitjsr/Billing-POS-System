export type UserRole = 'OWNER' | 'CASHIER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  storeId: string;
  active: boolean;
  employeeCode?: string; // Strict unique employee ID e.g. CSH-101
  phone?: string;
  pin?: string;          // Strict unique 4-6 digit PIN for fast cashier POS access
  password?: string;     // Password for cashier login
  station?: string;      // Assigned Counter/Station (e.g. Counter 1, Grocery Counter)
  authProvider?: 'GOOGLE' | 'EMAIL_PASSWORD' | 'PIN';
  assignedBy?: string;   // Owner ID who assigned this cashier (e.g. Chandan Kumar Gupta)
  assignedByName?: string;
  lastLogin?: string;
  createdAt: string;
}

export type KiranaUnit = 'pc' | 'packet' | 'box' | 'bottle' | 'kg' | 'gm' | 'litre' | 'ml';

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Black / M"
  size?: string;
  color?: string;
  sku: string;
  barcode: string;
  stock: number;
  costPrice: number;
  mrp: number;
  sellingPrice: number;
  floorPrice: number;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  sku: string;
  barcode: string;
  qrCode?: string;
  category: 'Grocery' | 'Fashion' | 'FMCG' | 'General';
  subcategory?: string;
  brand?: string;
  imageUrl?: string;
  unit: KiranaUnit;
  isDecimalUnit: boolean; // true for kg, gm, litre, ml
  costPrice: number;      // Protected from cashier view
  mrp: number;
  sellingPrice: number;
  floorPrice: number;     // Absolute floor price (cannot sell below this)
  gstRate: number;        // e.g. 0, 5, 12, 18, 28
  hsnCode?: string;
  supplierId?: string;
  supplierName?: string;
  stock: number;
  minStockAlert: number;
  reorderLevel?: number;
  rackLocation?: string;
  active: boolean;
  negotiationEnabled: boolean;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string; // unique item cart line ID
  productId: string;
  variantId?: string;
  variantName?: string;
  name: string;
  sku: string;
  barcode: string;
  unit: KiranaUnit;
  isDecimalUnit: boolean;
  quantity: number;
  mrp: number;
  costPrice: number;
  originalSellingPrice: number;
  negotiatedPrice?: number; // active price if negotiated
  unitPrice: number;        // effective selling price for this transaction
  gstRate: number;
  hsnCode?: string;
  floorPrice: number;
  negotiationEnabled: boolean;
  isNegotiated?: boolean;
  ownerOverrideApproved?: boolean;
  negotiatedBy?: string;
  customerOffer?: number;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'SPLIT';
export type PaymentStatus = 'PAID' | 'PARTIAL' | 'CREDIT' | 'REFUNDED';

export interface PaymentSplit {
  method: 'CASH' | 'UPI' | 'CARD';
  amount: number;
  referenceNumber?: string;
}

export interface Sale {
  id: string;
  storeId: string;
  invoiceNumber: string; // e.g. INV-000001
  items: CartItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  costTotal: number; // for profit analytics
  grossProfit: number;
  
  // Payment info
  paymentMethod: PaymentMethod;
  paymentSplits?: PaymentSplit[];
  amountPaid: number;
  cashTendered?: number;
  changeGiven?: number;
  paymentStatus: PaymentStatus;
  
  // Customer info
  customerId?: string;
  customerName?: string;
  customerPhone?: string;

  // Negotiation metadata
  hasNegotiation: boolean;
  negotiationSummary?: {
    totalOriginalPrice: number;
    totalNegotiatedPrice: number;
    totalDiscount: number;
    approvedBy: string;
    approvedAt: string;
    reason?: string;
  };

  // Staff & audit
  cashierId: string;
  cashierName: string;
  shiftId?: string;
  createdAt: string;
  status: 'COMPLETED' | 'RETURNED' | 'PARTIAL_RETURN' | 'CANCELLED';
  returnedAmount?: number;
  notes?: string;
}

export interface HeldBill {
  id: string;
  heldAt: string;
  billNumber: string;
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  notes?: string;
}

export type StockMovementType = 'OPENING' | 'PURCHASE' | 'SALE' | 'RETURN' | 'DAMAGE' | 'ADJUSTMENT';

export interface StockMovement {
  id: string;
  storeId: string;
  productId: string;
  variantId?: string;
  productName: string;
  type: StockMovementType;
  quantity: number; // positive or negative
  previousStock: number;
  newStock: number;
  referenceDocId?: string; // invoice or purchase order id
  reason: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface ReturnItem {
  cartItemId: string;
  productId: string;
  variantId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
}

export interface SaleReturn {
  id: string;
  storeId: string;
  saleId: string;
  invoiceNumber: string;
  items: ReturnItem[];
  totalRefund: number;
  refundMethod: 'CASH' | 'UPI' | 'CREDIT';
  reason: string;
  processedBy: string;
  processedByName: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  storeId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
  outstandingBalance: number;
  totalPurchases: number;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  gstRate: number;
  total: number;
}

export interface Purchase {
  id: string;
  storeId: string;
  purchaseInvoiceNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  outstandingBalance: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  receivedDate: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  storeId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  creditBalance: number;
  totalPurchases: number;
  totalVisits: number;
  lastVisit?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  storeId: string;
  category: 'Rent' | 'Electricity' | 'Salary' | 'Transport' | 'Packaging' | 'Repairs' | 'Miscellaneous';
  amount: number;
  paymentMethod: 'CASH' | 'UPI' | 'BANK';
  description: string;
  recordedBy: string;
  recordedByName: string;
  date: string;
  createdAt: string;
}

export interface CashierShift {
  id: string;
  storeId: string;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  cashSales: number;
  upiSales: number;
  cardSales: number;
  refundsGiven: number;
  cashExpenses: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  differenceReason?: string;
  status: 'OPEN' | 'CLOSED';
}

export interface StoreSettings {
  id: string;
  name: string;
  legalName?: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  invoicePrefix: string;
  currencySymbol: string;
  allowNegativeStock: boolean;
  enableItemNegotiation: boolean;
  defaultGstRate: number;
  defaultThermalWidth: '80mm' | '58mm';
  receiptFooterMessage: string;
  ownerPin: string; // for authorizing overrides
}

export interface AuditLog {
  id: string;
  storeId: string;
  action: string;
  category: 'PRICING' | 'NEGOTIATION' | 'STOCK' | 'SALE' | 'RETURN' | 'AUTH' | 'SETTINGS';
  details: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface NegotiationAnalyticsRecord {
  id: string;
  storeId: string;
  saleId: string;
  invoiceNumber: string;
  productId: string;
  productName: string;
  category: string;
  originalPrice: number;
  customerOffer: number;
  floorPrice: number;
  finalPrice: number;
  discountGranted: number;
  approvedBy: string;
  cashierId: string;
  createdAt: string;
}
