import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  Edit2,
  Trash2,
  AlertTriangle,
  Layers,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';
import { Product } from '@/types/models';
import { db } from '@/services/storage/database';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { ProductFormModal } from './ProductFormModal';
import { BulkCsvImportModal } from './BulkCsvImportModal';

export const ProductListScreen: React.FC = () => {
  const { isOwner, currentUser } = useAuth();
  const { addToast } = useStore();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>(() => db.getProducts());
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<Product | null>(null);

  useEffect(() => {
    if (searchParams.get('new') === '1' && isOwner) {
      setFormModalOpen(true);
    }
  }, [searchParams, isOwner]);

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setProducts(db.getProducts());
    });
    return unsubscribe;
  }, []);

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (!search.trim()) return true;

    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q)
    );
  });

  const handleExportCsv = () => {
    const headers = [
      'Product Name',
      'SKU',
      'Barcode',
      'Category',
      'Brand',
      ...(isOwner ? ['Purchase Price'] : []),
      'MRP',
      'Selling Price',
      'Absolute Floor',
      'GST',
      'Current Stock',
      'Unit',
    ];

    const rows = products.map((p) => [
      `"${p.name}"`,
      p.sku,
      p.barcode,
      p.category,
      p.brand || '',
      ...(isOwner ? [p.costPrice] : []),
      p.mrp,
      p.sellingPrice,
      p.floorPrice,
      p.gstRate,
      p.stock,
      p.unit,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `A2Z_Mart_Products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Exported', 'Catalog exported to CSV successfully.');
  };

  const handleDeactivate = (prod: Product) => {
    db.deactivateProduct(prod.id, currentUser);
    setDeleteConfirmTarget(null);
    addToast('info', 'Deactivated', `Product ${prod.name} has been deactivated.`);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
            Product Master &amp; Catalog
          </h1>
          <p className="text-xs text-slate-500">
            {products.length} registered retail products with floor price controls
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {isOwner && (
            <>
              <button
                onClick={() => setCsvModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Import CSV</span>
              </button>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setFormModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, barcode..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {['All', 'Grocery', 'Fashion', 'FMCG'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
              <tr>
                <th className="px-4 py-3">Product Name &amp; SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Stock</th>
                {isOwner && <th className="px-4 py-3 text-right">Cost Price</th>}
                <th className="px-4 py-3 text-right">MRP</th>
                <th className="px-4 py-3 text-right">Selling Price</th>
                <th className="px-4 py-3 text-right">Absolute Floor</th>
                <th className="px-4 py-3 text-center">GST</th>
                {isOwner && <th className="px-4 py-3 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={isOwner ? 9 : 7} className="text-center py-12 text-slate-400">
                    <Package className="w-10 h-10 mx-auto opacity-30 mb-2" />
                    <p className="font-semibold text-sm">No products found</p>
                    {isOwner && (
                      <p className="text-xs text-slate-500 mt-1">
                        Click &quot;Add Product&quot; or &quot;Import CSV&quot; to build catalog.
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                      !p.active ? 'opacity-50 line-through' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {p.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-mono">
                            SKU: {p.sku}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Bar: {p.barcode}
                          </span>
                          {p.hasVariants && (
                            <span className="text-[9px] px-1 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-bold">
                              {p.variants?.length} Variants
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-bold ${
                          p.stock <= p.minStockAlert
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {p.stock} {p.unit}
                      </span>
                    </td>

                    {/* Cost Price: Hidden for Cashiers */}
                    {isOwner && (
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        ₹{p.costPrice}
                      </td>
                    )}

                    <td className="px-4 py-3 text-right font-mono text-slate-500">
                      ₹{p.mrp}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ₹{p.sellingPrice}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{p.floorPrice}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[10px] text-slate-500 font-mono">{p.gstRate}%</span>
                    </td>

                    {isOwner && (
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setFormModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmTarget(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Deactivate Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal */}
      {formModalOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setFormModalOpen(false)}
          onSaved={() => {}}
        />
      )}

      {/* Bulk CSV Import Modal */}
      {csvModalOpen && (
        <BulkCsvImportModal
          onClose={() => setCsvModalOpen(false)}
          onImportComplete={() => {}}
        />
      )}

      {/* Confirmation Dialog for Deactivation */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-3">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-slate-900 dark:text-white">Deactivate Product?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              This will deactivate &quot;{deleteConfirmTarget.name}&quot;. Historical sales, stock ledgers,
              and invoices will remain intact.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="w-1/2 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeactivate(deleteConfirmTarget)}
                className="w-1/2 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
