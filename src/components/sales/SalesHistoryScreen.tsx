import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Printer,
  RotateCcw,
  Percent,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
} from 'lucide-react';
import { Sale } from '@/types/models';
import { db } from '@/services/storage/database';
import { PricingEngine } from '@/services/pricing/pricingEngine';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import { ReturnsModal } from './ReturnsModal';

export const SalesHistoryScreen: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>(() => db.getSales());
  const [search, setSearch] = useState('');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [selectedSaleForReturn, setSelectedSaleForReturn] = useState<Sale | null>(null);

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setSales(db.getSales());
    });
    return unsubscribe;
  }, []);

  const filteredSales = sales.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.invoiceNumber.toLowerCase().includes(q) ||
      s.customerPhone?.toLowerCase().includes(q) ||
      s.customerName?.toLowerCase().includes(q) ||
      s.cashierName.toLowerCase().includes(q)
    );
  });

  const totalSalesRevenue = sales.reduce((acc, s) => acc + s.total, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
            Sales Invoices &amp; Returns
          </h1>
          <p className="text-xs text-slate-500">
            Audit history of completed bills, payment receipts and returns
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <span className="text-xs text-slate-500">Total Billed:</span>
          <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400">
            {PricingEngine.formatCurrency(totalSalesRevenue)}
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Invoice number (e.g. INV-000001), customer phone, cashier..."
          className="w-full bg-transparent text-xs outline-none"
        />
      </div>

      {/* Sales Invoices Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Date &amp; Time</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3 text-center">Items</th>
                <th className="px-4 py-3 text-center">Payment Mode</th>
                <th className="px-4 py-3 text-right">Bill Total</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto opacity-30 mb-2" />
                    <p className="font-semibold text-sm">No sales records found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Start billing on the POS terminal to generate invoices.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {sale.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {new Date(sale.createdAt).toLocaleDateString()}{' '}
                      {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {sale.customerName || 'Walk-in'}
                      </span>
                      {sale.customerPhone && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {sale.customerPhone}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-bold">
                      {sale.items.length}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-black text-slate-900 dark:text-white block text-sm">
                        ₹{sale.total}
                      </span>
                      {sale.discountTotal > 0 && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-0.5">
                          <Percent className="w-2.5 h-2.5" />
                          <span>Saved ₹{sale.discountTotal}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sale.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedSaleForReceipt(sale)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Print / View Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {sale.status !== 'RETURNED' && (
                          <button
                            onClick={() => setSelectedSaleForReturn(sale)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Process Return &amp; Refund"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedSaleForReceipt && (
        <ReceiptModal
          sale={selectedSaleForReceipt}
          onClose={() => setSelectedSaleForReceipt(null)}
        />
      )}

      {/* Returns Modal */}
      {selectedSaleForReturn && (
        <ReturnsModal
          sale={selectedSaleForReturn}
          onClose={() => setSelectedSaleForReturn(null)}
          onReturnCompleted={() => {}}
        />
      )}
    </div>
  );
};
