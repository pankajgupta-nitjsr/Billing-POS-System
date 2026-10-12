import React, { useState, useEffect } from 'react';
import {
  Layers,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  TrendingUp,
  Package,
  Plus,
  Search,
  Filter,
  DollarSign,
  History,
} from 'lucide-react';
import { Product, StockMovement } from '@/types/models';
import { db } from '@/services/storage/database';
import { useAuth } from '@/context/AuthContext';
import { PricingEngine } from '@/services/pricing/pricingEngine';
import { StockAdjustmentModal } from './StockAdjustmentModal';

export const InventoryScreen: React.FC = () => {
  const { isOwner } = useAuth();
  const [products, setProducts] = useState<Product[]>(() => db.getProducts());
  const [movements, setMovements] = useState<StockMovement[]>(() => db.getStockMovements());
  const [activeTab, setActiveTab] = useState<'status' | 'movements'>('status');
  const [movementFilter, setMovementFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setProducts(db.getProducts());
      setMovements(db.getStockMovements());
    });
    return unsubscribe;
  }, []);

  // Stock Valuations
  const totalCostValue = products.reduce((acc, p) => acc + p.stock * p.costPrice, 0);
  const totalRetailValue = products.reduce((acc, p) => acc + p.stock * p.sellingPrice, 0);
  const totalUnitsInStock = products.reduce((acc, p) => acc + p.stock, 0);

  const lowStockItems = products.filter((p) => p.active && p.stock <= p.minStockAlert);
  const outOfStockItems = products.filter((p) => p.active && p.stock <= 0);

  const filteredMovements = movements.filter((m) => {
    if (movementFilter !== 'ALL' && m.type !== movementFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.productName.toLowerCase().includes(q) ||
      m.reason.toLowerCase().includes(q) ||
      m.referenceDocId?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
            Inventory &amp; Stock Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Real-time stock movement ledger, valuations &amp; discrepancy protection
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => setAdjustmentModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm self-start sm:self-auto transition"
          >
            <Layers className="w-4 h-4" />
            <span>Adjust Stock</span>
          </button>
        )}
      </div>

      {/* Valuation Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {/* Total Stock Units */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Total Units In Stock</span>
          <p className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {Math.round(totalUnitsInStock * 10) / 10} Units
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across {products.length} catalog items
          </span>
        </div>

        {/* Cost Price Valuation (Owner only) */}
        {isOwner ? (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">Valuation at Cost Price</span>
            <p className="text-xl lg:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {PricingEngine.formatCurrency(totalCostValue)}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Capital tied in inventory
            </span>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">Catalog Count</span>
            <p className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {products.length} Products
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">Active lines</span>
          </div>
        )}

        {/* Retail Selling Value */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Retail Sales Potential</span>
          <p className="text-xl lg:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {PricingEngine.formatCurrency(totalRetailValue)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Selling value of present stock
          </span>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Low Stock Reorders</span>
          <p className="text-xl lg:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {lowStockItems.length} Items
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {outOfStockItems.length} zero stock
          </span>
        </div>
      </div>

      {/* Tabs: Stock Status vs Stock Movement Ledger */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('status')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'status'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Product Stock Overview ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'movements'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Stock Movement Ledger ({movements.length})
        </button>
      </div>

      {activeTab === 'status' ? (
        /* TAB 1: PRODUCT STOCK LIST */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">In Stock</th>
                  <th className="px-4 py-3 text-right">Min Threshold</th>
                  {isOwner && <th className="px-4 py-3 text-right">Stock Valuation</th>}
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {p.sku} &bull; {p.rackLocation || 'Rack Unassigned'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                      {p.stock} {p.unit}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      {p.minStockAlert} {p.unit}
                    </td>
                    {isOwner && (
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {PricingEngine.formatCurrency(p.stock * p.costPrice)}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.stock <= 0
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            : p.stock <= p.minStockAlert
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        }`}
                      >
                        {p.stock <= 0 ? 'Out of Stock' : p.stock <= p.minStockAlert ? 'Low Stock' : 'Adequate'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB 2: AUDITABLE STOCK MOVEMENT LEDGER */
        <div className="space-y-3">
          {/* Movement Filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {['ALL', 'SALE', 'PURCHASE', 'RETURN', 'ADJUSTMENT', 'DAMAGE', 'OPENING'].map(
              (type) => (
                <button
                  key={type}
                  onClick={() => setMovementFilter(type)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    movementFilter === type
                      ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {type}
                </button>
              )
            )}
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">Movement Type</th>
                    <th className="px-4 py-3 text-right">Qty Delta</th>
                    <th className="px-4 py-3 text-right">Stock Change</th>
                    <th className="px-4 py-3">Reason / Ref Doc</th>
                    <th className="px-4 py-3">Authorized By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        No stock movement records found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                          {new Date(m.createdAt).toLocaleString([], {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {m.productName}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.type === 'SALE'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                                : m.type === 'PURCHASE'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                                : m.type === 'RETURN'
                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                                : 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400'
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold font-mono">
                          <span className={m.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 font-mono text-[11px]">
                          {m.previousStock} &rarr; {m.newStock}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-[11px]">
                          <span className="font-medium">{m.reason}</span>
                          {m.referenceDocId && (
                            <span className="block text-slate-400 font-mono">
                              Doc: {m.referenceDocId}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">
                          {m.userName}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {adjustmentModalOpen && (
        <StockAdjustmentModal
          onClose={() => setAdjustmentModalOpen(false)}
          onAdjusted={() => {}}
        />
      )}
    </div>
  );
};
