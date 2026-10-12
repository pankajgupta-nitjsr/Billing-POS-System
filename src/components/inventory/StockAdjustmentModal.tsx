import React, { useState } from 'react';
import { X, Layers, AlertCircle, Check } from 'lucide-react';
import { Product } from '@/types/models';
import { db } from '@/services/storage/database';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';

interface StockAdjustmentModalProps {
  onClose: () => void;
  onAdjusted: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  onClose,
  onAdjusted,
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useStore();
  const products = db.getProducts().filter((p) => p.active);

  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [adjustQtyInput, setAdjustQtyInput] = useState<string>('0');
  const [reason, setReason] = useState<string>('Physical Inventory Audit Correction');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const product = products.find((p) => p.id === selectedProductId);
  const currentStock = selectedVariantId
    ? product?.variants?.find((v) => v.id === selectedVariantId)?.stock ?? 0
    : product?.stock ?? 0;

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const qty = parseFloat(adjustQtyInput);
    if (isNaN(qty) || qty === 0) {
      setErrorMsg('Please specify a positive or negative quantity adjustment.');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Reason for stock adjustment is required for audit logs.');
      return;
    }

    const success = db.adjustStock(
      selectedProductId,
      selectedVariantId || undefined,
      qty,
      reason.trim(),
      currentUser
    );

    if (success) {
      addToast(
        'success',
        'Stock Adjusted',
        `Adjusted ${product?.name} by ${qty > 0 ? '+' : ''}${qty} units.`
      );
      onAdjusted();
      onClose();
    } else {
      setErrorMsg('Failed to adjust stock. Please check product details.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Owner Stock Adjustment
              </h3>
              <p className="text-xs text-slate-500">Manual inventory correction with audit log</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleAdjust} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Product
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setSelectedVariantId('');
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) &bull; Current Stock: {p.stock} {p.unit}
                </option>
              ))}
            </select>
          </div>

          {product?.hasVariants && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Variant (Optional)
              </label>
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="">All Variants (Base Product)</option>
                {product.variants?.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} &bull; Current Stock: {v.stock}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <span className="text-slate-500">Current Recorded Stock:</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {currentStock} {product?.unit}
            </span>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Adjustment Quantity (+ or -)
              </label>
              <span className="text-[11px] text-slate-500">
                e.g. +5 (found in storage) or -2 (damage)
              </span>
            </div>
            <input
              type="number"
              step="any"
              value={adjustQtyInput}
              onChange={(e) => setAdjustQtyInput(e.target.value)}
              placeholder="e.g. -2 or 5"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border-2 border-purple-500 text-slate-900 dark:text-white text-base font-bold outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Audit Reason <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Expired packaging, Physical audit count mismatch"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-2/3 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-sm flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Record Stock Adjustment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
