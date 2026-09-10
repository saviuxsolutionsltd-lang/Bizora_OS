import {
  Organization,
  Till,
  User,
  Product,
  Customer,
  Sale,
  MerchantSale,
  Quotation,
  Delivery,
  Purchase,
  Supplier,
  AuditLog,
  SecurityThreat,
  HeldCart,
  WalletTransaction,
  StockMovement,
  CreditSale,
  CreditPayment,
} from '../types';

const STORAGE_KEYS = {
  ORG: 'bizora_org',
  TILLS: 'bizora_tills',
  USERS: 'bizora_users',
  PRODUCTS: 'bizora_products',
  CUSTOMERS: 'bizora_customers',
  SALES: 'bizora_sales',
  MERCHANT_SALES: 'bizora_merchant_sales',
  QUOTATIONS: 'bizora_quotations',
  DELIVERIES: 'bizora_deliveries',
  PURCHASES: 'bizora_purchases',
  SUPPLIERS: 'bizora_suppliers',
  AUDIT_LOGS: 'bizora_audit_logs',
  SECURITY_THREATS: 'bizora_threats',
  HELD_CARTS: 'bizora_held_carts',
  WALLET_TXS: 'bizora_wallet_txs',
  STOCK_MOVEMENTS: 'bizora_stock_movements',
  CREDIT_SALES: 'bizora_credit_sales',
  CURRENT_TILL: 'bizora_current_till_id',
  CURRENT_USER: 'bizora_current_user_id',
};

