import React, { useState, useEffect } from 'react';
import { Truck, Plus, Phone, MapPin, X } from 'lucide-react';
import { Supplier } from '@/types/models';
import { db } from '@/services/storage/database';
import { useStore } from '@/context/StoreContext';
import { PricingEngine } from '@/services/pricing/pricingEngine';

export const SuppliersScreen: React.FC = () => {
  const { addToast } = useStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => db.getSuppliers());
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setSuppliers(db.getSuppliers());
    });
    return unsubscribe;
  }, []);

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const newSupplier: Supplier = {
      id: `sup_${Date.now()}`,
      storeId: 'store_main_01',
      name: name.trim(),
      phone: phone.trim(),
      gstin: gstin.trim() || undefined,
      address: address.trim() || undefined,
      outstandingBalance: 0,
      totalPurchases: 0,
      createdAt: new Date().toISOString(),
    };

    db.saveSupplier(newSupplier);
    addToast('success', 'Supplier Saved', `Added vendor: ${newSupplier.name}`);
    setName('');
    setPhone('');
    setGstin('');
    setAddress('');
    setModalOpen(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
            Suppliers &amp; Vendors
          </h1>
          <p className="text-xs text-slate-500">
            FMCG distributors, garment manufacturers and wholesale mandi accounts
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suppliers.map((sup) => (
          <div
            key={sup.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{sup.name}</h3>
                {sup.gstin && (
                  <span className="text-[10px] font-mono text-slate-400">GSTIN: {sup.gstin}</span>
                )}
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Due: ₹{sup.outstandingBalance}
              </span>
            </div>

            <div className="space-y-1 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-mono">{sup.phone}</span>
              </div>
              {sup.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sup.address}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs">
              <span className="text-slate-400">Total Purchase Volume:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {PricingEngine.formatCurrency(sup.totalPurchases)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleCreateSupplier}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Add Supplier</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-semibold mb-1">Company / Supplier Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Surat Textiles Ltd"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Contact Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">GSTIN</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="15-character GSTIN"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Warehouse / City"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-1/3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Save Supplier
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
