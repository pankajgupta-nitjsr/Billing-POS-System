import React, { useState } from 'react';
import { X, RotateCcw, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { Sale, SaleReturn, ReturnItem } from '@/types/models';
import { db } from '@/services/storage/database';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { PricingEngine } from '@/services/pricing/pricingEngine';

interface ReturnsModalProps {
  sale: Sale;
  onClose: () => void;
  onReturnCompleted: () => void;
}

export const ReturnsModal: React.FC<ReturnsModalProps> = ({
  sale,
  onClose,
  onReturnCompleted,
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useStore();

  const [returnItems, setReturnItems] = useState<{ [cartItemId: string]: number }>(() => {
    const map: { [id: string]: number } = {};
    sale.items.forEach((it) => {
      map[it.id] = it.quantity; // default to returning all
    });
    return map;
  });

  const [refundMethod, setRefundMethod] = useState<'CASH' | 'UPI' | 'CREDIT'>('CASH');
  const [reason, setReason] = useState<string>('Size / Fit Mismatch');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Calculate total refund amount
  const calculateRefund = () => {
    let sum = 0;
    sale.items.forEach((it) => {
      const qty = returnItems[it.id] || 0;
      if (qty > 0) {
        sum += it.unitPrice * qty;
      }
    });
    return Math.round(sum * 100) / 100;
  };

  const handleProcessReturn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const itemsToReturn: ReturnItem[] = [];
    sale.items.forEach((it) => {
      const qty = returnItems[it.id] || 0;
      if (qty > 0) {
        itemsToReturn.push({
          cartItemId: it.id,
          productId: it.productId,
          variantId: it.variantId,
          name: it.name,
          quantity: qty,
          unitPrice: it.unitPrice,
          refundAmount: it.unitPrice * qty,
        });
      }
    });

    if (itemsToReturn.length === 0) {
      setErrorMsg('Please select at least one item and quantity to return.');
      return;
    }

    const totalRefund = calculateRefund();

    const saleReturn: SaleReturn = {
      id: `ret_${Date.now()}`,
      storeId: sale.storeId,
      saleId: sale.id,
      invoiceNumber: sale.invoiceNumber,
      items: itemsToReturn,
      totalRefund,
      refundMethod,
      reason: reason.trim(),
      processedBy: currentUser.id,
      processedByName: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    const success = db.processReturn(saleReturn, currentUser);
    if (success) {
      addToast('success', 'Return Processed', `Refunded ₹${totalRefund}. Inventory restored.`);
      onReturnCompleted();
      onClose();
    } else {
      setErrorMsg('Failed to process return. Please check invoice details.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Sales Return &amp; Refund
              </h3>
              <p className="text-xs text-slate-500">Invoice: {sale.invoiceNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleProcessReturn} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <p className="text-slate-600 dark:text-slate-400">
            Select items and quantities being returned. Stock quantities will automatically restore to inventory.
          </p>

          {/* Items Return Table */}
          <div className="space-y-2">
            {sale.items.map((it) => {
              const currentReturnQty = returnItems[it.id] || 0;
              return (
                <div
                  key={it.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      {it.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Billed: {it.quantity} {it.unit} &bull; Rate: ₹{it.unitPrice}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-slate-500">Return Qty:</label>
                    <input
                      type="number"
                      step={it.isDecimalUnit ? '0.01' : '1'}
                      min={0}
                      max={it.quantity}
                      value={currentReturnQty}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setReturnItems({
                          ...returnItems,
                          [it.id]: Math.min(it.quantity, Math.max(0, val)),
                        });
                      }}
                      className="w-16 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-center"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Return Reason */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Return Reason <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="Size / Fit Mismatch">Size / Fit Mismatch</option>
              <option value="Defective / Damaged Piece">Defective / Damaged Piece</option>
              <option value="Customer Change of Mind">Customer Change of Mind</option>
              <option value="Wrong Item Picked">Wrong Item Picked</option>
              <option value="Quality Dissatisfaction">Quality Dissatisfaction</option>
            </select>
          </div>

          {/* Refund Method */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Refund Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['CASH', 'UPI', 'CREDIT'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setRefundMethod(m)}
                  className={`py-2 rounded-lg font-bold transition border ${
                    refundMethod === m
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Refund Summary Banner */}
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex justify-between items-center">
            <span className="font-semibold text-rose-800 dark:text-rose-300">
              Total Refund Amount:
            </span>
            <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
              ₹{calculateRefund()}
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-2/3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm"
            >
              Confirm Return &amp; Refund
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
