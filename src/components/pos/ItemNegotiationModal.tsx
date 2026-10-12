import React, { useState } from 'react';
import { X, TrendingDown, ShieldCheck, Lock, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { CartItem } from '@/types/models';
import { useAuth } from '@/context/AuthContext';
import { PricingEngine } from '@/services/pricing/pricingEngine';

interface ItemNegotiationModalProps {
  item: CartItem;
  onClose: () => void;
  onApplyNegotiation: (
    cartItemId: string,
    finalPrice: number,
    customerOffer: number,
    approvedBy: string
  ) => void;
}

export const ItemNegotiationModal: React.FC<ItemNegotiationModalProps> = ({
  item,
  onClose,
  onApplyNegotiation,
}) => {
  const { isOwner, currentUser, verifyOwnerPin, allUsers } = useAuth();
  const [customerOfferInput, setCustomerOfferInput] = useState<string>(
    item.customerOffer ? String(item.customerOffer) : '300'
  );
  const [ownerFinalPriceInput, setOwnerFinalPriceInput] = useState<string>('325');
  const [ownerPinInput, setOwnerPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const customerOffer = parseFloat(customerOfferInput) || 0;
  const ownerFinalPrice = parseFloat(ownerFinalPriceInput) || 0;

  // Pricing calculations
  const floorPrice = item.floorPrice;
  const normalPrice = item.originalSellingPrice;
  const isBelowFloor = customerOffer > 0 && customerOffer < floorPrice;

  // Suggested counter offer (Midpoint buffer formula: approx 65% of room between selling price and floor price)
  let suggestedCounterOffer = normalPrice;
  if (normalPrice > floorPrice) {
    const discountBuffer = Math.round((normalPrice - floorPrice) * 0.66);
    suggestedCounterOffer = Math.max(floorPrice, normalPrice - discountBuffer);
  }

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setPinError(null);

    // 1. Strict Floor validation: Never allow below absolute floor under normal owner override
    if (ownerFinalPrice < floorPrice) {
      setErrorMsg(`❌ BLOCKED: Final price ₹${ownerFinalPrice} is strictly below the Absolute Floor of ₹${floorPrice}.`);
      return;
    }

    if (ownerFinalPrice > normalPrice) {
      setErrorMsg(`Final price cannot exceed the original selling price of ₹${normalPrice}.`);
      return;
    }

    // 2. Authorization check: If logged in as Cashier, verify Owner PIN
    let approverName = currentUser?.name || 'Staff User';
    if (!isOwner) {
      if (!ownerPinInput.trim()) {
        setPinError('Owner PIN is required to authorize pricing override.');
        return;
      }
      if (!verifyOwnerPin(ownerPinInput.trim())) {
        setPinError('Invalid Owner PIN. Override authorization denied.');
        return;
      }
      const owner = allUsers.find((u) => u.role === 'OWNER');
      approverName = `${owner?.name || 'Shop Owner'} (Owner Approved via PIN)`;
    }

    // 3. Apply to cart
    onApplyNegotiation(item.id, ownerFinalPrice, customerOffer, approverName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Smart Bargain & Negotiation</h3>
              <p className="text-xs text-slate-500">{item.name}</p>
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
        <form onSubmit={handleAuthorize} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Pricing Reference Badges */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-500 font-medium block">MRP</span>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                ₹{item.mrp}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-500 font-medium block">Normal Selling</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                ₹{normalPrice}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium block">
                Absolute Floor
              </span>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                ₹{floorPrice}
              </span>
            </div>
          </div>

          {/* Customer Offer Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Customer Offer (₹)
            </label>
            <input
              type="number"
              step="any"
              value={customerOfferInput}
              onChange={(e) => setCustomerOfferInput(e.target.value)}
              placeholder="e.g. 300"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-base font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              required
            />
          </div>

          {/* AI / System Suggestion Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Floor Status:</span>
              {isBelowFloor ? (
                <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  ❌ Below Floor (₹{customerOffer} &lt; ₹{floorPrice})
                </span>
              ) : (
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Allowed (&gt;= Floor)
                </span>
              )}
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-500">Suggested Counter Offer:</span>
              <button
                type="button"
                onClick={() => setOwnerFinalPriceInput(String(suggestedCounterOffer))}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                ₹{suggestedCounterOffer} (Click to Use)
              </button>
            </div>
          </div>

          {/* Owner Final Price Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Owner Final Price (₹)
              </label>
              <span className="text-[11px] text-slate-500">Min: ₹{floorPrice}</span>
            </div>
            <input
              type="number"
              step="any"
              value={ownerFinalPriceInput}
              onChange={(e) => setOwnerFinalPriceInput(e.target.value)}
              placeholder="e.g. 325"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border-2 border-emerald-500 text-slate-900 dark:text-white text-base font-bold outline-none"
              required
            />
          </div>

          {/* Authorization Section: PIN required if Cashier */}
          {!isOwner && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Owner Approval Required</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Cashiers cannot finalize below normal selling price without owner PIN.
              </p>
              <div>
                <input
                  type="password"
                  maxLength={6}
                  value={ownerPinInput}
                  onChange={(e) => setOwnerPinInput(e.target.value)}
                  placeholder="Enter Owner PIN (Demo PIN: 1234)"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white text-xs outline-none"
                />
                {pinError && <p className="text-[11px] text-rose-500 mt-1">{pinError}</p>}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Authorize ₹{ownerFinalPrice || 0}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
