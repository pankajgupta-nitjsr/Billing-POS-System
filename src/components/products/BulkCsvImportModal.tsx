import React, { useState } from 'react';
import { X, UploadCloud, CheckCircle, AlertOctagon, Download, FileSpreadsheet } from 'lucide-react';
import { Product, KiranaUnit } from '@/types/models';
import { db } from '@/services/storage/database';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';

interface BulkCsvImportModalProps {
  onClose: () => void;
  onImportComplete: () => void;
}

interface ParsedRow {
  rowNumber: number;
  data: Partial<Product>;
  isValid: boolean;
  errors: string[];
}

export const BulkCsvImportModal: React.FC<BulkCsvImportModalProps> = ({
  onClose,
  onImportComplete,
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useStore();

  const [csvText, setCsvText] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [hasValidated, setHasValidated] = useState<boolean>(false);

  const sampleCsv = `Product Name,SKU,Barcode,Category,Brand,Purchase Price,MRP,Selling Price,Absolute Floor,GST,Opening Stock,Unit,Supplier
Casual Cotton Polo,POLO-001,POLO001,Fashion,A2Z Basics,280,499,399,359,5,25,pc,Surat Garments Hub
Premium Moong Dal 1kg,MNG-001,MNG001,Grocery,Desi Mandi,110,150,135,125,0,50,kg,Mahalaxmi FMCG Traders
Dove Cream Soap 100g,DOV-001,DOV001,FMCG,Dove,45,65,58,52,18,40,pc,Mahalaxmi FMCG Traders`;

  const handleValidate = () => {
    if (!csvText.trim()) {
      addToast('warning', 'Empty CSV', 'Please paste CSV content or upload a file.');
      return;
    }

    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) {
      addToast('error', 'Invalid CSV', 'CSV must have a header row and at least 1 data row.');
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const existingProducts = db.getProducts();

    const seenSkus = new Set<string>();
    const seenBarcodes = new Set<string>();

    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',').map((c) => c.trim());
      const errors: string[] = [];

      const name = cols[0] || '';
      const sku = (cols[1] || '').toUpperCase();
      const barcode = cols[2] || sku;
      const category = (cols[3] || 'General') as any;
      const brand = cols[4] || '';
      const costPrice = parseFloat(cols[5]);
      const mrp = parseFloat(cols[6]);
      const sellingPrice = parseFloat(cols[7]);
      const floorPrice = parseFloat(cols[8]);
      const gst = parseFloat(cols[9]) || 0;
      const stock = parseFloat(cols[10]) || 0;
      const unit = (cols[11] || 'pc').toLowerCase() as KiranaUnit;
      const supplier = cols[12] || '';

      if (!name) errors.push('Missing Product Name');
      if (!sku) errors.push('Missing SKU');

      if (seenSkus.has(sku)) {
        errors.push(`Duplicate SKU "${sku}" inside CSV`);
      } else {
        seenSkus.add(sku);
      }

      if (existingProducts.some((p) => p.sku === sku)) {
        errors.push(`SKU "${sku}" already exists in store`);
      }

      if (seenBarcodes.has(barcode)) {
        errors.push(`Duplicate barcode "${barcode}" inside CSV`);
      } else {
        seenBarcodes.add(barcode);
      }

      if (isNaN(costPrice) || costPrice < 0) errors.push('Invalid Purchase Price');
      if (isNaN(sellingPrice) || sellingPrice <= 0) errors.push('Invalid Selling Price');
      if (isNaN(floorPrice) || floorPrice <= 0) errors.push('Invalid Absolute Floor Price');
      if (floorPrice > sellingPrice) errors.push('Floor price cannot exceed Selling price');

      const isDecimalUnit = ['kg', 'gm', 'litre', 'ml'].includes(unit);

      const parsedProduct: Partial<Product> = {
        name,
        sku,
        barcode,
        qrCode: barcode,
        category: ['Grocery', 'Fashion', 'FMCG', 'General'].includes(category)
          ? category
          : 'General',
        brand,
        costPrice,
        mrp: isNaN(mrp) ? sellingPrice : mrp,
        sellingPrice,
        floorPrice,
        gstRate: gst,
        stock,
        unit,
        isDecimalUnit,
        minStockAlert: 5,
        supplierName: supplier,
        active: true,
        negotiationEnabled: true,
      };

      rows.push({
        rowNumber: i,
        data: parsedProduct,
        isValid: errors.length === 0,
        errors,
      });
    }

    setParsedRows(rows);
    setHasValidated(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvText(event.target?.result as string);
        setHasValidated(false);
      };
      reader.readAsText(file);
    }
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  const handleCommitImport = () => {
    if (invalidRows.length > 0) {
      addToast('error', 'Validation Errors', 'Please fix all invalid rows before importing.');
      return;
    }

    validRows.forEach((r) => {
      const fullProd: Product = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        storeId: 'store_main_01',
        name: r.data.name!,
        sku: r.data.sku!,
        barcode: r.data.barcode!,
        qrCode: r.data.qrCode!,
        category: r.data.category as any,
        brand: r.data.brand,
        unit: r.data.unit as KiranaUnit,
        isDecimalUnit: r.data.isDecimalUnit!,
        costPrice: r.data.costPrice!,
        mrp: r.data.mrp!,
        sellingPrice: r.data.sellingPrice!,
        floorPrice: r.data.floorPrice!,
        gstRate: r.data.gstRate!,
        stock: r.data.stock!,
        minStockAlert: 5,
        active: true,
        negotiationEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.saveProduct(fullProd, currentUser, true);
    });

    addToast('success', 'Import Succeeded', `Imported ${validRows.length} products into catalog.`);
    onImportComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Bulk Product Import</h3>
              <p className="text-xs text-slate-500">Atomic validation prevents inventory corruption</p>
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
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* File Picker or Paste Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Paste CSV or Upload File (.csv)
              </label>
              <button
                type="button"
                onClick={() => setCsvText(sampleCsv)}
                className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                Load Sample Template
              </button>
            </div>

            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                setHasValidated(false);
              }}
              placeholder="Paste comma-separated rows here..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-900 dark:text-white outline-none"
            />

            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-300 hover:file:bg-slate-200"
            />
          </div>

          {/* Validation Trigger Button */}
          {!hasValidated ? (
            <button
              type="button"
              onClick={handleValidate}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition"
            >
              Validate CSV Data
            </button>
          ) : (
            /* Validation Results Card */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">
                    Valid Rows
                  </span>
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                    {validRows.length}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                  <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold block">
                    Errors Detected
                  </span>
                  <span className="text-xl font-black text-rose-700 dark:text-rose-400">
                    {invalidRows.length}
                  </span>
                </div>
              </div>

              {invalidRows.length > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-1.5">
                  <span className="font-bold text-rose-800 dark:text-rose-300 block">
                    Issues to Resolve:
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-rose-700 dark:text-rose-400 text-[11px]">
                    {invalidRows.map((r) => (
                      <li key={r.rowNumber}>
                        Row #{r.rowNumber}: {r.errors.join(', ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {validRows.length > 0 && invalidRows.length === 0 && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All {validRows.length} products validated cleanly. Ready to import.</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setHasValidated(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Re-edit
                </button>
                <button
                  type="button"
                  disabled={invalidRows.length > 0 || validRows.length === 0}
                  onClick={handleCommitImport}
                  className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold shadow-sm"
                >
                  Commit Import ({validRows.length} Products)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