// Initial hardware & electrical starter products (clean real-world hardware store data)
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'PRD-ELC-001',
    name: 'East African Cables 2.5mm² Twin & Earth Cable (100m Roll)',
    sku: 'EAC-2.5-TNE-100',
    barcode: '6161100123456',
    category: 'Electricals & Cables',
    paintBaseIds: [],
    costPrice: 4200,
    sellingPrice: 5200,
    wholesalePrice: 4800,
    stockQuantity: 45,
    minStockAlert: 10,
    unit: 'Roll',
    status: 'active',
    description: 'Pure copper 2.5mm² PVC insulated twin with bare earth conductor, KEBS certified.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PRD-ELC-002',
    name: 'Schneider Electric MCB Single Pole 20A Easy9',
    sku: 'SCH-MCB-1P-20A',
    barcode: '6161100123463',
    category: 'Electricals & Cables',
    paintBaseIds: [],
    costPrice: 380,
    sellingPrice: 550,
    wholesalePrice: 480,
    stockQuantity: 120,
    minStockAlert: 25,
    unit: 'Pcs',
    status: 'active',
    description: 'DIN rail mounted miniature circuit breaker 20 Amps 3kA breaking capacity.',
    updatedAt: new Date().toISOString(),
  },
  // --- Raw Constituent Paint Base Materials ---
  {
    id: 'PRD-BASE-001',
    name: 'Crown Master Tint Base 1 (Pure White) - 200L Drum',
    sku: 'CRW-BASE-1-RAW',
    barcode: '6161100123901',
    category: 'Paints & Coatings',
    paintBaseIds: ['Base 1 (White)'],
    isPaintBase: true,
    costPrice: 280,
    sellingPrice: 380,
    wholesalePrice: 340,
    stockQuantity: 450, // 450 Liters
    minStockAlert: 100,
    unit: 'Liters',
    status: 'active',
    description: 'High-opacity titanium dioxide white tint base formulation raw material.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PRD-BASE-002',
    name: 'Crown Master Tint Base 2 (Midtone Pastel) - 200L Drum',
    sku: 'CRW-BASE-2-RAW',
    barcode: '6161100123902',
    category: 'Paints & Coatings',
    paintBaseIds: ['Base 2 (Midtone)'],
    isPaintBase: true,
    costPrice: 310,
    sellingPrice: 420,
    wholesalePrice: 370,
    stockQuantity: 280, // 280 Liters
    minStockAlert: 60,
    unit: 'Liters',
    status: 'active',
    description: 'Intermediate pigment loading base for medium-saturation pastel tones.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PRD-BASE-004',
    name: 'Crown Master Tint Base 4 (Deep Tint / Red / Accent) - 200L Drum',
    sku: 'CRW-BASE-4-RAW',
    barcode: '6161100123904',
    category: 'Paints & Coatings',
    paintBaseIds: ['Base 4 (Deep Tint)'],
    isPaintBase: true,
    costPrice: 360,
    sellingPrice: 490,
    wholesalePrice: 430,
    stockQuantity: 190, // 190 Liters
    minStockAlert: 40,
    unit: 'Liters',
    status: 'active',
    description: 'Clear vehicle deep tint base for ultra-vivid, intense architectural shades.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PRD-BASE-BIND',
    name: 'Crown Weatherguard Acrylic Resin Binder Compound',
    sku: 'CRW-RESIN-BIND-L',
    barcode: '6161100123905',
    category: 'Paints & Coatings',
    paintBaseIds: [],
    isPaintBase: true,
    costPrice: 210,
    sellingPrice: 300,
    wholesalePrice: 260,
    stockQuantity: 320, // 320 Liters
    minStockAlert: 50,
    unit: 'Liters',
    status: 'active',
    description: 'Pure acrylic emulsion resin binder promoting weather durability and adhesion.',
    updatedAt: new Date().toISOString(),
  },
  // --- Formulated / Composite Paint Products with Multi-Base Composition ---
  {
    id: 'PRD-PNT-001',
    name: 'Crown Paints Permaplast Exterior Emulsion 20L',
    sku: 'CRW-PERMA-20L',
    barcode: '6161100123470',
    category: 'Paints & Coatings',
    paintBaseIds: ['Base 1 (White)', 'Base 2 (Midtone)', 'Base 4 (Deep Tint)'],
    isComposition: true,
    composition: [
      {
        baseProductId: 'PRD-BASE-001',
        baseProductName: 'Crown Master Tint Base 1 (Pure White)',
        quantityRequired: 14,
        unit: 'Liters',
        percentage: 70,
      },
      {
        baseProductId: 'PRD-BASE-002',
        baseProductName: 'Crown Master Tint Base 2 (Midtone Pastel)',
        quantityRequired: 4,
        unit: 'Liters',
        percentage: 20,
      },
      {
        baseProductId: 'PRD-BASE-004',
        baseProductName: 'Crown Master Tint Base 4 (Deep Tint / Red / Accent)',
        quantityRequired: 2,
        unit: 'Liters',
        percentage: 10,
      },
    ],
    costPrice: 7800,
    sellingPrice: 9400,
    wholesalePrice: 8900,
    stockQuantity: 28,
    minStockAlert: 5,
    unit: 'Tin (20L)',
    status: 'active',
    description: 'Formulation: Base 1 (14L/70%), Base 2 (4L/20%), Base 4 (2L/10%). Exterior anti-fungal paint.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PRD-PNT-002',
    name: 'Duracoat Vinyl Matt Interior Wall Paint 4L',
    sku: 'DUR-VIN-MATT-4L',
    barcode: '6161100123487',
    category: 'Paints & Coatings',
    paintBaseIds: ['Base 1 (Pure White)', 'Base 2 (Midtone)'],
    isComposition: true,
    composition: [
      {
        baseProductId: 'PRD-BASE-001',
        baseProductName: 'Crown Master Tint Base 1 (Pure White)',
        quantityRequired: 2.8,
        unit: 'Liters',
        percentage: 70,
      },
      {
        baseProductId: 'PRD-BASE-002',
        baseProductName: 'Crown Master Tint Base 2 (Midtone Pastel)',
        quantityRequired: 1.2,
        unit: 'Liters',
        percentage: 30,
      },
    ],
    costPrice: 1950,
    sellingPrice: 2450,
    wholesalePrice: 2200,
    stockQuantity: 54,
    minStockAlert: 12,
    unit: 'Tin (4L)',
    status: 'active',
    description: 'Formulation: Base 1 (2.8L/70%), Base 2 (1.2L/30%). Smooth luxury matt interior finish.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PRD-PLM-001',
    name: 'DuraPPR Hot & Cold Water Pipe 25mm (4m Length)',
    sku: 'PPR-PIPE-25MM-4M',
    barcode: '6161100123494',
    category: 'Plumbing & Pipes',
    paintBaseIds: [],
    costPrice: 520,
    sellingPrice: 720,
    wholesalePrice: 650,
    stockQuantity: 85,
    minStockAlert: 20,
    unit: 'Pcs',
    status: 'active',
    description: 'PN20 heavy gauge polypropylene pipe for pressurized plumbing.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PRD-PLM-002',
    name: 'Pegler Brass Gate Valve 3/4" BSP Full Bore',
    sku: 'PEG-VALVE-BRS-075',
    barcode: '6161100123500',
    category: 'Plumbing & Pipes',
    paintBaseIds: [],
    costPrice: 890,
    sellingPrice: 1250,
    wholesalePrice: 1100,
    stockQuantity: 34,
    minStockAlert: 8,
    unit: 'Pcs',
    status: 'active',
    description: 'Forged brass heavy duty wheel shutoff valve for domestic & commercial lines.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PRD-FST-001',
    name: 'Self-Drilling Roofing Screws 5.5 x 65mm with Rubber EPDM Washer (Pack of 100)',
    sku: 'SCR-RF-55-65-100',
    barcode: '6161100123517',
    category: 'Fasteners & Hardware',
    paintBaseIds: [],
    costPrice: 650,
    sellingPrice: 950,
    wholesalePrice: 820,
    stockQuantity: 62,
    minStockAlert: 15,
    unit: 'Box',
    status: 'active',
    description: 'Class 3 Ruspert coated roofing screws for iron sheet fixing.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PRD-TLS-001',
    name: 'Bosch Professional GWS 750-100 Angle Grinder 750W',
    sku: 'BOS-GWS-750W',
    barcode: '6161100123524',
    category: 'Power Tools',
    paintBaseIds: [],
    costPrice: 5400,
    sellingPrice: 6800,
    wholesalePrice: 6200,
    stockQuantity: 14,
    minStockAlert: 3,
    unit: 'Pcs',
    status: 'active',
    description: 'High motor power angle grinder with ergonomic grip and burst-proof guard.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PRD-MSN-001',
    name: 'Bamburi Tembo Cement 32.5R (50kg Bag)',
    sku: 'BAM-TEMBO-50KG',
    barcode: '6161100123531',
    category: 'Masonry & Cement',
    paintBaseIds: [],
    costPrice: 680,
    sellingPrice: 760,
    wholesalePrice: 730,
    stockQuantity: 340,
    minStockAlert: 50,
    unit: 'Bags',
    status: 'active',
    description: 'General purpose Portland Pozzolana cement for structural concrete and plastering.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'PRD-LGT-001',
    name: 'Philips LED Downlight Essential 12W 6500K Cool Daylight',
    sku: 'PHI-DWN-12W-CDL',
    barcode: '6161100123548',
    category: 'Lighting & Fixtures',
    paintBaseIds: [],
    costPrice: 480,
    sellingPrice: 690,
    wholesalePrice: 600,
    stockQuantity: 92,
    minStockAlert: 20,
    unit: 'Pcs',
    status: 'active',
    description: 'Energy-saving recessed ceiling downlight with integrated driver.',
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_ORG: Organization = {
  name: 'Bizora Hardware & Electricals Ltd',
  tradingName: 'Bizora Hardware & Building Solutions',
  branchName: 'Nairobi Flagship Hub',
  kraPin: 'P051892341M',
  etimsCiuSeries: 'CIU-ETIMS-2026-NBI-',
  fiscalDeviceSerial: 'BZR-FD-892401',
  currency: 'KES',
  taxRatePercent: 16,
  phone: '+254 700 892 400',
  email: 'operations@bizora.co.ke',
  address: 'Commercial Street, Industrial Area, Nairobi, Kenya',
  idleTimeoutMinutes: 15,
  autoLockEnabled: false,
  receiptHeader: 'BIZORA HARDWARE & ELECTRICALS\nTHE QUALITY BUILDING & INDUSTRIAL SUPPLY\nTel: +254 700 892 400',
  receiptFooter: 'Goods once sold are returnable within 48 hours in original condition.\nThank you for choosing BizoraOS ERP POS!',
  isConfigured: true,
};

export const INITIAL_TILLS: Till[] = [
  {
    id: 'TILL-01',
    name: 'Till 01 - Main Electrical & POS Counter',
    deviceToken: 'DEV-POS-NBI-01',
    status: 'active',
    registeredDate: '2026-01-10T08:00:00.000Z',
    lastActive: new Date().toISOString(),
    location: 'Ground Floor Counter A',
  },
  {
    id: 'TILL-02',
    name: 'Till 02 - Paints Mixing & Fasteners Desk',
    deviceToken: 'DEV-POS-NBI-02',
    status: 'active',
    registeredDate: '2026-01-10T08:30:00.000Z',
    lastActive: new Date().toISOString(),
    location: 'Color Studio & Fasteners Desk',
  },
  {
    id: 'TILL-03',
    name: 'Till 03 - Bulk Hardware & Loading Bay',
    deviceToken: 'DEV-POS-NBI-03',
    status: 'active',
    registeredDate: '2026-02-01T09:00:00.000Z',
    lastActive: new Date().toISOString(),
    location: 'Dispatch & Loading Bay',
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-SA-001',
    staffId: '0001',
    username: 'super0001',
    firstName: 'Super',
    lastName: 'Administrator',
    role: 'superadmin',
    pin: '889900',
    email: 'superadmin@bizora.co.ke',
    phone: '+254 711 000 001',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'USR-OWN-001',
    staffId: '1001',
    username: 'david1001',
    firstName: 'David',
    lastName: 'Mwangi',
    role: 'owner',
    pin: '123456',
    email: 'david.mwangi@bizora.co.ke',
    phone: '+254 722 100 101',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'USR-MGR-002',
    staffId: '2042',
    username: 'sarah2042',
    firstName: 'Sarah',
    lastName: 'Wanjiku',
    role: 'manager',
    pin: '234567',
    email: 'sarah.w@bizora.co.ke',
    phone: '+254 722 204 202',
    status: 'active',
    createdAt: '2026-01-05T00:00:00.000Z',
  },
  {
    id: 'USR-CSH-003',
    staffId: '3055',
    username: 'brian3055',
    firstName: 'Brian',
    lastName: 'Otieno',
    role: 'cashier',
    pin: '345678',
    email: 'brian.o@bizora.co.ke',
    phone: '+254 733 305 503',
    status: 'active',
    assignedTillId: 'TILL-01',
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'USR-CSH-004',
    staffId: '3088',
    username: 'faith3088',
    firstName: 'Faith',
    lastName: 'Chebet',
    role: 'cashier',
    pin: '456789',
    email: 'faith.c@bizora.co.ke',
    phone: '+254 733 308 804',
    status: 'active',
    assignedTillId: 'TILL-02',
    createdAt: '2026-01-15T00:00:00.000Z',
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-001',
    name: 'Apex Builders & Contractors Ltd',
    phone: '+254 712 345 678',
    email: 'procurement@apexbuilders.co.ke',
    address: 'Kilimani Business Park, Suite 4B, Nairobi',
    kraPin: 'P051999888W',
    walletBalance: 45000,
    creditLimit: 250000,
    totalPurchases: 642000,
    createdAt: '2026-01-12T10:00:00.000Z',
  },
  {
    id: 'CUST-002',
    name: 'Eng. Peter Kamau (Private Contractor)',
    phone: '+254 723 456 789',
    email: 'eng.kamau@gmail.com',
    address: 'Kileleshwa Ring Road, Nairobi',
    kraPin: 'A003456789X',
    walletBalance: 12500,
    creditLimit: 80000,
    totalPurchases: 185000,
    createdAt: '2026-01-20T14:30:00.000Z',
  },
  {
    id: 'CUST-003',
    name: 'Metro Electrical Engineers Ltd',
    phone: '+254 734 567 890',
    email: 'accounts@metroelectric.co.ke',
    address: 'Mombasa Road Gateway Centre, Nairobi',
    kraPin: 'P052111222K',
    walletBalance: 5800,
    creditLimit: 150000,
    totalPurchases: 320000,
    createdAt: '2026-02-05T09:15:00.000Z',
  },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'SUP-001',
    name: 'East African Cables PLC',
    contactPerson: 'Martin Njoroge',
    phone: '+254 20 690 3000',
    email: 'orders@eacables.com',
    address: 'Addis Ababa Road, Industrial Area, Nairobi',
    kraPin: 'P051000111A',
    termsDays: 30,
    outstandingBalance: 145000,
  },
  {
    id: 'SUP-002',
    name: 'Crown Paints Kenya PLC',
    contactPerson: 'Alice Mutua',
    phone: '+254 709 887 000',
    email: 'corporate@crownpaints.co.ke',
    address: 'Likoni Road, Nairobi',
    kraPin: 'P051000222B',
    termsDays: 45,
    outstandingBalance: 82000,
  },
  {
    id: 'SUP-003',
    name: 'Bamburi Cement Limited',
    contactPerson: 'Geoffrey Ochieng',
    phone: '+254 20 289 3000',
    email: 'logistics@bamburi.lafarge.com',
    address: 'Kitui Road, Industrial Area, Nairobi',
    kraPin: 'P051000333C',
    termsDays: 14,
    outstandingBalance: 0,
  },
];

