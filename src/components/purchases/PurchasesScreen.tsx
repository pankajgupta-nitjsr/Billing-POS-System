import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Purchase, PurchaseItem, Supplier, Product } from '@/types/models';
import { db } from '@/services/storage/database';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { PricingEngine } from '@/services/pricing/pricingEngine';

export const PurchasesScreen: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useStore();

  const [purchases, setPurchases] = useState<Purchase[]>(() => db.getPurchases());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => db.getSuppliers());
  const [products, setProducts] = useState<Product[]>(() => db.getProducts());
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // New Purchase state
  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [purchaseInvoiceNumber, setPurchaseInvoiceNumber] = useState<string>(
    `PUR-INV-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [items, setItems] = useState<PurchaseItem[]>([
    {
      productId: products[0]?.id || '',
      productName: products[0]?.name || '',
      quantity: 10,
      costPrice: products[0]?.costPrice || 240,
      gstRate: products[0]?.gstRate || 5,
      total: (products[0]?.costPrice || 240) * 10,
    },
  ]);
  const [amountPaid, setAmountPaid] = useState<string>('0');

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setPurchases(db.getPurchases());
      setSuppliers(db.getSuppliers());
      setProducts(db.getProducts());
    });
    return unsubscribe;
  }, []);

  const totalPurchaseValue = purchases.reduce((acc, p) => acc + p.total, 0);
  const totalOutstanding = suppliers.reduce((acc, s) => acc + s.outstandingBalance, 0);

  const handleAddItem = () => {
    const prod = products[0];
    if (prod) {
      setItems([
        ...items,
        {
          productId: prod.id,
          productName: prod.name,
          quantity: 10,
          costPrice: prod.costPrice,
          gstRate: prod.gstRate,
          total: prod.costPrice * 10,
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => items.reduce((acc, it) => acc + it.costPrice * it.quantity, 0);
  const calculateTotal = () => {
    const sub = calculateSubtotal();
    const gstPart = items.reduce((acc, it) => acc + (it.costPrice * it.quantity * it.gstRate) / 100, 0);
    return Math.round((sub + gstPart) * 100) / 100;
  };

  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier) return;

    const sub = calculateSubtotal();
    const grandTotal = calculateTotal();
    const paid = parseFloat(amountPaid) || 0;
    const balance = Math.max(0, grandTotal - paid);

    const newPurchase: Purchase = {
      id: `pur_${Date.now()}`,
      storeId: 'store_main_01',
      purchaseInvoiceNumber: purchaseInvoiceNumber.trim(),
      supplierId: supplier.id,
      supplierName: supplier.name,
      items,
      subtotal: sub,
      taxTotal: grandTotal - sub,
      total: grandTotal,
      amountPaid: paid,
      outstandingBalance: balance,
      paymentStatus: balance === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID',
      receivedDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    db.createPurchase(newPurchase, currentUser);
    addToast('success', 'Purchase Recorded', `Stock incremented for ${items.length} products.`);
    setModalOpen(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
            Purchases &amp; Goods Inward
          </h1>
          <p className="text-xs text-slate-500">
            Supplier purchase invoices, stock inwarding &amp; payable ledger
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm self-start sm:self-auto transition"
        >
          <Plus className="w-4 h-4" />
          <span>Inward Purchase Invoice</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Total Purchase Value</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {PricingEngine.formatCurrency(totalPurchaseValue)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Lifetime inventory purchases</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Active Suppliers</span>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {suppliers.length} Vendors
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Kirana mandis &amp; garment mills</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Supplier Outstanding Payables</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {PricingEngine.formatCurrency(totalOutstanding)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Credit accounts due</span>
        </div>
      </div>

      {/* Purchase List Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
              <tr>
                <th className="px-4 py-3">Invoice # &amp; Date</th>
                <th className="px-4 py-3">Supplier Name</th>
                <th className="px-4 py-3 text-center">Items Inwarded</th>
                <th className="px-4 py-3 text-right">Invoice Amount</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Balance Due</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Truck className="w-10 h-10 mx-auto opacity-30 mb-2" />
                    <p className="font-semibold text-sm">No purchases recorded yet</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Inward your first supplier purchase bill to increase stock.
                    </p>
                  </td>
                </tr>
              ) : (
                purchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">
                          {pur.purchaseInvoiceNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(pur.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {pur.supplierName}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold">
                        {pur.items.length} items
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                      ₹{pur.total}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                      ₹{pur.amountPaid}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-600 font-bold font-mono">
                      ₹{pur.outstandingBalance}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pur.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60'
                            : pur.paymentStatus === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60'
                        }`}
                      >
                        {pur.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inward Purchase Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Record Inward Purchase Invoice
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Supplier
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Due: ₹{s.outstandingBalance})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Supplier Invoice Number
                  </label>
                  <input
                    type="text"
                    value={purchaseInvoiceNumber}
                    onChange={(e) => setPurchaseInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">Inward Items</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold text-[11px] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center gap-2"
                  >
                    <select
                      value={item.productId}
                      onChange={(e) => {
                        const prod = products.find((p) => p.id === e.target.value);
                        if (prod) {
                          const updated = [...items];
                          updated[idx] = {
                            ...updated[idx],
                            productId: prod.id,
                            productName: prod.name,
                            costPrice: prod.costPrice,
                            gstRate: prod.gstRate,
                            total: prod.costPrice * updated[idx].quantity,
                          };
                          setItems(updated);
                        }
                      }}
                      className="flex-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 font-semibold"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const updated = [...items];
                        updated[idx].quantity = val;
                        updated[idx].total = val * updated[idx].costPrice;
                        setItems(updated);
                      }}
                      placeholder="Qty"
                      className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 font-bold"
                    />

                    <input
                      type="number"
                      value={item.costPrice}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const updated = [...items];
                        updated[idx].costPrice = val;
                        updated[idx].total = val * updated[idx].quantity;
                        setItems(updated);
                      }}
                      placeholder="Cost"
                      className="w-20 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 font-bold"
                    />

                    <span className="w-20 text-right font-bold">₹{item.total}</span>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals & Payment */}
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500">Subtotal: ₹{calculateSubtotal()}</span>
                  <span className="block font-bold text-sm text-slate-900 dark:text-white">
                    Grand Total: ₹{calculateTotal()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="font-semibold">Paid Amount (₹):</label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-24 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Confirm &amp; Inward Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
