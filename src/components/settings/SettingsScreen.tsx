import React, { useState } from 'react';
import { Settings, Save, RotateCcw, ShieldCheck, Printer, Store, CheckCircle } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { db } from '@/services/storage/database';

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, addToast } = useStore();

  const [name, setName] = useState(settings.name);
  const [tagline, setTagline] = useState(settings.tagline);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [address, setAddress] = useState(settings.address);
  const [gstin, setGstin] = useState(settings.gstin);
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix);
  const [allowNegativeStock, setAllowNegativeStock] = useState(settings.allowNegativeStock);
  const [enableItemNegotiation, setEnableItemNegotiation] = useState(settings.enableItemNegotiation);
  const [ownerPin, setOwnerPin] = useState(settings.ownerPin);
  const [receiptFooterMessage, setReceiptFooterMessage] = useState(settings.receiptFooterMessage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      name: name.trim(),
      tagline: tagline.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      gstin: gstin.trim(),
      invoicePrefix: invoicePrefix.trim(),
      allowNegativeStock,
      enableItemNegotiation,
      ownerPin: ownerPin.trim(),
      receiptFooterMessage: receiptFooterMessage.trim(),
    });
  };

  const handleResetSeedData = () => {
    if (window.confirm('Reset all demo data back to pristine factory defaults? This will restore initial stock and sales history.')) {
      db.resetToDefaults();
      addToast('info', 'Database Reset', 'Store data reset to initial Kirana + Fashion test state.');
      window.location.reload();
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
          Store Configuration &amp; Policies
        </h1>
        <p className="text-xs text-slate-500">
          GSTIN, thermal receipt template, owner PIN overrides &amp; inventory constraints
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* Store Profile Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Store className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Store Identity</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Store Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Store Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">Store Physical Address (Printed on Bills)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* GST & Invoicing Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Printer className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">GST &amp; Invoicing</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Store GSTIN</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="23AAAAA0000A1Z5"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Invoice Prefix</label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                placeholder="INV-"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-mono"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">Receipt Footer Note</label>
              <input
                type="text"
                value={receiptFooterMessage}
                onChange={(e) => setReceiptFooterMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Inventory & Negotiation Safeguards Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Safeguards &amp; Overrides</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowNegativeStock}
                onChange={(e) => setAllowNegativeStock(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600"
              />
              <div>
                <span className="font-semibold block text-slate-800 dark:text-slate-200">
                  Allow Negative Inventory Billing (Default: OFF)
                </span>
                <span className="text-[11px] text-slate-400">
                  When disabled, POS prevents selling items that have 0 or insufficient stock.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enableItemNegotiation}
                onChange={(e) => setEnableItemNegotiation(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600"
              />
              <div>
                <span className="font-semibold block text-slate-800 dark:text-slate-200">
                  Enable Smart Bargain &amp; Negotiation Engine
                </span>
                <span className="text-[11px] text-slate-400">
                  Activates floor-validated counter offers and cashier authorization dialog.
                </span>
              </div>
            </label>

            <div className="pt-2 max-w-xs">
              <label className="block font-semibold mb-1">
                Owner Override PIN (For Authorizing Cashier Bargains)
              </label>
              <input
                type="text"
                maxLength={6}
                value={ownerPin}
                onChange={(e) => setOwnerPin(e.target.value)}
                placeholder="4-digit PIN"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-amber-500 font-mono text-center font-black tracking-widest text-base"
                required
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Default demonstration PIN: <strong className="text-slate-200 font-mono">1234</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleResetSeedData}
            className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Catalog</span>
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-md transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Store Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
