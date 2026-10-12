import React from 'react';
import { X, Play, Trash2, Clock, ShoppingCart } from 'lucide-react';
import { HeldBill } from '@/types/models';
import { db } from '@/services/storage/database';
import { useCart } from '@/context/CartContext';
import { PricingEngine } from '@/services/pricing/pricingEngine';

interface HeldBillsModalProps {
  onClose: () => void;
}

export const HeldBillsModal: React.FC<HeldBillsModalProps> = ({ onClose }) => {
  const heldBills = db.getHeldBills();
  const { resumeBill } = useCart();

  const handleResume = (bill: HeldBill) => {
    resumeBill(bill);
    onClose();
  };

  const handleDelete = (id: string) => {
    db.deleteHeldBill(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Held Bills &amp; Suspended Carts</h3>
              <p className="text-xs text-slate-500">{heldBills.length} held transactions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {heldBills.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <ShoppingCart className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-sm font-semibold">No bills on hold.</p>
              <p className="text-xs">You can put active customer bills on hold to serve other customers.</p>
            </div>
          ) : (
            heldBills.map((bill) => (
              <div
                key={bill.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-emerald-500 transition flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {bill.billNumber}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(bill.heldAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {bill.items.length} items &bull;{' '}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {PricingEngine.formatCurrency(bill.total)}
                    </span>
                  </p>
                  {bill.customerName && (
                    <p className="text-[11px] text-slate-500">Customer: {bill.customerName}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(bill.id)}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Delete Held Bill"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleResume(bill)}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
