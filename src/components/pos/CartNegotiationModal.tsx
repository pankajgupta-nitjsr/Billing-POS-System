import React, { useState } from 'react';
import { X, Calculator, ShieldCheck, Lock, AlertTriangle, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { PricingEngine } from '@/services/pricing/pricingEngine';

interface CartNegotiationModalProps {
  onClose: () => void;
}

export const CartNegotiationModal: React.FC<CartNegotiationModalProps> = ({ onClose }) => {
  const { items, applyCartNegotiation, subtotal, total } = useCart();
  const { isOwner, currentUser, verifyOwnerPin } = useAuth();

  const [customerOfferInput, setCustomerOfferInput] = useState<string>(
    String(Math.round(total * 0.9))
  );
  const [ownerFinalInput, setOwnerFinalInput] = useState<string>(
    String(Math.round(total * 0.94))
  );
  const [ownerPinInput, setOwnerPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const customerOffer = parseFloat(customerOfferInput) || 0;
  const ownerFinal = parseFloat(ownerFinalInput) || 0;

  // Evaluate cart negotiation metrics
  const evalData = PricingEngine.evaluateCartNegotiation(items, customerOffer);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setPinError(null);

    if (ownerFinal < evalData.cartTotalFloor) {
      setErrorMsg(
        `Proposed ₹${ownerFinal} breaches the total combined floor of ₹${evalData.cartTotalFloor}.`
      );
      return;
    }

    let approverName = currentUser.name;
    if (!isOwner) {
      if (!ownerPinInput.trim()) {
        setPinError('Owner PIN is required to authorize cart discount.');
        return;
      }
      if (!verifyOwnerPin(ownerPinInput.trim())) {
        setPinError('Invalid Owner PIN.');
        return;
      }
      approverName = 'Rajesh Sharma (Owner Approved)';
    }

    const res = applyCartNegotiation(ownerFinal, customerOffer, approverName);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message || 'Failed to apply cart negotiation');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Cart-Level Negotiation</h3>
              <p className="text-xs text-slate-500">Whole basket bargaining & margin protector</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleApply} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Reference Numbers */}
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 block text-[11px]">Current Cart Total</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                ₹{total}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-emerald-700 dark:text-emerald-400 block text-[11px]">
                Combined Floor
              </span>
              <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                ₹{evalData.cartTotalFloor}
              </span>
            </div>
          </div>

          {/* Customer Offer Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Customer Total Offer (&quot;Kitne mein final karna chahte hain?&quot;)
            </label>
            <input
              type="number"
              step="any"
              value={customerOfferInput}
              onChange={(e) => setCustomerOfferInput(e.target.value)}
              placeholder="e.g. 1200"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-base font-bold outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          {/* AI Recommendation Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Requested Discount:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                ₹{evalData.totalSavingsRequested}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-500">Recommended Final:</span>
              <button
                type="button"
                onClick={() => setOwnerFinalInput(String(evalData.suggestedCartTotal))}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                ₹{evalData.suggestedCartTotal} (Click to Use)
              </button>
            </div>
          </div>

          {/* Owner Final Input */}
          <div>
            <div className="flex items-center justify-between mb-1 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Owner Finalized Bill Total (₹)
              </label>
              <span className="text-slate-500 text-[11px]">Min: ₹{evalData.cartTotalFloor}</span>
            </div>
            <input
              type="number"
              step="any"
              value={ownerFinalInput}
              onChange={(e) => setOwnerFinalInput(e.target.value)}
              placeholder="e.g. 1260"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border-2 border-purple-500 text-slate-900 dark:text-white text-base font-bold outline-none"
              required
            />
          </div>

          {/* PIN Required if Cashier */}
          {!isOwner && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Owner PIN Required</span>
              </div>
              <input
                type="password"
                maxLength={6}
                value={ownerPinInput}
                onChange={(e) => setOwnerPinInput(e.target.value)}
                placeholder="Enter Owner PIN (Demo: 1234)"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white text-xs outline-none"
              />
              {pinError && <p className="text-[11px] text-rose-500">{pinError}</p>}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-2/3 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Finalize Cart at ₹{ownerFinal || 0}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
