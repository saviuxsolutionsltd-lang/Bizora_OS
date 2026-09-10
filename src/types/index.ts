export type UserRole =
  | 'superadmin'
  | 'owner'
  | 'manager'
  | 'cashier'
  | 'inventory_manager'
  | 'delivery_driver';

export interface Organization {
  name: string;
  tradingName: string;
  branchName: string;
  kraPin: string;
  etimsCiuSeries: string;
  fiscalDeviceSerial: string;
  currency: string;
  taxRatePercent: number;
  phone: string;
  email: string;
  address: string;
  idleTimeoutMinutes: number;
  autoLockEnabled: boolean;
  receiptHeader: string;
  receiptFooter: string;
  isConfigured: boolean;
}

export interface Till {
  id: string;
  name: string;
  deviceToken: string;
  status: 'active' | 'suspended' | 'pending_approval';
  registeredDate: string;
  lastActive: string;
  location: string;
}

export interface User {
  id: string;
  staffId: string; // 4 digits e.g. "1042"
  username: string; // e.g. "alex1042"
  firstName: string;
  lastName: string;
  role: UserRole;
  pin: string; // 6 digits e.g. "123456"
  email: string;
  phone: string;
  status: 'active' | 'suspended';
  assignedTillId?: string;
  createdAt: string;
}

export interface ProductCompositionItem {
  baseProductId: string; // Linked ID of the base product in inventory (e.g. PRD-BASE-001)
  baseProductName: string; // Descriptive name of the constituent base product
  quantityRequired: number; // Amount of this base deducted per unit of finished product (e.g. 14 for 14L)
  unit: string; // "Liters", "Kg", "Pcs", "Tins"
  percentage?: number; // Optional formulation ratio (e.g. 70%)
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  paintBaseIds: string[]; // e.g. ["Base A", "Base B", "Deep Base", "White Tint"]
  isComposition?: boolean; // Flag if this is a composite/formulated paint product
  composition?: ProductCompositionItem[]; // Constituent base products linked with exact quantities
  isPaintBase?: boolean; // Flag if this item is a raw formulation base material
  costPrice: number;
  buyingPrice?: number; // alias for costPrice
  sellingPrice: number;
  wholesalePrice: number;
  stockQuantity: number;
  minStockAlert: number;
  reorderLevel?: number; // alias for minStockAlert
  unit: string; // "Pcs", "Roll", "Meters", "Kg", "Bags", "Liters", "Box", "Tin (20L)", "Tin (4L)"
  imageUrl?: string; // base64 string or data uri
  status: 'active' | 'suspended' | 'hold';
  description?: string;
  createdAt?: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedPaintBaseId?: string;
  unitPrice: number;
  discount: number;
  total: number;
  notes?: string;
  productId?: string;
  productName?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  kraPin: string;
  walletBalance: number;
  creditLimit: number;
  totalPurchases: number;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  customerId: string;
  amount: number;
  type: 'deposit' | 'payment' | 'refund' | 'adjustment';
  reference: string;
  timestamp: string;
  staffId: string;
  staffName: string;
  notes: string;
}

export interface TimelineEvent {
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  stage: 'quotation' | 'merchant' | 'sale' | 'delivery' | 'return';
}

export interface Sale {
  id: string;
  orderNumber: string;
  receiptNumber: string;
  cuNumber: string; // KRA ETIMS CU number
  ciuSeries: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerKraPin?: string;
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  discountTotal: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'mpesa' | 'card' | 'wallet' | 'split';
  paymentDetails: {
    cashAmount?: number;
    mpesaAmount?: number;
    mpesaReference?: string;
    cardAmount?: number;
    cardReference?: string;
    walletAmount?: number;
  };
  paymentStatus: 'paid' | 'credit' | 'partial';
  tillId: string;
  tillName: string;
  staffId: string;
  attendantFirstName: string;
  attendantStaffId?: string;
  createdAt: string;
  status: 'completed' | 'refunded' | 'voided';
  sourceQuotationId?: string;
  sourceMerchantSaleId?: string;
  deliveryStatus?: 'not_required' | 'pending' | 'dispatched' | 'in_transit' | 'delivered';
  paymentReference?: string;
  auditTimeline: TimelineEvent[];
}

export interface MerchantSale {
  id: string;
  merchantOrderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerKraPin?: string;
  items: CartItem[];
  subtotal: number;
  totalAmount: number;
  status: 'pending' | 'converted' | 'cancelled' | 'draft';
  tillId: string;
  tillName?: string;
  staffId: string;
  attendantFirstName?: string;
  createdAt: string;
  dueDate?: string;
  notes?: string;
  internalNotes?: string;
  convertedSaleId?: string;
  auditTimeline?: TimelineEvent[];
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerKraPin?: string;
  items: CartItem[];
  subtotal?: number;
  totalAmount: number;
  validUntil: string;
  status: 'active' | 'converted_merchant' | 'converted_sale' | 'expired' | 'cancelled';
  tillId?: string;
  staffId?: string;
  attendantFirstName?: string;
  createdAt: string;
  notes?: string;
  createdByStaffId?: string;
  auditTimeline?: TimelineEvent[];
}

export interface Delivery {
  id: string;
  deliveryNumber: string;
  linkedSaleId?: string;
  linkedMerchantSaleId?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: {
    productName: string;
    quantity: number;
    unit: string;
    paintBaseId?: string;
  }[];
  driverName: string;
  vehicleReg: string;
  status: 'pending' | 'dispatched' | 'in_transit' | 'delivered';
  dispatchedAt?: string;
  deliveredAt?: string;
  recipientSignature?: string;
  notes: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface Purchase {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalAmount: number;
  status: 'ordered' | 'received' | 'partial' | 'cancelled';
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  orderDate?: string;
  createdAt?: string;
  receivedDate?: string;
  receivedAt?: string;
  grnNumber?: string;
  notes?: string;
}

export type PurchaseOrder = Purchase;

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  kraPin: string;
  termsDays?: number;
  paymentTerms?: string;
  outstandingBalance?: number;
  balanceDue?: number;
  createdAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  module: string;
  staffId: string;
  staffName: string;
  tillId: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
  ipOrDevice: string;
  targetEntity?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  deltaQuantity: number;
  type: string;
  reason?: string;
  staffId: string;
  notes?: string;
  referenceId?: string;
  createdAt: string;
}

export interface SecurityThreat {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
  ipOrDevice: string;
}

export interface HeldCart {
  id: string;
  title: string;
  customerName: string;
  items: CartItem[];
  savedAt: string;
  staffId: string;
  tillId: string;
}

export interface CreditPayment {
  id: string;
  creditSaleId: string;
  amount: number;
  paymentMethod: 'cash' | 'mpesa' | 'bank' | 'cheque';
  reference: string;
  receiptNumber?: string;
  paymentDate: string;
  staffId: string;
  staffName: string;
  notes?: string;
}

export interface CreditSale {
  id: string;
  invoiceNumber: string;
  receiptNumber?: string;
  saleId?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerKraPin?: string;
  items: CartItem[];
  subtotal: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: 'unpaid' | 'partial' | 'paid' | 'overdue' | 'written_off';
  creditTermsDays: number;
  dueDate: string;
  createdAt: string;
  tillId: string;
  tillName?: string;
  staffId: string;
  staffName: string;
  notes?: string;
  payments: CreditPayment[];
}

