import React, { useState } from 'react';
import { X, Plus, Trash2, ShieldAlert, Check, Layers } from 'lucide-react';
import { Product, ProductVariant, KiranaUnit } from '@/types/models';
import { db } from '@/services/storage/database';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';

interface ProductFormModalProps {
  product?: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  onClose,
  onSaved,
}) => {
  const { currentUser, isOwner } = useAuth();
  const { addToast } = useStore();

  const isEditing = Boolean(product);

  const [name, setName] = useState(product?.name || '');
  const [sku, setSku] = useState(product?.sku || `SKU-${Date.now().toString().slice(-4)}`);
  const [barcode, setBarcode] = useState(product?.barcode || '');
  const [category, setCategory] = useState<'Grocery' | 'Fashion' | 'FMCG' | 'General'>(
    product?.category || 'Grocery'
  );
  const [subcategory, setSubcategory] = useState(product?.subcategory || '');
  const [brand, setBrand] = useState(product?.brand || '');
  const [unit, setUnit] = useState<KiranaUnit>(product?.unit || 'pc');
  const [isDecimalUnit, setIsDecimalUnit] = useState(product?.isDecimalUnit || false);
  const [costPrice, setCostPrice] = useState(product?.costPrice ? String(product.costPrice) : '240');
  const [mrp, setMrp] = useState(product?.mrp ? String(product.mrp) : '399');
  const [sellingPrice, setSellingPrice] = useState(
    product?.sellingPrice ? String(product.sellingPrice) : '349'
  );
  const [floorPrice, setFloorPrice] = useState(
    product?.floorPrice ? String(product.floorPrice) : '319'
  );
  const [gstRate, setGstRate] = useState(product?.gstRate !== undefined ? String(product.gstRate) : '5');
  const [hsnCode, setHsnCode] = useState(product?.hsnCode || '');
  const [stock, setStock] = useState(product?.stock !== undefined ? String(product.stock) : '20');
  const [minStockAlert, setMinStockAlert] = useState(
    product?.minStockAlert !== undefined ? String(product.minStockAlert) : '5'
  );
  const [rackLocation, setRackLocation] = useState(product?.rackLocation || 'Rack A-01');
  const [negotiationEnabled, setNegotiationEnabled] = useState(
    product?.negotiationEnabled !== undefined ? product.negotiationEnabled : true
  );

  // Fashion variants state
  const [hasVariants, setHasVariants] = useState(product?.hasVariants || false);
  const [variants, setVariants] = useState<ProductVariant[]>(
    product?.variants || [
      {
        id: `var_${Date.now()}_1`,
        name: 'Black / M',
        size: 'M',
        color: 'Black',
        sku: `${sku}-BLK-M`,
        barcode: `${barcode || sku}-M`,
        stock: 10,
        costPrice: 240,
        mrp: 399,
        sellingPrice: 349,
        floorPrice: 319,
      },
    ]
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUnitChange = (selected: KiranaUnit) => {
    setUnit(selected);
    const decimalUnits: KiranaUnit[] = ['kg', 'gm', 'litre', 'ml'];
    setIsDecimalUnit(decimalUnits.includes(selected));
  };

  const handleAddVariant = () => {
    const newVar: ProductVariant = {
      id: `var_${Date.now()}_${variants.length + 1}`,
      name: 'Size / Color',
      size: 'L',
      color: 'Blue',
      sku: `${sku}-VAR-${variants.length + 1}`,
      barcode: `${barcode || sku}-V${variants.length + 1}`,
      stock: 5,
      costPrice: parseFloat(costPrice) || 0,
      mrp: parseFloat(mrp) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      floorPrice: parseFloat(floorPrice) || 0,
    };
    setVariants([...variants, newVar]);
  };

  const handleRemoveVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setErrorMsg(null);

    const cost = parseFloat(costPrice) || 0;
    const mrpVal = parseFloat(mrp) || 0;
    const selling = parseFloat(sellingPrice) || 0;
    const floor = parseFloat(floorPrice) || 0;
    const stockVal = parseFloat(stock) || 0;
    const gst = parseFloat(gstRate) || 0;

    if (!name.trim() || !sku.trim()) {
      setErrorMsg('Product name and SKU are required.');
      return;
    }

    if (floor > selling) {
      setErrorMsg('Absolute Floor price cannot be greater than the standard Selling price.');
      return;
    }

    if (selling > mrpVal && mrpVal > 0) {
      setErrorMsg('Selling price cannot exceed MRP.');
      return;
    }

    const newProduct: Product = {
      id: product?.id || `prod_${Date.now()}`,
      storeId: 'store_main_01',
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      barcode: barcode.trim() || sku.trim().toUpperCase(),
      qrCode: barcode.trim() || sku.trim().toUpperCase(),
      category,
      subcategory: subcategory.trim() || undefined,
      brand: brand.trim() || undefined,
      unit,
      isDecimalUnit,
      costPrice: cost,
      mrp: mrpVal,
      sellingPrice: selling,
      floorPrice: floor,
      gstRate: gst,
      hsnCode: hsnCode.trim() || undefined,
      stock: stockVal,
      minStockAlert: parseFloat(minStockAlert) || 5,
      rackLocation: rackLocation.trim() || undefined,
      active: true,
      negotiationEnabled,
      hasVariants,
      variants: hasVariants ? variants : undefined,
      createdAt: product?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveProduct(newProduct, currentUser, !isEditing);
    addToast('success', 'Product Saved', `Product ${newProduct.name} successfully updated.`);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {isEditing ? `Edit Product: ${product?.name}` : 'Create New Product'}
            </h3>
            <p className="text-xs text-slate-500">
              Configure Kirana/Fashion specs, GST rate &amp; protective floor prices
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Men's T-Shirt or Basmati Rice"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
              >
                <option value="Grocery">🌾 Kirana / Grocery</option>
                <option value="Fashion">👕 Fashion / Garments</option>
                <option value="FMCG">🧴 FMCG / Household</option>
                <option value="General">📦 General Retail</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                SKU Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. TSH-001"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Barcode / QR Value
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g. TSH001"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono"
              />
            </div>
          </div>

          {/* Section 2: Units and Kirana Decimals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit of Measurement
              </label>
              <select
                value={unit}
                onChange={(e) => handleUnitChange(e.target.value as KiranaUnit)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
              >
                <option value="pc">Piece (pc)</option>
                <option value="packet">Packet</option>
                <option value="box">Box</option>
                <option value="bottle">Bottle</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="gm">Gram (gm)</option>
                <option value="litre">Litre (L)</option>
                <option value="ml">Millilitre (ml)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Stock
              </label>
              <input
                type="number"
                step="any"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          {/* Section 3: Pricing Engine & Absolute Floor Protection */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <span className="font-bold text-slate-900 dark:text-white text-xs block">
              Pricing Engine &amp; Floor Protection
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Cost Price - Protected */}
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
                  Purchase Cost (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="240"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  required
                />
              </div>

              {/* MRP */}
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
                  MRP (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  placeholder="399"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  required
                />
              </div>

              {/* Selling Price */}
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
                  Normal Selling (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="349"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  required
                />
              </div>

              {/* Absolute Floor */}
              <div>
                <label className="block font-semibold text-emerald-700 dark:text-emerald-400 mb-1 text-[11px]">
                  Absolute Floor (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={floorPrice}
                  onChange={(e) => setFloorPrice(e.target.value)}
                  placeholder="319"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border-2 border-emerald-500 text-slate-900 dark:text-white font-bold"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={negotiationEnabled}
                  onChange={(e) => setNegotiationEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Enable POS Smart Negotiation for this item
                </span>
              </label>
            </div>
          </div>

          {/* Section 4: GST & Taxes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GST Rate (%)
              </label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
              >
                <option value="0">0% (Exempt / Essential Food)</option>
                <option value="5">5% (Garments &lt; ₹1000 / Edible Oils / Grains)</option>
                <option value="12">12% (Processed Food / Garments &gt; ₹1000)</option>
                <option value="18">18% (Soaps / Cosmetics / FMCG)</option>
                <option value="28">28% (Luxury / Aerated)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                HSN Code
              </label>
              <input
                type="text"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                placeholder="e.g. 6109 (T-Shirts)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono"
              />
            </div>
          </div>

          {/* Section 5: Fashion Variants Builder */}
          {category === 'Fashion' && (
            <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-indigo-900 dark:text-indigo-300">
                  <input
                    type="checkbox"
                    checked={hasVariants}
                    onChange={(e) => setHasVariants(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Enable Fashion Variants (Size, Color, Stock)</span>
                </label>

                {hasVariants && (
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variant</span>
                  </button>
                )}
              </div>

              {hasVariants && (
                <div className="space-y-2">
                  {variants.map((v, idx) => (
                    <div
                      key={v.id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs"
                    >
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[idx].name = e.target.value;
                          setVariants(updated);
                        }}
                        placeholder="e.g. Black / M"
                        className="w-28 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 font-semibold"
                      />
                      <input
                        type="text"
                        value={v.barcode}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[idx].barcode = e.target.value;
                          setVariants(updated);
                        }}
                        placeholder="Barcode"
                        className="w-24 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 font-mono"
                      />
                      <input
                        type="number"
                        value={v.stock}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[idx].stock = parseFloat(e.target.value) || 0;
                          setVariants(updated);
                        }}
                        placeholder="Stock"
                        className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 font-bold"
                      />
                      <input
                        type="number"
                        value={v.sellingPrice}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[idx].sellingPrice = parseFloat(e.target.value) || 0;
                          setVariants(updated);
                        }}
                        placeholder="Price"
                        className="w-20 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(v.id)}
                        className="p-1 rounded text-rose-500 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