class DatabaseService {
  private getItem<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultVal;
      return JSON.parse(data) as T;
    } catch {
      return defaultVal;
    }
  }

  private setItem<T>(key: string, val: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('Database write error:', e);
    }
  }

  // Organization
  getOrg(): Organization {
    return this.getItem<Organization>(STORAGE_KEYS.ORG, INITIAL_ORG);
  }

  saveOrg(org: Organization): void {
    this.setItem(STORAGE_KEYS.ORG, org);
  }

  isSetupDone(): boolean {
    const org = this.getOrg();
    return Boolean(org && org.isConfigured);
  }

  // Tills
  getTills(): Till[] {
    return this.getItem<Till[]>(STORAGE_KEYS.TILLS, INITIAL_TILLS);
  }

  saveTills(tills: Till[]): void {
    this.setItem(STORAGE_KEYS.TILLS, tills);
  }

  getCurrentTill(): Till {
    const tills = this.getTills();
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_TILL);
    const found = tills.find((t) => t.id === currentId);
    return found || tills[0];
  }

  setCurrentTill(tillId: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_TILL, tillId);
  }

  // Users
  getUsers(): User[] {
    return this.getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  saveUsers(users: User[]): void {
    this.setItem(STORAGE_KEYS.USERS, users);
  }

  getCurrentUser(): User {
    const users = this.getUsers();
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    const found = users.find((u) => u.id === currentId);
    return found || users[1]; // default to Owner (David Mwangi)
  }

  setCurrentUser(userId: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userId);
  }

  // Products
  getProducts(): Product[] {
    return this.getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }

  saveProducts(products: Product[]): void {
    this.setItem(STORAGE_KEYS.PRODUCTS, products);
  }

  // Customers
  getCustomers(): Customer[] {
    return this.getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }

  saveCustomers(customers: Customer[]): void {
    this.setItem(STORAGE_KEYS.CUSTOMERS, customers);
  }

  // Sales
  getSales(): Sale[] {
    return this.getItem<Sale[]>(STORAGE_KEYS.SALES, []);
  }

  saveSales(sales: Sale[]): void {
    this.setItem(STORAGE_KEYS.SALES, sales);
  }

  addSale(sale: Sale): void {
    const sales = this.getSales();
    sales.unshift(sale);
    this.saveSales(sales);

    // Update customer purchases & wallet if used
    if (sale.customerId) {
      const customers = this.getCustomers();
      const custIndex = customers.findIndex((c) => c.id === sale.customerId);
      if (custIndex >= 0) {
        customers[custIndex].totalPurchases += sale.totalAmount;
        if (sale.paymentDetails.walletAmount && sale.paymentDetails.walletAmount > 0) {
          customers[custIndex].walletBalance -= sale.paymentDetails.walletAmount;
          this.addWalletTx({
            id: `WTX-${Date.now()}`,
            customerId: sale.customerId,
            amount: -sale.paymentDetails.walletAmount,
            type: 'payment',
            reference: `Sale #${sale.receiptNumber}`,
            timestamp: new Date().toISOString(),
            staffId: sale.staffId,
            staffName: sale.attendantFirstName,
            notes: `Paid for order #${sale.orderNumber}`,
          });
        }
        this.saveCustomers(customers);
      }
    }

    // Deduct stock quantity
    const products = this.getProducts();
    for (const item of sale.items) {
      // 1. Deduct primary product stock
      const p = products.find((prod) => prod.id === item.product.id);
      if (p) {
        p.stockQuantity = Math.max(0, p.stockQuantity - item.quantity);
        p.updatedAt = new Date().toISOString();
      }

      // 2. AUTOMATIC MULTI-BASE COMPOSITION DEDUCTION:
      // If the sold item is a composite paint product, automatically deduct individual base quantities from inventory!
      const compRecipe = item.product.composition && item.product.composition.length > 0
        ? item.product.composition
        : (p && p.composition && p.composition.length > 0 ? p.composition : null);

      if (compRecipe && compRecipe.length > 0) {
        for (const comp of compRecipe) {
          const baseDeductQty = Math.round(comp.quantityRequired * item.quantity * 100) / 100;
          const baseProd = products.find((b) => b.id === comp.baseProductId);
          if (baseProd) {
            baseProd.stockQuantity = Math.max(0, Math.round((baseProd.stockQuantity - baseDeductQty) * 100) / 100);
            baseProd.updatedAt = new Date().toISOString();

            // Log stock movement for the constituent base
            this.addStockMovement({
              id: `SM-COMP-${Date.now()}-${comp.baseProductId.slice(-4)}-${Math.random().toString(36).substring(2, 5)}`,
              productId: baseProd.id,
              productName: baseProd.name,
              deltaQuantity: -baseDeductQty,
              type: 'dispense',
              reason: `Paint Formulation Base Dispense: ${comp.quantityRequired} ${comp.unit}/unit for ETR #${sale.receiptNumber} (${item.product.name} x${item.quantity})`,
              staffId: sale.staffId,
              notes: `Auto-deducted ${baseDeductQty} ${comp.unit} of constituent base`,
              referenceId: sale.id,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }
    this.saveProducts(products);

    // 3. If credit sale or unpaid balance, automatically create CreditSale ledger entry
    const totalPaid = (sale.paymentDetails.cashAmount || 0) + (sale.paymentDetails.mpesaAmount || 0) + (sale.paymentDetails.cardAmount || 0) + (sale.paymentDetails.walletAmount || 0);
    const balance = Math.max(0, sale.totalAmount - totalPaid);
    if (sale.paymentStatus === 'credit' || sale.paymentMethod === 'split' || balance > 0) {
      const creditSale: CreditSale = {
        id: `CS-${Date.now()}`,
        invoiceNumber: `INV-CR-${Date.now().toString().slice(-6)}`,
        receiptNumber: sale.receiptNumber,
        saleId: sale.id,
        customerId: sale.customerId || 'CUST-001',
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,
        customerKraPin: sale.customerKraPin,
        items: sale.items,
        subtotal: sale.subtotal,
        totalAmount: sale.totalAmount,
        amountPaid: totalPaid,
        balanceDue: balance,
        status: balance <= 0 ? 'paid' : (totalPaid > 0 ? 'partial' : 'unpaid'),
        creditTermsDays: 30,
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        tillId: sale.tillId,
        tillName: sale.tillName,
        staffId: sale.staffId,
        staffName: sale.attendantFirstName,
        payments: totalPaid > 0 ? [{
          id: `CPAY-${Date.now()}`,
          creditSaleId: `CS-${Date.now()}`,
          amount: totalPaid,
          paymentMethod: sale.paymentMethod === 'mpesa' ? 'mpesa' : 'cash',
          reference: sale.paymentReference || sale.orderNumber,
          receiptNumber: sale.receiptNumber,
          paymentDate: new Date().toISOString(),
          staffId: sale.staffId,
          staffName: sale.attendantFirstName,
          notes: 'Initial deposit paid at checkout',
        }] : [],
      };
      this.addCreditSale(creditSale);
    }

    // Add Audit Log
    this.addAuditLog({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'SALE_COMPLETED',
      module: 'POS_SALES',
      staffId: sale.staffId,
      staffName: sale.attendantFirstName,
      tillId: sale.tillId,
      details: `Issued ETR Receipt #${sale.receiptNumber} with KRA CU ${sale.cuNumber}. Total: ${sale.totalAmount} KES.`,
      severity: 'info',
      ipOrDevice: sale.tillName,
    });
  }

  // Merchant Sales (sale_audit)
  getMerchantSales(): MerchantSale[] {
    return this.getItem<MerchantSale[]>(STORAGE_KEYS.MERCHANT_SALES, []);
  }

  saveMerchantSales(sales: MerchantSale[]): void {
    this.setItem(STORAGE_KEYS.MERCHANT_SALES, sales);
  }

  addMerchantSale(ms: MerchantSale): void {
    const list = this.getMerchantSales();
    list.unshift(ms);
    this.saveMerchantSales(list);
    this.addAuditLog({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'MERCHANT_SALE_CREATED',
      module: 'MERCHANT_SALES',
      staffId: ms.staffId,
      staffName: ms.attendantFirstName,
      tillId: ms.tillId,
      details: `Created Merchant Sale #${ms.merchantOrderNumber} for ${ms.customerName}. Amount: ${ms.totalAmount} KES.`,
      severity: 'info',
      ipOrDevice: ms.tillName,
    });
  }

  // Quotations
  getQuotations(): Quotation[] {
    return this.getItem<Quotation[]>(STORAGE_KEYS.QUOTATIONS, []);
  }

  saveQuotations(quotes: Quotation[]): void {
    this.setItem(STORAGE_KEYS.QUOTATIONS, quotes);
  }

  addQuotation(quote: Quotation): void {
    const list = this.getQuotations();
    list.unshift(quote);
    this.saveQuotations(list);
    this.addAuditLog({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'QUOTATION_CREATED',
      module: 'QUOTATIONS',
      staffId: quote.staffId,
      staffName: quote.attendantFirstName,
      tillId: quote.tillId,
      details: `Generated Quotation #${quote.quoteNumber} for ${quote.customerName}. Valid until ${quote.validUntil}.`,
      severity: 'info',
      ipOrDevice: quote.tillId,
    });
  }

  // Deliveries
  getDeliveries(): Delivery[] {
    return this.getItem<Delivery[]>(STORAGE_KEYS.DELIVERIES, []);
  }

  saveDeliveries(deliveries: Delivery[]): void {
    this.setItem(STORAGE_KEYS.DELIVERIES, deliveries);
  }

  addDelivery(del: Delivery): void {
    const list = this.getDeliveries();
    list.unshift(del);
    this.saveDeliveries(list);
    this.addAuditLog({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'DELIVERY_NOTE_ISSUED',
      module: 'LOGISTICS_DELIVERIES',
      staffId: 'SYSTEM',
      staffName: 'Logistics Desk',
      tillId: 'DISPATCH',
      details: `Generated Delivery Note #${del.deliveryNumber} to ${del.customerName} via Vehicle ${del.vehicleReg}.`,
      severity: 'info',
      ipOrDevice: 'Dispatch Hub',
    });
  }

  // Purchases
  getPurchases(): Purchase[] {
    return this.getItem<Purchase[]>(STORAGE_KEYS.PURCHASES, []);
  }

  savePurchases(purchases: Purchase[]): void {
    this.setItem(STORAGE_KEYS.PURCHASES, purchases);
  }

  addPurchase(po: Purchase): void {
    const list = this.getPurchases();
    list.unshift(po);
    this.savePurchases(list);

    // If marked received, increment stock
    if (po.status === 'received') {
      const products = this.getProducts();
      for (const itm of po.items) {
        const p = products.find((x) => x.id === itm.productId);
        if (p) {
          p.stockQuantity += itm.quantity;
          p.costPrice = itm.unitCost;
          p.updatedAt = new Date().toISOString();
        }
      }
      this.saveProducts(products);
    }
  }

  // Suppliers
  getSuppliers(): Supplier[] {
    return this.getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  }

  saveSuppliers(suppliers: Supplier[]): void {
    this.setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  addAuditLog(log: AuditLog): void {
    const logs = this.getAuditLogs();
    logs.unshift(log);
    // Keep max 1000 logs
    if (logs.length > 1000) logs.length = 1000;
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // Security Threats
  getSecurityThreats(): SecurityThreat[] {
    return this.getItem<SecurityThreat[]>(STORAGE_KEYS.SECURITY_THREATS, []);
  }

  saveSecurityThreats(threats: SecurityThreat[]): void {
    this.setItem(STORAGE_KEYS.SECURITY_THREATS, threats);
  }

  addSecurityThreat(threat: SecurityThreat): void {
    const list = this.getSecurityThreats();
    list.unshift(threat);
    this.setItem(STORAGE_KEYS.SECURITY_THREATS, list);
  }

  // Held Carts
  getHeldCarts(): HeldCart[] {
    return this.getItem<HeldCart[]>(STORAGE_KEYS.HELD_CARTS, []);
  }

  saveHeldCarts(carts: HeldCart[]): void {
    this.setItem(STORAGE_KEYS.HELD_CARTS, carts);
  }

  // Wallet Transactions
  getWalletTxs(): WalletTransaction[] {
    return this.getItem<WalletTransaction[]>(STORAGE_KEYS.WALLET_TXS, []);
  }

  addWalletTx(tx: WalletTransaction): void {
    const list = this.getWalletTxs();
    list.unshift(tx);
    this.setItem(STORAGE_KEYS.WALLET_TXS, list);
  }

  // Stock Movements
  getStockMovements(): StockMovement[] {
    const defaultMovements: StockMovement[] = [
      {
        id: 'SM-001',
        productId: 'PRD-ELE-001',
        productName: 'East African Cables 2.5mm² Single Core Copper Wire (100m)',
        deltaQuantity: 45,
        type: 'initial_count',
        reason: 'Opening physical stock audit',
        staffId: '1001',
        notes: 'Verified against warehouse bin A-12',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'SM-002',
        productId: 'PRD-PNT-001',
        productName: 'Crown Paints Permacote with Teflon Exterior Emulsion (20L)',
        deltaQuantity: -2,
        type: 'dispense',
        reason: 'Customer sale #REC-2026-0001',
        staffId: '2042',
        notes: 'Color tinted White Whisper',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: 'SM-003',
        productId: 'PRD-MSN-001',
        productName: 'Bamburi Tembo Cement 32.5R (50kg Bag)',
        deltaQuantity: 100,
        type: 'goods_received',
        reason: 'GRN-2026-089 Delivery',
        staffId: '1001',
        notes: 'Offloaded from Bamburi depot truck',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ];
    return this.getItem<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, defaultMovements);
  }

  saveStockMovements(movements: StockMovement[]): void {
    this.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, movements);
  }

  addStockMovement(movement: StockMovement): void {
    const list = this.getStockMovements();
    list.unshift(movement);
    this.saveStockMovements(list);
  }

  adjustStockQuantity(
    productId: string,
    deltaQuantity: number,
    reason: string,
    staffId: string,
    notes?: string,
    referenceId?: string
  ): void {
    const products = this.getProducts();
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      prod.stockQuantity = Math.max(0, prod.stockQuantity + deltaQuantity);
      prod.updatedAt = new Date().toISOString();
      this.saveProducts(products);

      this.addStockMovement({
        id: referenceId || `SM-${Date.now()}`,
        productId,
        productName: prod.name,
        deltaQuantity,
        type: deltaQuantity > 0 ? 'adjustment_in' : 'adjustment_out',
        reason,
        staffId,
        notes,
        referenceId,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Product CRUD
  addProduct(p: Product): void {
    const list = this.getProducts();
    list.unshift(p);
    this.saveProducts(list);
    this.addAuditLog({
      id: `AUD-PRD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'PRODUCT_CREATED',
      module: 'INVENTORY_CATALOG',
      staffId: '1001',
      staffName: 'David Mwangi',
      tillId: 'SYS',
      details: `Created product "${p.name}" (SKU: ${p.sku}) at selling price ${p.sellingPrice} KES.`,
      severity: 'info',
      ipOrDevice: 'Catalog Admin',
    });
  }

  updateProduct(p: Product): void {
    const list = this.getProducts();
    const idx = list.findIndex((item) => item.id === p.id);
    if (idx >= 0) {
      list[idx] = { ...p, updatedAt: new Date().toISOString() };
      this.saveProducts(list);
      this.addAuditLog({
        id: `AUD-PRD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'PRODUCT_UPDATED',
        module: 'INVENTORY_CATALOG',
        staffId: '1001',
        staffName: 'David Mwangi',
        tillId: 'SYS',
        details: `Updated product "${p.name}". Stock: ${p.stockQuantity} ${p.unit}. Selling: ${p.sellingPrice} KES.`,
        severity: 'info',
        ipOrDevice: 'Catalog Admin',
      });
    }
  }

  deleteProduct(id: string): void {
    const list = this.getProducts();
    const found = list.find((p) => p.id === id);
    const filtered = list.filter((p) => p.id !== id);
    this.saveProducts(filtered);
    if (found) {
      this.addAuditLog({
        id: `AUD-PRD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'PRODUCT_DELETED',
        module: 'INVENTORY_CATALOG',
        staffId: '1001',
        staffName: 'David Mwangi',
        tillId: 'SYS',
        details: `Deleted product "${found.name}" (SKU: ${found.sku}).`,
        severity: 'warning',
        ipOrDevice: 'Catalog Admin',
      });
    }
  }

  // Quotation CRUD
  updateQuotation(q: Quotation): void {
    const list = this.getQuotations();
    const idx = list.findIndex((item) => item.id === q.id);
    if (idx >= 0) {
      list[idx] = q;
      this.saveQuotations(list);
    }
  }

  deleteQuotation(id: string): void {
    const list = this.getQuotations().filter((item) => item.id !== id);
    this.saveQuotations(list);
  }

  // Merchant Sale CRUD
  updateMerchantSale(ms: MerchantSale): void {
    const list = this.getMerchantSales();
    const idx = list.findIndex((item) => item.id === ms.id);
    if (idx >= 0) {
      list[idx] = ms;
      this.saveMerchantSales(list);
    }
  }

  deleteMerchantSale(id: string): void {
    const list = this.getMerchantSales().filter((item) => item.id !== id);
    this.saveMerchantSales(list);
  }

  // Purchase CRUD
  updatePurchase(p: Purchase): void {
    const list = this.getPurchases();
    const idx = list.findIndex((item) => item.id === p.id);
    if (idx >= 0) {
      list[idx] = p;
      this.savePurchases(list);
    }
  }

  deletePurchase(id: string): void {
    const list = this.getPurchases().filter((item) => item.id !== id);
    this.savePurchases(list);
  }

  // Supplier CRUD
  addSupplier(s: Supplier): void {
    const list = this.getSuppliers();
    list.unshift(s);
    this.saveSuppliers(list);
    this.addAuditLog({
      id: `AUD-SUP-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'SUPPLIER_CREATED',
      module: 'PROCUREMENT',
      staffId: '1001',
      staffName: 'David Mwangi',
      tillId: 'SYS',
      details: `Added supplier "${s.name}" (PIN: ${s.kraPin}).`,
      severity: 'info',
      ipOrDevice: 'Procurement Console',
    });
  }

  updateSupplier(s: Supplier): void {
    const list = this.getSuppliers();
    const idx = list.findIndex((item) => item.id === s.id);
    if (idx >= 0) {
      list[idx] = s;
      this.saveSuppliers(list);
    }
  }

  deleteSupplier(id: string): void {
    const list = this.getSuppliers().filter((item) => item.id !== id);
    this.saveSuppliers(list);
  }

  // Customer CRUD
  addCustomer(c: Customer): void {
    const list = this.getCustomers();
    list.unshift(c);
    this.saveCustomers(list);
  }

  updateCustomer(c: Customer): void {
    const list = this.getCustomers();
    const idx = list.findIndex((item) => item.id === c.id);
    if (idx >= 0) {
      list[idx] = c;
      this.saveCustomers(list);
    }
  }

  deleteCustomer(id: string): void {
    const list = this.getCustomers().filter((item) => item.id !== id);
    this.saveCustomers(list);
  }

  // Credit Sales & Customer Ledgers
  getCreditSales(): CreditSale[] {
    const defaultSales: CreditSale[] = [
      {
        id: 'CS-001',
        invoiceNumber: 'INV-CR-2026-0041',
        receiptNumber: 'REC-2026-0089',
        customerId: 'CUST-001',
        customerName: 'Apex Builders & Contractors Ltd',
        customerPhone: '+254 712 345 678',
        customerKraPin: 'P051999888W',
        items: [
          {
            product: INITIAL_PRODUCTS[4], // Crown Permaplast
            quantity: 10,
            unitPrice: 9400,
            discount: 0,
            total: 94000,
          },
          {
            product: INITIAL_PRODUCTS[0], // EAC Twin & Earth
            quantity: 5,
            unitPrice: 5200,
            discount: 0,
            total: 26000,
          },
        ],
        subtotal: 120000,
        totalAmount: 120000,
        amountPaid: 45000,
        balanceDue: 75000,
        status: 'partial',
        creditTermsDays: 30,
        dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        tillId: 'TILL-01',
        tillName: 'Till 01 - Main Electrical & POS Counter',
        staffId: '1001',
        staffName: 'David Mwangi',
        notes: 'Site delivery for Kilimani mixed development Phase 2',
        payments: [
          {
            id: 'CPAY-001',
            creditSaleId: 'CS-001',
            amount: 45000,
            paymentMethod: 'mpesa',
            reference: 'QKD8791023',
            receiptNumber: 'RCT-CR-001',
            paymentDate: new Date(Date.now() - 10 * 86400000).toISOString(),
            staffId: '1001',
            staffName: 'David Mwangi',
            notes: 'Initial deposit via M-Pesa Till',
          },
        ],
      },
      {
        id: 'CS-002',
        invoiceNumber: 'INV-CR-2026-0038',
        receiptNumber: 'REC-2026-0062',
        customerId: 'CUST-002',
        customerName: 'Eng. Peter Kamau (Private Contractor)',
        customerPhone: '+254 723 456 789',
        customerKraPin: 'A003456789X',
        items: [
          {
            product: INITIAL_PRODUCTS[1], // MCB
            quantity: 20,
            unitPrice: 550,
            discount: 0,
            total: 11000,
          },
        ],
        subtotal: 11000,
        totalAmount: 11000,
        amountPaid: 0,
        balanceDue: 11000,
        status: 'overdue',
        creditTermsDays: 14,
        dueDate: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
        createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
        tillId: 'TILL-01',
        tillName: 'Till 01 - Main Electrical & POS Counter',
        staffId: '2042',
        staffName: 'Sarah Wanjiku',
        notes: 'Kileleshwa bungalow rewiring contract',
        payments: [],
      },
      {
        id: 'CS-003',
        invoiceNumber: 'INV-CR-2026-0025',
        receiptNumber: 'REC-2026-0034',
        customerId: 'CUST-003',
        customerName: 'Metro Electrical Engineers Ltd',
        customerPhone: '+254 734 567 890',
        customerKraPin: 'P052111222K',
        items: [
          {
            product: INITIAL_PRODUCTS[0],
            quantity: 12,
            unitPrice: 5200,
            discount: 0,
            total: 62400,
          },
        ],
        subtotal: 62400,
        totalAmount: 62400,
        amountPaid: 62400,
        balanceDue: 0,
        status: 'paid',
        creditTermsDays: 30,
        dueDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
        createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
        tillId: 'TILL-01',
        tillName: 'Till 01 - Main Electrical & POS Counter',
        staffId: '1001',
        staffName: 'David Mwangi',
        notes: 'Mombasa Road logistics warehouse distribution panels',
        payments: [
          {
            id: 'CPAY-002',
            creditSaleId: 'CS-003',
            amount: 62400,
            paymentMethod: 'bank',
            reference: 'EFT-NCBA-98231',
            paymentDate: new Date(Date.now() - 6 * 86400000).toISOString(),
            staffId: '1001',
            staffName: 'David Mwangi',
            notes: 'Full settlement via NCBA RTGS Transfer',
          },
        ],
      },
    ];
    return this.getItem<CreditSale[]>(STORAGE_KEYS.CREDIT_SALES, defaultSales);
  }

  saveCreditSales(sales: CreditSale[]): void {
    this.setItem(STORAGE_KEYS.CREDIT_SALES, sales);
  }

  addCreditSale(cs: CreditSale): void {
    const list = this.getCreditSales();
    list.unshift(cs);
    this.saveCreditSales(list);
    this.addAuditLog({
      id: `AUD-CR-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'CREDIT_SALE_BOOKED',
      module: 'CREDIT_LEDGER',
      staffId: cs.staffId,
      staffName: cs.staffName,
      tillId: cs.tillId,
      details: `Booked Credit Invoice #${cs.invoiceNumber} for ${cs.customerName}. Amount: ${cs.totalAmount} KES. Due: ${cs.dueDate}.`,
      severity: 'info',
      ipOrDevice: cs.tillName || 'POS Terminal',
    });
  }

  updateCreditSale(cs: CreditSale): void {
    const list = this.getCreditSales();
    const idx = list.findIndex((item) => item.id === cs.id);
    if (idx >= 0) {
      list[idx] = cs;
      this.saveCreditSales(list);
    }
  }

  deleteCreditSale(id: string): void {
    const list = this.getCreditSales().filter((item) => item.id !== id);
    this.saveCreditSales(list);
  }

  recordCreditPayment(
    creditSaleId: string,
    amount: number,
    paymentMethod: 'cash' | 'mpesa' | 'bank' | 'cheque',
    reference: string,
    staffName: string,
    notes?: string
  ): void {
    const list = this.getCreditSales();
    const cs = list.find((item) => item.id === creditSaleId);
    if (!cs) return;

    const payment: CreditPayment = {
      id: `CPAY-${Date.now()}`,
      creditSaleId,
      amount,
      paymentMethod,
      reference,
      receiptNumber: `RCT-CR-${Date.now().toString().slice(-5)}`,
      paymentDate: new Date().toISOString(),
      staffId: '1001',
      staffName,
      notes,
    };

    cs.payments = [...(cs.payments || []), payment];
    cs.amountPaid += amount;
    cs.balanceDue = Math.max(0, cs.totalAmount - cs.amountPaid);
    if (cs.balanceDue <= 0) {
      cs.status = 'paid';
    } else {
      cs.status = 'partial';
    }
    this.saveCreditSales(list);

    // Also update customer ledger
    const customers = this.getCustomers();
    const cIdx = customers.findIndex((c) => c.id === cs.customerId);
    if (cIdx >= 0) {
      customers[cIdx].totalPurchases += 0; // already counted at sale
      this.saveCustomers(customers);
    }

    this.addAuditLog({
      id: `AUD-CRPAY-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'CREDIT_PAYMENT_COLLECTED',
      module: 'CREDIT_LEDGER',
      staffId: '1001',
      staffName,
      tillId: cs.tillId,
      details: `Collected ${amount} KES for Credit Invoice #${cs.invoiceNumber} (${cs.customerName}) via ${paymentMethod.toUpperCase()}. Remaining balance: ${cs.balanceDue} KES.`,
      severity: 'info',
      ipOrDevice: 'Credit Desk',
    });
  }

  // Reset to starter database
  resetToCleanDatabase(): void {
    localStorage.clear();
    this.saveOrg(INITIAL_ORG);
    this.saveTills(INITIAL_TILLS);
    this.saveUsers(INITIAL_USERS);
    this.saveProducts(INITIAL_PRODUCTS);
    this.saveCustomers(INITIAL_CUSTOMERS);
    this.saveSuppliers(INITIAL_SUPPLIERS);
    this.saveSales([]);
    this.saveMerchantSales([]);
    this.saveQuotations([]);
    this.saveDeliveries([]);
    this.savePurchases([]);
    this.setCurrentTill(INITIAL_TILLS[0].id);
    this.setCurrentUser(INITIAL_USERS[1].id); // David Mwangi (Owner)

    this.addAuditLog({
      id: `AUD-INIT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'SYSTEM_INITIALIZED',
      module: 'CORE_ENGINE',
      staffId: '1001',
      staffName: 'David Mwangi',
      tillId: 'TILL-01',
      details: 'BizoraOS Hardware & Electricals ERP POS Master initialized with clean schema and certified catalog.',
      severity: 'info',
      ipOrDevice: 'Local Terminal',
    });
  }
}

export const db = new DatabaseService();
