import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Camera,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  TrendingDown,
  PauseCircle,
  CreditCard,
  Percent,
  Layers,
  Sparkles,
  AlertCircle,
  Tag,
  Check,
} from 'lucide-react';
import { Product, ProductVariant, CartItem, Sale } from '@/types/models';
import { db } from '@/services/storage/database';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { PricingEngine } from '@/services/pricing/pricingEngine';
import { CameraScannerModal } from './CameraScannerModal';
import { ExternalScannerListener } from './ExternalScannerListener';
import { ItemNegotiationModal } from './ItemNegotiationModal';
import { CartNegotiationModal } from './CartNegotiationModal';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { HeldBillsModal } from './HeldBillsModal';

export const PosScreen: React.FC = () => {
  const {
    items,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    applyItemNegotiation,
    subtotal,
    discountTotal,
    taxTotal,
    total,
    holdBill,
  } = useCart();
  const { currentUser, isOwner } = useAuth();
  const { settings, addToast } = useStore();

  const [products, setProducts] = useState<Product[]>(() => db.getProducts());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modals state
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [itemNegotiationTarget, setItemNegotiationTarget] = useState<CartItem | null>(null);
  const [cartNegotiationOpen, setCartNegotiationOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [heldBillsOpen, setHeldBillsOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Variant & Decimal picker state
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(null);
  const [selectedProductForDecimal, setSelectedProductForDecimal] = useState<Product | null>(null);
  const [decimalInputQty, setDecimalInputQty] = useState<string>('1.75');

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setProducts(db.getProducts());
    });
    return unsubscribe;
  }, []);

  // Global Keyboard Shortcuts (F2: Search, F4: Scan, F8: Hold, F9: Payment)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        setCameraModalOpen(true);
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (items.length > 0) holdBill();
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (items.length > 0) setPaymentModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, holdBill]);

  // Filter products by category & search query
  const filteredProducts = products.filter((p) => {
    if (!p.active) return false;
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const matchName = p.name.toLowerCase().includes(query);
    const matchSku = p.sku.toLowerCase().includes(query);
    const matchBarcode = p.barcode?.toLowerCase().includes(query);
    const matchBrand = p.brand?.toLowerCase().includes(query);
    return matchName || matchSku || matchBarcode || matchBrand;
  });

  const handleProductCardClick = (product: Product) => {
    if (product.hasVariants && product.variants && product.variants.length > 0) {
      setSelectedProductForVariants(product);
      return;
    }
    if (product.isDecimalUnit) {
      setSelectedProductForDecimal(product);
      setDecimalInputQty('1.0');
      return;
    }
    addItem(product);
  };

  const handleDecimalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProductForDecimal) {
      const qty = parseFloat(decimalInputQty);
      if (!isNaN(qty) && qty > 0) {
        addItem(selectedProductForDecimal, undefined, qty);
        setSelectedProductForDecimal(null);
      }
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Background External Barcode Scanner Listener */}
      <ExternalScannerListener />

      {/* LEFT PANE: PRODUCT SEARCH & CATALOG TERMINAL */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-hidden">
        {/* Search & Camera Scanner Bar */}
        <div className="p-3 lg:p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                data-scanner-input="true"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Name, SKU, Barcode... (F2)"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs lg:text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* 📷 SMARTPHONE CAMERA SCANNER BUTTON */}
            <button
              onClick={() => setCameraModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm shrink-0 transition"
              title="Open Smartphone Camera Scanner (F4)"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">📷 Scan Barcode (F4)</span>
              <span className="sm:hidden">Scan</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none">
            {['All', 'Grocery', 'Fashion', 'FMCG'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {cat === 'All' ? '🌟 All Items' : cat === 'Grocery' ? '🌾 Kirana / Grocery' : cat === 'Fashion' ? '👕 Fashion' : '🧴 FMCG'}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid Catalog */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Search className="w-10 h-10 mx-auto opacity-30 mb-2" />
              <p className="font-semibold text-sm">No products found matching &quot;{searchQuery}&quot;</p>
              <p className="text-xs text-slate-500 mt-1">Try searching by category or barcode code.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 lg:gap-3">
              {filteredProducts.map((prod) => {
                const inCart = items.find((i) => i.productId === prod.id);
                const isOutOfStock = prod.stock <= 0;

                return (
                  <div
                    key={prod.id}
                    onClick={() => handleProductCardClick(prod)}
                    className={`relative p-3 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer select-none ${
                      isOutOfStock
                        ? 'opacity-60 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Top Meta Tag & Category */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 truncate">
                          {prod.barcode || prod.sku}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            prod.stock <= prod.minStockAlert
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {prod.stock} {prod.unit}
                        </span>
                      </div>

                      {/* Name */}
                      <h4 className="font-semibold text-xs lg:text-sm text-slate-900 dark:text-white line-clamp-2 leading-tight">
                        {prod.name}
                      </h4>
                      {prod.brand && (
                        <span className="text-[11px] text-slate-400 block mt-0.5">{prod.brand}</span>
                      )}
                    </div>

                    {/* Price and Add Indication */}
                    <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            ₹{prod.sellingPrice}
                          </span>
                          {prod.mrp > prod.sellingPrice && (
                            <span className="text-[10px] text-slate-400 line-through">
                              ₹{prod.mrp}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">per {prod.unit}</span>
                      </div>

                      {/* In Cart Indicator */}
                      {inCart ? (
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                          {inCart.quantity}
                        </span>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANE: ACTIVE BILL & CART CHECKOUT */}
      <div className="w-full lg:w-[420px] xl:w-[460px] flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden shrink-0">
        {/* Bill Header */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs lg:text-sm text-slate-900 dark:text-white">Active Bill</h3>
              <p className="text-[11px] text-slate-500">
                Cashier: {currentUser.name.split(' ')[0]} ({currentUser.role})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setHeldBillsOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center gap-1 transition"
              title="Held Bills (F8)"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>Held</span>
            </button>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition"
                title="Clear Cart"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <ShoppingCart className="w-12 h-12 mx-auto opacity-20" />
              <p className="font-bold text-sm">Cart is empty</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Scan barcode using camera, type SKU in search, or click items from catalog.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border transition ${
                  item.isNegotiated
                    ? 'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40'
                }`}
              >
                {/* Line Item Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {item.name}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.barcode || item.sku}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      ₹{Math.round(item.unitPrice * item.quantity * 100) / 100}
                    </span>
                    {item.isNegotiated && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                        (₹{item.unitPrice}/{item.unit})
                      </span>
                    )}
                  </div>
                </div>

                {/* Line Item Controls & Bargain Action */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        updateItemQuantity(
                          item.id,
                          item.isDecimalUnit ? item.quantity - 0.25 : item.quantity - 1
                        )
                      }
                      className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-300"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      step={item.isDecimalUnit ? '0.01' : '1'}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItemQuantity(item.id, parseFloat(e.target.value) || 0)
                      }
                      className="w-12 text-center py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold outline-none"
                    />
                    <button
                      onClick={() =>
                        updateItemQuantity(
                          item.id,
                          item.isDecimalUnit ? item.quantity + 0.25 : item.quantity + 1
                        )
                      }
                      className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-300"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] text-slate-500 ml-0.5">{item.unit}</span>
                  </div>

                  {/* SMART NEGOTIATION / BARGAIN BUTTON */}
                  {item.negotiationEnabled && (
                    <button
                      onClick={() => setItemNegotiationTarget(item)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                        item.isNegotiated
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                      }`}
                      title="Item Bargain & Floor Price Override"
                    >
                      <TrendingDown className="w-3 h-3" />
                      <span>{item.isNegotiated ? `Bargain: ₹${item.unitPrice}` : 'Bargain'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom Summary & Checkout Actions */}
        {items.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3 shrink-0">
            {/* Cart Bargain Button */}
            <div className="flex items-center justify-between pb-1">
              <button
                onClick={() => setCartNegotiationOpen(true)}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Whole Cart Bargain (&quot;Kitna final karein?&quot;)</span>
              </button>
              <button
                onClick={() => holdBill()}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Hold Bill (F8)</span>
              </button>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
              <div className="flex justify-between">
                <span>Subtotal ({items.length} items):</span>
                <span>₹{subtotal}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between font-semibold text-emerald-600 dark:text-emerald-400">
                  <span>Negotiated Savings:</span>
                  <span>-₹{discountTotal}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>GST (Tax Included):</span>
                <span>₹{taxTotal}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white">
                <span className="font-bold text-sm">TOTAL AMOUNT:</span>
                <span className="font-black text-2xl tracking-tight text-emerald-600 dark:text-emerald-400">
                  ₹{total}
                </span>
              </div>
            </div>

            {/* Primary Payment Button */}
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-lg hover:shadow-emerald-600/20 flex items-center justify-center gap-2 transition active:scale-[0.99]"
            >
              <CreditCard className="w-5 h-5" />
              <span>COLLECT PAYMENT (F9) &bull; ₹{total}</span>
            </button>
          </div>
        )}
      </div>

      {/* CAMERA SCANNER MODAL */}
      {cameraModalOpen && (
        <CameraScannerModal
          onClose={() => setCameraModalOpen(false)}
          onCodeScanned={() => {}}
        />
      )}

      {/* ITEM NEGOTIATION MODAL (CRITICAL ACCEPTANCE TEST) */}
      {itemNegotiationTarget && (
        <ItemNegotiationModal
          item={itemNegotiationTarget}
          onClose={() => setItemNegotiationTarget(null)}
          onApplyNegotiation={applyItemNegotiation}
        />
      )}

      {/* CART NEGOTIATION MODAL */}
      {cartNegotiationOpen && (
        <CartNegotiationModal onClose={() => setCartNegotiationOpen(false)} />
      )}

      {/* PAYMENT MODAL */}
      {paymentModalOpen && (
        <PaymentModal
          onClose={() => setPaymentModalOpen(false)}
          onSaleCompleted={(sale) => setCompletedSale(sale)}
        />
      )}

      {/* RECEIPT & INVOICE PRINT MODAL */}
      {completedSale && (
        <ReceiptModal
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
        />
      )}

      {/* HELD BILLS MODAL */}
      {heldBillsOpen && (
        <HeldBillsModal onClose={() => setHeldBillsOpen(false)} />
      )}

      {/* FASHION VARIANTS SELECTOR MODAL */}
      {selectedProductForVariants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-5 shadow-2xl">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Select Variant for {selectedProductForVariants.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Choose size &amp; color variant</p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedProductForVariants.variants?.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    addItem(selectedProductForVariants, v);
                    setSelectedProductForVariants(null);
                  }}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 flex items-center justify-between text-xs font-semibold text-left transition"
                >
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{v.name}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Stock: {v.stock} | Barcode: {v.barcode}
                    </span>
                  </div>
                  <span className="text-emerald-600 font-bold">₹{v.sellingPrice}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedProductForVariants(null)}
              className="w-full mt-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* KIRANA DECIMAL QUANTITY SELECTOR MODAL */}
      {selectedProductForDecimal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleDecimalSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-3"
          >
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Enter Quantity ({selectedProductForDecimal.unit})
            </h3>
            <p className="text-xs text-slate-500">
              {selectedProductForDecimal.name} &bull; ₹{selectedProductForDecimal.sellingPrice}/
              {selectedProductForDecimal.unit}
            </p>

            <div>
              <input
                type="number"
                step="0.01"
                value={decimalInputQty}
                onChange={(e) => setDecimalInputQty(e.target.value)}
                placeholder="e.g. 1.75"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-emerald-500 text-slate-900 dark:text-white text-xl font-bold outline-none"
                autoFocus
                required
              />
            </div>

            {/* Quick weight presets */}
            <div className="flex gap-1.5 flex-wrap">
              {[0.25, 0.5, 1, 1.5, 1.75, 2, 5].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDecimalInputQty(String(preset))}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  {preset} {selectedProductForDecimal.unit}
                </button>
              ))}
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex justify-between">
              <span>Calculated Amount:</span>
              <span className="font-bold">
                ₹
                {Math.round(
                  selectedProductForDecimal.sellingPrice * (parseFloat(decimalInputQty) || 0) * 100
                ) / 100}
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedProductForDecimal(null)}
                className="w-1/3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-2/3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                Add to Cart
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
