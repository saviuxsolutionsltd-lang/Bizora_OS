import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Organization,
  Till,
  User,
  Product,
  Customer,
  Supplier,
  Sale,
  CartItem,
  Quotation,
  MerchantSale,
} from './types';
import { db } from './services/db';
import { makerChecker } from './services/makerChecker';
import { downloadFlutterProjectZip } from './services/flutterExport';

// Components
import { Sidebar, NavTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { InitialSetupWizard } from './components/InitialSetupWizard';
import { IdleLockModal } from './components/IdleLockModal';
import { ReceiptModal } from './components/ReceiptModal';
import { CheckoutModal } from './components/CheckoutModal';
import { MakerCheckerModal } from './components/MakerCheckerModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';

// Screens
import { DashboardScreen } from './screens/DashboardScreen';
import { PosScreen } from './screens/PosScreen';
import { InventoryScreen } from './screens/InventoryScreen';
import { StockLedgerScreen } from './screens/StockLedgerScreen';
import { SalesRegistersScreen } from './screens/SalesRegistersScreen';
import { CustomersPurchasesScreen } from './screens/CustomersPurchasesScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { TillEodScreen } from './screens/TillEodScreen';
import { SecurityScreen } from './screens/SecurityScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ExportScreen } from './screens/ExportScreen';

export default function App() {
  // Wizard status
  const [isSetupDone, setIsSetupDone] = useState<boolean>(() => db.isSetupDone());

  // Data states
  const [org, setOrg] = useState<Organization>(() => db.getOrg());
  const [tills, setTills] = useState<Till[]>(() => db.getTills());
  const [currentTill, setCurrentTill] = useState<Till>(() => db.getTills()[0]);
  const [users, setUsers] = useState<User[]>(() => db.getUsers());
  const [currentUser, setCurrentUser] = useState<User>(() => db.getUsers()[0]);
  const [products, setProducts] = useState<Product[]>(() => db.getProducts());
  const [customers, setCustomers] = useState<Customer[]>(() => db.getCustomers());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => db.getSuppliers());

  // Navigation state - default to 'dashboard' matching modern ERP overview
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Maker-Checker state
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(() => {
    return makerChecker.getPendingRequests().length;
  });
  const [isMakerCheckerModalOpen, setIsMakerCheckerModalOpen] = useState(false);

  // Barcode scanner modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Security & Idle Lock State
  const [isLocked, setIsLocked] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());

  // Modals
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);

  // Merchant Sale -> Final Sale Conversion Modal
  const [isConvertingCheckoutOpen, setIsConvertingCheckoutOpen] = useState(false);
  const [convertingCart, setConvertingCart] = useState<CartItem[]>([]);
  const [convertingCustomer, setConvertingCustomer] = useState<Customer>(() => db.getCustomers()[0]);
  const [convertingMerchantSaleId, setConvertingMerchantSaleId] = useState<string | undefined>(undefined);

  // Poll / Refresh pending approvals count
  const refreshPendingCount = useCallback(() => {
    setPendingApprovalsCount(makerChecker.getPendingRequests().length);
  }, []);

  useEffect(() => {
    const timer = setInterval(refreshPendingCount, 2000);
    return () => clearInterval(timer);
  }, [refreshPendingCount]);

  // Auto-Lock Inactivity Timer
  useEffect(() => {
    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    const interval = setInterval(() => {
      if (org.autoLockEnabled && !isLocked) {
        const elapsedMinutes = (Date.now() - lastActivityRef.current) / 60000;
        if (elapsedMinutes >= (org.idleTimeoutMinutes || 5)) {
          setIsLocked(true);
        }
      }
    }, 15000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      clearInterval(interval);
    };
  }, [org.autoLockEnabled, org.idleTimeoutMinutes, isLocked]);

  // Reload helpers
  const reloadOrg = useCallback(() => setOrg(db.getOrg()), []);
  const reloadTills = useCallback(() => setTills(db.getTills()), []);
  const reloadUsers = useCallback(() => setUsers(db.getUsers()), []);
  const reloadProducts = useCallback(() => setProducts(db.getProducts()), []);
  const reloadCustomers = useCallback(() => setCustomers(db.getCustomers()), []);
  const reloadSuppliers = useCallback(() => setSuppliers(db.getSuppliers()), []);

  // Setup completion callback
  const handleSetupComplete = () => {
    setIsSetupDone(true);
    reloadOrg();
    reloadTills();
    reloadUsers();
    setCurrentTill(db.getTills()[0]);
    setCurrentUser(db.getUsers()[0]);
  };

  // Convert Quotation to POS Cart
  const handleConvertQuoteToSale = (quote: Quotation) => {
    const cust = customers.find((c) => c.id === quote.customerId) || {
      id: quote.customerId || 'CUST-001',
      name: quote.customerName,
      phone: '+254 700 000 000',
      walletBalance: 0,
      creditLimit: 50000,
      totalPurchases: 0,
      createdAt: new Date().toISOString(),
    };

    const cart: CartItem[] = quote.items.map((it) => ({
      product: it.product,
      quantity: it.quantity,
      selectedPaintBaseId: it.selectedPaintBaseId,
      unitPrice: it.unitPrice,
      discount: it.discount || 0,
      total: it.total,
      notes: it.notes,
    }));

    setConvertingCart(cart);
    setConvertingCustomer(cust);
    setConvertingMerchantSaleId(undefined);
    setIsConvertingCheckoutOpen(true);
  };

  // Convert Merchant Sale to Final Fiscal Sale (Checkout)
  const handleConvertMerchantSaleToFinal = (merchantSale: MerchantSale) => {
    const cust = customers.find((c) => c.id === merchantSale.customerId) || {
      id: merchantSale.customerId || 'CUST-001',
      name: merchantSale.customerName,
      phone: '+254 700 000 000',
      walletBalance: 0,
      creditLimit: 50000,
      totalPurchases: 0,
      createdAt: new Date().toISOString(),
    };

    const cart: CartItem[] = merchantSale.items.map((it) => ({
      product: it.product,
      quantity: it.quantity,
      selectedPaintBaseId: it.selectedPaintBaseId,
      unitPrice: it.unitPrice,
      discount: it.discount || 0,
      total: it.total,
      notes: it.notes,
    }));

    setConvertingCart(cart);
    setConvertingCustomer(cust);
    setConvertingMerchantSaleId(merchantSale.id);
    setIsConvertingCheckoutOpen(true);
  };

  // Compute Navbar screen title based on active tab
  const getScreenTitle = (tab: NavTab): string => {
    switch (tab) {
      case 'dashboard':
        return 'Executive Operational Dashboard';
      case 'pos':
        return 'Retail & Merchant POS Terminal';
      case 'products_catalog':
      case 'inventory':
        return 'Products & Hardware Catalog';
      case 'inventory_stock':
        return 'Inventory & Stock Movement Ledger';
      case 'sales_quotations':
      case 'sales':
      case 'quotations':
      case 'sales_audit':
      case 'final_sales':
        return 'Sales Registers & Quotations';
      case 'customers_purchases':
      case 'customers':
      case 'purchases':
      case 'suppliers':
        return 'Customers, Procurement & Supplier Ledgers';
      case 'reports':
        return 'Syncfusion Executive Analytics & Fiscal Reporting';
      case 'till_drawer':
      case 'till_eod':
        return 'Till Drawer Cashier Sessions & EOD Balancing';
      case 'security':
        return 'Security & 3-Layer Audit Logs';
      case 'settings':
        return 'Organization Setup & System Admin';
      case 'export':
        return 'Cross-Platform Flutter & Local PHP Export';
      default:
        return 'Executive Operational Dashboard';
    }
  };

  // If initial setup wizard is not finished, show wizard
  if (!isSetupDone) {
    return <InitialSetupWizard onComplete={handleSetupComplete} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900 select-none">
      {/* 1. Left Sidebar Navigation (Dark Navy #101f42, 64px collapsed / 240px expanded) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        currentUser={currentUser}
        pendingApprovalsCount={pendingApprovalsCount}
        onOpenExport={() => setActiveTab('export')}
        onLockScreen={() => setIsLocked(true)}
      />

      {/* 2. Main Workstation Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        {/* Top Navigation Bar with exact screenshots styling */}
        <Navbar
          screenTitle={getScreenTitle(activeTab)}
          org={org}
          currentTill={currentTill}
          currentUser={currentUser}
          tills={tills}
          users={users}
          onSelectTill={(t) => setCurrentTill(t)}
          onSelectUser={(u) => setCurrentUser(u)}
          onOpenScanner={() => setIsScannerOpen(true)}
          onLockScreen={() => setIsLocked(true)}
          onOpenOrgSetup={() => setActiveTab('settings')}
          onDownloadZip={() => downloadFlutterProjectZip(org)}
          pendingApprovalsCount={pendingApprovalsCount}
          onOpenMakerChecker={() => setIsMakerCheckerModalOpen(true)}
        />

        {/* Dynamic Screen View */}
        <div className="flex-1 overflow-y-auto relative bg-slate-50">
          {activeTab === 'dashboard' && (
            <DashboardScreen
              org={org}
              currentTill={currentTill}
              currentUser={currentUser}
              products={products}
              sales={db.getSales()}
              merchantSales={db.getMerchantSales()}
              customers={customers}
              onNavigate={(tab) => setActiveTab(tab)}
              onSelectSaleReceipt={(sale) => setActiveReceiptSale(sale)}
            />
          )}

          {activeTab === 'pos' && (
            <PosScreen
              products={products}
              customers={customers}
              currentTill={currentTill}
              currentUser={currentUser}
              org={org}
              onCheckoutSuccess={(sale) => {
                reloadProducts();
                setActiveReceiptSale(sale);
              }}
              onSaveQuotation={(cart, cust, note) => {
                const quoteNumber = `QT-${Date.now().toString().slice(-6)}`;
                const total = cart.reduce((s, i) => s + i.total, 0);
                const validUntilDate = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

                const newQuote: Quotation = {
                  id: `QT-${Date.now()}`,
                  quoteNumber,
                  customerId: cust.id,
                  customerName: cust.name,
                  items: cart,
                  totalAmount: total,
                  validUntil: validUntilDate,
                  status: 'active',
                  notes: note,
                  createdAt: new Date().toISOString(),
                  createdByStaffId: currentUser.staffId,
                };
                db.addQuotation(newQuote);
                alert(`Quotation #${quoteNumber} created successfully! Valid for 14 days.`);
              }}
              onSaveMerchantSale={(cart, cust, note) => {
                const orderNum = `MO-${Date.now().toString().slice(-6)}`;
                const total = cart.reduce((s, i) => s + i.total, 0);

                const newMS: MerchantSale = {
                  id: `MS-${Date.now()}`,
                  merchantOrderNumber: orderNum,
                  customerId: cust.id,
                  customerName: cust.name,
                  customerPhone: cust.phone || '',
                  customerAddress: cust.address || '',
                  customerKraPin: cust.kraPin || '',
                  items: cart,
                  totalAmount: total,
                  subtotal: total,
                  status: 'pending',
                  internalNotes: note,
                  createdAt: new Date().toISOString(),
                  staffId: currentUser.staffId,
                  tillId: currentTill.id,
                };
                db.addMerchantSale(newMS);
                alert(`Merchant Sale Order #${orderNum} recorded as internal draft/proforma!`);
              }}
            />
          )}

          {(activeTab === 'products_catalog' || activeTab === 'inventory') && (
            <InventoryScreen
              products={products}
              org={org}
              currentUser={currentUser}
              users={users}
              currentTillId={currentTill.id}
              onReloadProducts={reloadProducts}
            />
          )}

          {activeTab === 'inventory_stock' && (
            <StockLedgerScreen
              products={products}
              org={org}
              currentUser={currentUser}
              users={users}
              currentTillId={currentTill.id}
              onStockUpdated={reloadProducts}
            />
          )}

          {(activeTab === 'sales_quotations' ||
            activeTab === 'sales' ||
            activeTab === 'quotations' ||
            activeTab === 'sales_audit' ||
            activeTab === 'final_sales') && (
            <SalesRegistersScreen
              org={org}
              currentTill={currentTill}
              currentUser={currentUser}
              onViewReceipt={(sale) => setActiveReceiptSale(sale)}
              onConvertMerchantSale={handleConvertMerchantSaleToFinal}
              onConvertQuote={handleConvertQuoteToSale}
            />
          )}

          {(activeTab === 'customers_purchases' ||
            activeTab === 'customers' ||
            activeTab === 'purchases' ||
            activeTab === 'suppliers') && (
            <CustomersPurchasesScreen
              customers={customers}
              suppliers={suppliers}
              products={products}
              org={org}
              currentUser={currentUser}
              users={users}
              onReloadCustomers={reloadCustomers}
              onReloadSuppliers={reloadSuppliers}
              onReloadProducts={reloadProducts}
              onViewReceipt={(sale) => setActiveReceiptSale(sale)}
            />
          )}

          {activeTab === 'reports' && <ReportsScreen org={org} />}

          {(activeTab === 'till_drawer' || activeTab === 'till_eod') && (
            <TillEodScreen
              tills={tills}
              currentTill={currentTill}
              currentUser={currentUser}
              org={org}
            />
          )}

          {activeTab === 'security' && (
            <SecurityScreen
              org={org}
              currentTill={currentTill}
              currentUser={currentUser}
              users={users}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsScreen
              org={org}
              currentTill={currentTill}
              currentUser={currentUser}
              tills={tills}
              users={users}
              onReloadOrg={reloadOrg}
              onReloadTills={reloadTills}
              onReloadUsers={reloadUsers}
            />
          )}

          {activeTab === 'export' && <ExportScreen org={org} />}
        </div>
      </div>

      {/* 3. Idle Lock Screen Modal (6-digit PIN pad) */}
      <IdleLockModal
        isLocked={isLocked}
        currentUser={currentUser}
        users={users}
        onUnlock={() => {
          setIsLocked(false);
          lastActivityRef.current = Date.now();
        }}
        onSwitchUser={(u) => {
          setCurrentUser(u);
          setIsLocked(false);
          lastActivityRef.current = Date.now();
        }}
      />

      {/* 4. Thermal Receipt Modal (80mm / 58mm with eTIMS QR) */}
      {activeReceiptSale && (
        <ReceiptModal
          sale={activeReceiptSale}
          org={org}
          onClose={() => setActiveReceiptSale(null)}
        />
      )}

      {/* 5. Conversion Checkout Modal (for Quotations and Merchant Sales) */}
      {isConvertingCheckoutOpen && (
        <CheckoutModal
          isOpen={isConvertingCheckoutOpen}
          onClose={() => setIsConvertingCheckoutOpen(false)}
          cartItems={convertingCart}
          customer={convertingCustomer}
          org={org}
          currentTill={currentTill}
          currentUser={currentUser}
          saleType="final_sale"
          existingMerchantSaleId={convertingMerchantSaleId}
          onComplete={(sale) => {
            setIsConvertingCheckoutOpen(false);
            reloadProducts();
            setActiveReceiptSale(sale);
          }}
        />
      )}

      {/* 6. Maker-Checker Global Approvals Modal */}
      {isMakerCheckerModalOpen && (
        <MakerCheckerModal
          isOpen={isMakerCheckerModalOpen}
          onClose={() => {
            setIsMakerCheckerModalOpen(false);
            refreshPendingCount();
          }}
          currentUser={currentUser}
          users={users}
        />
      )}

      {/* 7. Barcode Scanner Modal */}
      {isScannerOpen && (
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScan={(scannedBarcode) => {
            setIsScannerOpen(false);
            const foundProduct = products.find(
              (p) => p.barcode === scannedBarcode || p.sku.toLowerCase() === scannedBarcode.toLowerCase()
            );
            if (foundProduct) {
              setActiveTab('pos');
              alert(`Scanned: ${foundProduct.name} (${foundProduct.sku}). Ready in POS.`);
            } else {
              alert(`Scanned barcode: ${scannedBarcode} (Not in catalog).`);
            }
          }}
        />
      )}
    </div>
  );
}
