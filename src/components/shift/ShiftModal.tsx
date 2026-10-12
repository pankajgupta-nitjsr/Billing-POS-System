import React, { useState } from 'react';
import { X, Clock, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PricingEngine } from '@/services/pricing/pricingEngine';

interface ShiftModalProps {
  onClose: () => void;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({ onClose }) => {
  const { activeShift, startShift, closeShift, currentUser } = useAuth();
  const [openingCashInput, setOpeningCashInput] = useState<string>('2000');
  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [reasonInput, setReasonInput] = useState<string>('');
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(openingCashInput);
    if (isNaN(val) || val < 0) {
      setError('Please enter a valid opening cash amount');
      return;
    }
    startShift(val);
    onClose();
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    const actual = parseFloat(actualCashInput);
    if (isNaN(actual) || actual < 0) {
      setError('Please enter actual cash counted in the drawer');
      return;
    }

    if (activeShift) {
      const diff = actual - activeShift.expectedCash;
      if (Math.abs(diff) > 0 && !reasonInput.trim()) {
        setError(`A cash difference of ₹${Math.abs(diff)} requires an explanation.`);
        return;
      }
    }

    closeShift(actual, reasonInput);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Cashier Shift Management</h3>
              <p className="text-xs text-slate-500">Cash drawer balancing & audit control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!activeShift ? (
            /* Open Shift Screen */
            <form onSubmit={handleStart} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  Cashier: <span className="font-semibold">{currentUser.name}</span>
                </p>
                <p>Count the physical float cash in the drawer before starting billing.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Opening Float Cash (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={openingCashInput}
                  onChange={(e) => setOpeningCashInput(e.target.value)}
                  placeholder="e.g. 2000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-base font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition"
              >
                Start Active Shift
              </button>
            </form>
          ) : !isClosing ? (
            /* Active Shift Overview Screen */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Shift In Progress
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Started at {new Date(activeShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  Live
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Opening Cash</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                    {PricingEngine.formatCurrency(activeShift.openingCash)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Cash Sales</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                    +{PricingEngine.formatCurrency(activeShift.cashSales)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">UPI Sales</span>
                  <p className="font-bold text-blue-600 dark:text-blue-400 text-sm mt-0.5">
                    {PricingEngine.formatCurrency(activeShift.upiSales)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Card Sales</span>
                  <p className="font-bold text-purple-600 dark:text-purple-400 text-sm mt-0.5">
                    {PricingEngine.formatCurrency(activeShift.cardSales)}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Expected Physical Drawer Cash</span>
                  <p className="text-lg font-bold text-emerald-400">
                    {PricingEngine.formatCurrency(activeShift.expectedCash)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsClosing(true)}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-sm transition"
              >
                Close & Reconcile Shift
              </button>
            </div>
          ) : (
            /* Close Shift Screen */
            <form onSubmit={handleCloseShift} className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                Expected in drawer: <span className="font-bold">{PricingEngine.formatCurrency(activeShift.expectedCash)}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Actual Physical Cash Counted (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  placeholder="Count physical notes & coins"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-base font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  autoFocus
                  required
                />
              </div>

              {actualCashInput && !isNaN(parseFloat(actualCashInput)) && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    parseFloat(actualCashInput) === activeShift.expectedCash
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-400'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  <span>Drawer Variance:</span>
                  <span className="font-bold text-sm">
                    {parseFloat(actualCashInput) - activeShift.expectedCash >= 0 ? '+' : ''}
                    {PricingEngine.formatCurrency(parseFloat(actualCashInput) - activeShift.expectedCash)}
                  </span>
                </div>
              )}

              {actualCashInput && parseFloat(actualCashInput) !== activeShift.expectedCash && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Explanation for Cash Difference <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    placeholder="e.g. Small denomination rounding or petty cash expense"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                    required
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsClosing(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition"
                >
                  Confirm & Finalize Shift
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
