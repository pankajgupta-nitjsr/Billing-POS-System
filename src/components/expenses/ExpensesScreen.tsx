import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Calendar, DollarSign, X } from 'lucide-react';
import { Expense } from '@/types/models';
import { db } from '@/services/storage/database';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { PricingEngine } from '@/services/pricing/pricingEngine';

export const ExpensesScreen: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useStore();
  const [expenses, setExpenses] = useState<Expense[]>(() => db.getExpenses());
  const [modalOpen, setModalOpen] = useState(false);

  const [category, setCategory] = useState<Expense['category']>('Rent');
  const [amount, setAmount] = useState<string>('5000');
  const [paymentMethod, setPaymentMethod] = useState<Expense['paymentMethod']>('UPI');
  const [description, setDescription] = useState<string>('Monthly Shop Rental');

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setExpenses(db.getExpenses());
    });
    return unsubscribe;
  }, []);

  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);

  const handleRecordExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      storeId: 'store_main_01',
      category,
      amount: val,
      paymentMethod,
      description: description.trim(),
      recordedBy: currentUser.id,
      recordedByName: currentUser.name,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    db.createExpense(newExpense, currentUser);
    addToast('success', 'Expense Recorded', `Recorded ₹${val} under ${category}`);
    setModalOpen(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
            Operational Expenses
          </h1>
          <p className="text-xs text-slate-500">
            Rent, electricity, staff wages, freight &amp; miscellaneous shop costs
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* KPI Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500">Total Recorded Expenses</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {PricingEngine.formatCurrency(totalExpense)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Factored into net profit margin</span>
        </div>
        <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600">
          <Wallet className="w-6 h-6" />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Paid Via</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No operating expenses recorded yet.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{exp.date}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {exp.description}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-medium">{exp.paymentMethod}</td>
                    <td className="px-4 py-3 text-right font-bold text-rose-600 font-mono">
                      ₹{exp.amount}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">{exp.recordedByName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleRecordExpense}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Record Operating Expense</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-semibold mb-1">Expense Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="Rent">Shop Rent</option>
                <option value="Electricity">Electricity &amp; Power</option>
                <option value="Salary">Staff Salary</option>
                <option value="Transport">Transport &amp; Freight</option>
                <option value="Packaging">Carry Bags &amp; Packaging</option>
                <option value="Repairs">Repairs &amp; Maintenance</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Expense Amount (₹)</label>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-purple-500 text-lg font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="CASH">Cash Drawer</option>
                <option value="UPI">UPI Account</option>
                <option value="BANK">Bank Transfer / Cheque</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Description / Notes</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Electricity bill for October"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                required
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
                className="w-2/3 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
              >
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
