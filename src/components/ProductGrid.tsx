import React from 'react';
import { Product } from '../types';
import {
  Plus,
  Package,
  Layers,
  AlertTriangle,
  CheckCircle2,
  PaintBucket,
  Zap,
  Wrench,
  ShieldAlert,
  Droplets,
  ShoppingCart,
  Boxes,
  Sparkles,
} from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  currency: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToCart,
  currency,
}) => {
  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('paint')) return <PaintBucket className="w-5 h-5 text-indigo-600" />;
    if (c.includes('electric') || c.includes('cable')) return <Zap className="w-5 h-5 text-amber-600" />;
    if (c.includes('tool') || c.includes('hardware') || c.includes('fastener'))
      return <Wrench className="w-5 h-5 text-slate-700" />;
    if (c.includes('cement') || c.includes('masonry') || c.includes('plumb')) return <Layers className="w-5 h-5 text-emerald-700" />;
    return <Boxes className="w-5 h-5 text-blue-600" />;
  };

  const getCategoryTheme = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('paint')) return { badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80', bar: 'from-indigo-500 to-purple-600' };
    if (c.includes('electric') || c.includes('cable')) return { badge: 'bg-amber-50 text-amber-800 border-amber-200/80', bar: 'from-amber-500 to-orange-500' };
    if (c.includes('tool') || c.includes('hardware')) return { badge: 'bg-slate-100 text-slate-800 border-slate-300', bar: 'from-slate-600 to-slate-800' };
    if (c.includes('cement') || c.includes('masonry') || c.includes('plumb')) return { badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80', bar: 'from-emerald-500 to-teal-600' };
    return { badge: 'bg-blue-50 text-blue-700 border-blue-200/80', bar: 'from-blue-600 to-indigo-600' };
  };

  const handleCardClick = (product: Product) => {
    if (product.stockQuantity <= 0) return;
    if (product.status === 'suspended' || product.status === 'hold') return;
    // If raw base: user specified bases are only selected individually in purchases
    if (product.isPaintBase) {
      alert(`"${product.name}" is designated as a Raw Paint Base. Raw bases are procured individually in Purchases and mixed into finished paint formulations.`);
      return;
    }
    onAddToCart(product);
  };

  return (
    <div>
      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No products found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or select another department filter above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => {
            const isOut = product.stockQuantity <= 0;
            const isLowStock = !isOut && product.stockQuantity <= (product.minStockAlert || product.reorderLevel || 5);
            const isSuspended = product.status === 'suspended' || product.status === 'hold';
            const isComposite = product.isComposition && product.composition && product.composition.length > 0;
            const isRawBase = product.isPaintBase;
            const theme = getCategoryTheme(product.category);

            return (
              <div
                key={product.id}
                id={`product-card-${product.id}`}
                onClick={() => handleCardClick(product)}
                className={`group relative flex flex-col justify-between bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-0.5 ${
                  isOut || isSuspended
                    ? 'opacity-65 border-slate-200 bg-slate-50/70 cursor-not-allowed'
                    : isRawBase
                    ? 'border-dashed border-slate-300 bg-slate-50/50 cursor-pointer'
                    : 'border-slate-200/90 hover:border-blue-500/80 cursor-pointer'
                }`}
              >
                {/* Visual Top Bar Accent */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${theme.bar}`} />

                <div className="flex-1 flex flex-col justify-between">
                  {/* Top Thumbnail & Header */}
                  <div className="relative h-28 bg-gradient-to-b from-slate-50 to-slate-100/50 flex items-center justify-center border-b border-slate-100 p-3">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain mix-blend-multiply"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-white rounded-xl shadow-xs border border-slate-200/80 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                        {getCategoryIcon(product.category)}
                      </div>
                    )}

                    {/* Stock Pill Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      {isSuspended ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                          <ShieldAlert className="w-3 h-3" />
                          {product.status.toUpperCase()}
                        </span>
                      ) : isOut ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Depleted
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> {product.stockQuantity} {product.unit} (Low)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {product.stockQuantity} {product.unit}
                        </span>
                      )}
                    </div>

                    {/* Category Chip */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md border ${theme.badge}`}>
                        {product.category.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5 space-y-2">
                    <h4 className="text-xs font-black text-slate-900 leading-snug line-clamp-2 min-h-[2rem] group-hover:text-blue-700 transition-colors">
                      {product.name}
                    </h4>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{product.sku}</span>
                      <span>BC: {product.barcode.slice(-6)}</span>
                    </div>

                    {/* Paint Formulation Constituent Bases Listing */}
                    {isComposite ? (
                      <div className="bg-purple-50/80 border border-purple-200/80 rounded-xl p-2 space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-900">
                          <Droplets className="w-3.5 h-3.5 text-purple-600" />
                          <span>Mixed from {product.composition!.length} Bases:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {product.composition!.map((comp, ci) => (
                            <span
                              key={ci}
                              className="text-[9px] bg-white border border-purple-200 text-purple-800 font-medium px-1.5 py-0.5 rounded-md"
                            >
                              {comp.baseProductName.replace(/Crown Master Tint /g, '')} ({comp.quantityRequired}{comp.unit})
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : isRawBase ? (
                      <div className="bg-slate-100 border border-slate-200 rounded-xl p-2 text-[10px] text-slate-600 font-medium flex items-center gap-1.5">
                        <Boxes className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>Raw Base Material (Purchased Individually)</span>
                      </div>
                    ) : product.paintBaseIds && product.paintBaseIds.length > 0 ? (
                      <div className="bg-blue-50/80 border border-blue-200/70 rounded-xl p-1.5 text-[10px] text-blue-900 flex items-center gap-1 font-medium">
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        <span>Formulation: {product.paintBaseIds.join(', ')}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Footer Price & Add Action */}
                <div className="p-3.5 pt-2 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Price / {product.unit}
                    </div>
                    <div className="text-sm font-black text-slate-900 font-mono tracking-tight">
                      {currency} {product.sellingPrice.toLocaleString()}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isOut || isSuspended}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(product);
                    }}
                    className={`h-8 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 ${
                      isOut || isSuspended
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : isRawBase
                        ? 'bg-slate-700 hover:bg-slate-800 text-white'
                        : 'bg-[#101f42] hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isRawBase ? (
                      <span>Base Info</span>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
