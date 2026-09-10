import React, { useState } from 'react';
import { Product, CartItem, Customer, Organization, Till, User, HeldCart, Sale, MerchantSale } from '../types';
import { db } from '../services/db';
import { ProductGrid } from '../components/ProductGrid';
import { CheckoutModal } from '../components/CheckoutModal';
import {
  Search,
  ShoppingCart,
  Trash2,
  PauseCircle,
  PlayCircle,
  FileText,
  CreditCard,
  Camera,
  Plus,
  Minus,
  Sparkles,
  Tag,
  AlertCircle,
  Layers,
} from 'lucide-react';

interface PosScreenProps {
  products: Product[];
  customers: Customer[];
  currentTill: Till;
  currentUser: User;
  org: Organization;
  onOpenScanner?: () => void;
  onSaleCompleted?: (sale: Sale) => void;
  onCheckoutSuccess?: (sale: Sale) => void;
  onMerchantSaleCompleted?: (ms: MerchantSale) => void;
  onReloadCustomers?: () => void;
  onSaveQuotation?: (cart: CartItem[], cust: Customer, note?: string) => void;
  onSaveMerchantSale?: (cart: CartItem[], cust: Customer, note?: string) => void;
}

export const PosScreen: React.FC<PosScreenProps> = ({
  products,
  customers,
  currentTill,
  currentUser,
  org,
  onOpenScanner,
  onSaleCompleted,
  onCheckoutSuccess,
  onMerchantSaleCompleted,
  onReloadCustomers,
  onSaveQuotation,
  onSaveMerchantSale,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [cartNotes, setCartNotes] = useState('');

  // Checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Held carts modal
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>(() => db.getHeldCarts());

  // Category listing
  const categories = [
    'ALL',
    'Electricals & Cables',
    'Lighting & Fixtures',
    'Paints & Coatings',
    'Plumbing & Pipes',
    'Fasteners & Hardware',
    'Power Tools',
    'Masonry & Cement',
  ];

  // Filtering products
  const filteredProducts = products.filter((p) => {
    if (p.status === 'suspended') return false;
    const matchesCategory =
      selectedCategory === 'ALL' ||
      p.category.toLowerCase().includes(selectedCategory.toLowerCase().slice(0, 5));

    const s = searchTerm.toLowerCase().trim();
    if (!s) return matchesCategory;

    const matchesName = p.name.toLowerCase().includes(s);
    const matchesSku = p.sku.toLowerCase().includes(s);
    const matchesBarcode = p.barcode.includes(s);
    const matchesBase = p.paintBaseIds?.some((b) => b.toLowerCase().includes(s));

    return matchesCategory && (matchesName || matchesSku || matchesBarcode || matchesBase);
  });

  const handleAddToCart = (product: Product, selectedPaintBaseId?: string) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id && item.selectedPaintBaseId === selectedPaintBaseId,
      );

      if (existingIndex >= 0) {
        const next = [...prev];
        const newQty = next[existingIndex].quantity + 1;
        next[existingIndex].quantity = newQty;
        next[existingIndex].total = newQty * next[existingIndex].unitPrice;
        return next;
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            selectedPaintBaseId,
            unitPrice: product.sellingPrice,
            discount: 0,
            total: product.sellingPrice,
          },
        ];
      }
    });
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    setCartItems((prev) => {
      const next = [...prev];
      const item = next[index];
      const newQty = item.quantity + delta;

      if (newQty <= 0) {
        return next.filter((_, i) => i !== index);
      }

      item.quantity = newQty;
      item.total = newQty * item.unitPrice;
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCartItems([]);
    setDiscountPercent(0);
    setCartNotes('');
  };

  // Calculations
  const grossSubtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = (grossSubtotal * discountPercent) / 100;
  const netTotal = Math.max(0, grossSubtotal - discountAmount);
  // Kenya VAT is standard 16% inclusive
  const taxAmount = (netTotal * 16) / 116;
  const subtotalExclTax = netTotal - taxAmount;

  // Hold Cart
  const handleHoldCart = () => {
    if (cartItems.length === 0) return;
    const newHeldCart: HeldCart = {
      id: `HOLD-${Date.now()}`,
      title: `Held Cart (${cartItems.length} items)`,
      customerName: 'Customer at Counter',
      items: cartItems,
      savedAt: new Date().toISOString(),
      staffId: currentUser.staffId,
      tillId: currentTill.id,
    };
    const updated = [newHeldCart, ...heldCarts];
    setHeldCarts(updated);
    db.saveHeldCarts(updated);
    handleClearCart();

    db.addAuditLog({
      id: `AUD-HOLD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'CART_SUSPENDED',
      module: 'POS_SALES',
      staffId: currentUser.staffId,
      staffName: currentUser.firstName,
      tillId: currentTill.id,
      details: `Suspended cart with ${cartItems.length} items (Total: KES ${netTotal.toLocaleString()}).`,
      severity: 'info',
      ipOrDevice: currentTill.name,
    });
  };

  const handleResumeHeldCart = (held: HeldCart) => {
    setCartItems(held.items);
    const updated = heldCarts.filter((h) => h.id !== held.id);
    setHeldCarts(updated);
    db.saveHeldCarts(updated);
    setIsHeldModalOpen(false);
  };

  // Save directly as Quotation
  const handleSaveAsQuotation = () => {
    if (cartItems.length === 0) return;
    const quoteNumber = `QT-${Date.now().toString().slice(-6)}`;
    const validUntil = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const quote = {
      id: `QUOTE-${Date.now()}`,
      quoteNumber,
      customerId: 'WALK-IN',
      customerName: 'Quotation Inquirer',
      customerPhone: '',
      items: cartItems,
      subtotal: subtotalExclTax,
      totalAmount: netTotal,
      validUntil,
      status: 'active' as const,
      tillId: currentTill.id,
      staffId: currentUser.staffId,
      attendantFirstName: currentUser.firstName,
      createdAt: new Date().toISOString(),
      notes: cartNotes,
      auditTimeline: [
        {
          title: 'Quotation Generated',
          description: `Prepared by ${currentUser.firstName} (ID: ${currentUser.staffId}) on ${currentTill.name}. Valid until ${validUntil}`,
          timestamp: new Date().toISOString(),
          actor: currentUser.firstName,
          stage: 'quotation' as const,
        },
      ],
    };

    db.addQuotation(quote);
    handleClearCart();
    alert(`Quotation #${quoteNumber} successfully created and saved in the Quotations module!`);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-slate-100">
      {/* Left Area: Search, Categories, Image-Aware Product Grid */}
      <div className="flex-1 flex flex-col p-5 overflow-hidden">
        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by product name, SKU, barcode, or paint base..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 shadow-2xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOpenScanner}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition"
            >
              <Camera className="w-4 h-4" />
              <span>Camera Scan</span>
            </button>

            {heldCarts.length > 0 && (
              <button
                type="button"
                onClick={() => setIsHeldModalOpen(true)}
                className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
              >
                <PlayCircle className="w-4 h-4 text-amber-600" />
                <span>Recall ({heldCarts.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Product Grid Container */}
        <div className="flex-1 overflow-y-auto pr-1">
          <ProductGrid
            products={filteredProducts}
            onAddToCart={handleAddToCart}
            currency={org.currency}
          />
        </div>
      </div>

      {/* Right Area: Active Cart & Quick Checkout Panel */}
      <div className="w-full lg:w-96 bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-lg">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Current Order</h3>
              <p className="text-[11px] text-slate-500">{cartItems.length} line items</p>
            </div>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingCart className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">Cart is empty</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Click products on the grid or use the camera barcode scanner to add items.
              </p>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div
                key={`${item.product.id}-${item.selectedPaintBaseId || 'base'}`}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-300 transition shadow-2xs text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h5 className="font-bold text-slate-900 leading-tight">{item.product.name}</h5>
                    {item.product.paintBaseIds && item.product.paintBaseIds.length > 0 && (
                      <div className="mt-1 text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block font-medium">
                        Formulation Bases: {item.product.paintBaseIds.join(', ')}
                      </div>
                    )}
                    {item.selectedPaintBaseId && (!item.product.paintBaseIds || item.product.paintBaseIds.length === 0) && (
                      <span className="inline-block mt-0.5 text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                        Tint Base: {item.selectedPaintBaseId}
                      </span>
                    )}
                    <div className="text-[11px] text-slate-500 font-mono mt-1">
                      {org.currency} {item.unitPrice.toLocaleString()} / {item.product.unit}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(idx, -1)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-bold text-xs font-mono">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(idx, 1)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="font-mono font-bold text-slate-900 text-xs">
                    {org.currency} {item.total.toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary & Actions */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
            {/* Quick Discount Pill */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Order Discount:</span>
              <div className="flex items-center gap-1">
                {[0, 2, 5, 10].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiscountPercent(d)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      discountPercent === d
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {d}%
                  </button>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="space-y-1 text-xs text-slate-600 pt-1">
              <div className="flex justify-between">
                <span>Subtotal (Net Excl. VAT):</span>
                <span className="font-mono">{org.currency} {subtotalExclTax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>16% VAT (Included):</span>
                <span className="font-mono">{org.currency} {taxAmount.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount ({discountPercent}%):</span>
                  <span className="font-mono">-{org.currency} {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 font-extrabold text-base text-slate-900">
                <span>Total Payable:</span>
                <span className="font-mono text-lg text-blue-700">
                  {org.currency} {netTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleHoldCart}
                className="py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition"
              >
                <PauseCircle className="w-3.5 h-3.5 text-slate-600" />
                <span>Hold Cart</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAsQuotation}
                className="py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition"
              >
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                <span>As Quotation</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-sm font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 transition"
            >
              <CreditCard className="w-4 h-4" />
              <span>Charge & Issue ETR ({org.currency} {netTotal.toLocaleString()})</span>
            </button>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        subtotal={subtotalExclTax}
        taxAmount={taxAmount}
        discountTotal={discountAmount}
        totalAmount={netTotal}
        customers={customers}
        currentTill={currentTill}
        currentUser={currentUser}
        org={org}
        onSuccessSale={(sale) => {
          handleClearCart();
          if (onCheckoutSuccess) onCheckoutSuccess(sale);
          if (onSaleCompleted) onSaleCompleted(sale);
        }}
        onSuccessMerchantSale={(ms) => {
          handleClearCart();
          if (onMerchantSaleCompleted) onMerchantSaleCompleted(ms);
        }}
        onReloadCustomers={onReloadCustomers || (() => {})}
      />

      {/* Held Carts Recall Modal */}
      {isHeldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <PlayCircle className="w-4 h-4 text-amber-600" />
                <span>Suspended / Held Orders</span>
              </h4>
              <button
                onClick={() => setIsHeldModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {heldCarts.map((held) => (
                <div
                  key={held.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">{held.title}</div>
                    <div className="text-[10px] text-slate-500">
                      Saved: {new Date(held.savedAt).toLocaleTimeString()} • Staff ID: {held.staffId}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleResumeHeldCart(held)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs"
                  >
                    Resume
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
