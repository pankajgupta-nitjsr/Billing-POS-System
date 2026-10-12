import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Percent,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  Clock,
  Printer,
} from 'lucide-react';
import { db } from '@/services/storage/database';
import { PricingEngine } from '@/services/pricing/pricingEngine';
import { useStore } from '@/context/StoreContext';

export const ReportsScreen: React.FC = () => {
  const { addToast } = useStore();
  const sales = db.getSales();
  const expenses = db.getExpenses();
  const products = db.getProducts();
  const negotiations = db.getNegotiationRecords();
  const shifts = db.getShiftHistory();

  const [activeReport, setActiveReport] = useState<'pnl' | 'negotiation' | 'shifts'>('pnl');

  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalCogs = sales.reduce((acc, s) => acc + (s.costTotal || 0), 0);
  const totalGrossProfit = totalRevenue - totalCogs;
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalGrossProfit - totalExpenses;

  const totalDiscount = sales.reduce((acc, s) => acc + (s.discountTotal || 0), 0);

  const handleExportCSV = () => {
    let csvRows: string[][] = [];
    let filename = 'A2Z_Mart_Report.csv';

    if (activeReport === 'pnl') {
      filename = 'A2Z_Mart_PnL_Report.csv';
      csvRows = [
        ['Metric', 'Amount (INR)'],
        ['Gross Sales Revenue', String(totalRevenue)],
        ['Cost of Goods Sold (COGS)', String(totalCogs)],
        ['Gross Profit Margin', String(totalGrossProfit)],
        ['Operating Expenses', String(totalExpenses)],
        ['Net Net Profit', String(netProfit)],
      ];
    } else if (activeReport === 'negotiation') {
      filename = 'A2Z_Mart_Negotiation_Analytics.csv';
      csvRows = [
        ['Invoice Number', 'Product', 'Original Price', 'Customer Offer', 'Final Price', 'Floor Price', 'Approved By', 'Date'],
        ...negotiations.map((n) => [
          n.invoiceNumber,
          `"${n.productName}"`,
          String(n.originalPrice),
          String(n.customerOffer),
          String(n.finalPrice),
          String(n.floorPrice),
          n.approvedBy,
          n.createdAt,
        ]),
      ];
    } else {
      filename = 'A2Z_Mart_Shift_Audit.csv';
      csvRows = [
        ['Cashier', 'Opened At', 'Closed At', 'Opening Cash', 'Expected Cash', 'Actual Cash', 'Variance', 'Explanation'],
        ...shifts.map((s) => [
          s.cashierName,
          s.openedAt,
          s.closedAt || '',
          String(s.openingCash),
          String(s.expectedCash),
          String(s.actualCash || 0),
          String(s.difference || 0),
          s.differenceReason || '',
        ]),
      ];
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' + csvRows.map((r) => r.join(',')).join('\n');
    const encoded = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    addToast('success', 'Exported', 'Report exported to CSV successfully.');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
            Reports &amp; Profit Analytics
          </h1>
          <p className="text-xs text-slate-500">
            Owner P&amp;L statements, negotiation margins and cashier drawer shift audits
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
        >
          <Download className="w-4 h-4" />
          <span>Export Report CSV</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveReport('pnl')}
          className={`pb-2.5 transition border-b-2 ${
            activeReport === 'pnl'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Profit &amp; Loss Statement
        </button>
        <button
          onClick={() => setActiveReport('negotiation')}
          className={`pb-2.5 transition border-b-2 ${
            activeReport === 'negotiation'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Smart Negotiation Analytics ({negotiations.length})
        </button>
        <button
          onClick={() => setActiveReport('shifts')}
          className={`pb-2.5 transition border-b-2 ${
            activeReport === 'shifts'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Cashier Shifts &amp; Reconciliations ({shifts.length})
        </button>
      </div>

      {activeReport === 'pnl' && (
        /* P&L BREAKDOWN */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Gross Sales Revenue</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {PricingEngine.formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Gross Profit (Margin)</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {PricingEngine.formatCurrency(totalGrossProfit)}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {totalRevenue > 0 ? `${Math.round((totalGrossProfit / totalRevenue) * 100)}% margin` : '0%'}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Net Profit (Post Expenses)</span>
              <p className={`text-2xl font-black mt-1 ${netProfit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
                {PricingEngine.formatCurrency(netProfit)}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                After subtracting ₹{totalExpenses} expenses
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">P&amp;L Financial Summary</h3>
            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex justify-between py-2">
                <span className="font-semibold">Gross Invoiced Revenue</span>
                <span className="font-mono font-bold">₹{totalRevenue}</span>
              </div>
              <div className="flex justify-between py-2 text-slate-500">
                <span>(-) Cost of Goods Sold (COGS)</span>
                <span className="font-mono">₹{totalCogs}</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-emerald-600 dark:text-emerald-400">
                <span>(=) Gross Trading Profit</span>
                <span className="font-mono">₹{totalGrossProfit}</span>
              </div>
              <div className="flex justify-between py-2 text-rose-500">
                <span>(-) Operating Expenses (Rent, Salary, Power)</span>
                <span className="font-mono">-₹{totalExpenses}</span>
              </div>
              <div className="flex justify-between py-2.5 font-black text-sm text-slate-900 dark:text-white">
                <span>NET STORE PROFIT</span>
                <span className="font-mono text-base text-indigo-600 dark:text-indigo-400">
                  {PricingEngine.formatCurrency(netProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeReport === 'negotiation' && (
        /* NEGOTIATION ANALYTICS */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3 text-right">Normal Price</th>
                  <th className="px-4 py-3 text-right">Customer Offer</th>
                  <th className="px-4 py-3 text-right">Floor Price</th>
                  <th className="px-4 py-3 text-right">Final Authorized</th>
                  <th className="px-4 py-3 text-right">Customer Savings</th>
                  <th className="px-4 py-3">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {negotiations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      No customer negotiations finalized yet. Complete a negotiated sale in POS to view analytics.
                    </td>
                  </tr>
                ) : (
                  negotiations.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {n.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {n.productName}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        ₹{n.originalPrice}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-amber-600 font-bold">
                        ₹{n.customerOffer}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-400">
                        ₹{n.floorPrice}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                        ₹{n.finalPrice}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-300">
                        ₹{n.discountGranted}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">
                        {n.approvedBy}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === 'shifts' && (
        /* SHIFTS RECONCILIATIONS */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Cashier</th>
                  <th className="px-4 py-3">Shift Opened</th>
                  <th className="px-4 py-3">Shift Closed</th>
                  <th className="px-4 py-3 text-right">Opening Cash</th>
                  <th className="px-4 py-3 text-right">Expected Drawer</th>
                  <th className="px-4 py-3 text-right">Actual Counted</th>
                  <th className="px-4 py-3 text-right">Variance</th>
                  <th className="px-4 py-3">Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {shifts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      No closed cashier shifts recorded yet. Use Shift Manager in the top bar to reconcile.
                    </td>
                  </tr>
                ) : (
                  shifts.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {s.cashierName}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {new Date(s.openedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {s.closedAt ? new Date(s.closedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'In Progress'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        ₹{s.openingCash}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        ₹{s.expectedCash}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ₹{s.actualCash || 0}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        <span className={(s.difference || 0) < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {(s.difference || 0) > 0 ? '+' : ''}{s.difference || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">
                        {s.differenceReason || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
