import React, { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import {
  QrCode,
  Printer,
  Plus,
  Trash2,
  Grid,
  Check,
  Settings,
  Sparkles,
} from 'lucide-react';
import { Product } from '@/types/models';
import { db } from '@/services/storage/database';
import { useStore } from '@/context/StoreContext';
import { PricingEngine } from '@/services/pricing/pricingEngine';

interface LabelItemConfig {
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  sellingPrice: number;
  mrp: number;
  count: number;
}

export const LabelGeneratorScreen: React.FC = () => {
  const { settings } = useStore();
  const products = db.getProducts().filter((p) => p.active);

  const [labelConfigs, setLabelConfigs] = useState<LabelItemConfig[]>([
    {
      productId: products[0]?.id || '',
      productName: products[0]?.name || "Men's T-Shirt",
      sku: products[0]?.sku || 'TSH-001',
      barcode: products[0]?.barcode || 'TSH001',
      sellingPrice: products[0]?.sellingPrice || 349,
      mrp: products[0]?.mrp || 399,
      count: 4,
    },
  ]);

  const [format, setFormat] = useState<'a4' | 'roll80'>('a4');
  const [columns, setColumns] = useState<number>(3);
  const [codeType, setCodeType] = useState<'BARCODE' | 'QR'>('BARCODE');

  const containerRef = useRef<HTMLDivElement>(null);

  // Flattened labels list
  const labelsToRender = labelConfigs.flatMap((cfg) =>
    Array.from({ length: cfg.count }, () => cfg)
  );

  const handleAddProductToBatch = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const existing = labelConfigs.find((c) => c.productId === prodId);
    if (existing) {
      setLabelConfigs(
        labelConfigs.map((c) => (c.productId === prodId ? { ...c, count: c.count + 2 } : c))
      );
    } else {
      setLabelConfigs([
        ...labelConfigs,
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          barcode: prod.barcode || prod.sku,
          sellingPrice: prod.sellingPrice,
          mrp: prod.mrp,
          count: 2,
        },
      ]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
            Barcode &amp; QR Label Printing Studio
          </h1>
          <p className="text-xs text-slate-500">
            Bulk label generation for 80mm rolls &amp; A4 sticker sheets
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
        >
          <Printer className="w-4 h-4" />
          <span>Print {labelsToRender.length} Labels</span>
        </button>
      </div>

      {/* Configuration & Selection Panel */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Format:</label>
            <button
              onClick={() => setFormat('a4')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                format === 'a4'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              A4 Sticker Sheet (3 Columns)
            </button>
            <button
              onClick={() => setFormat('roll80')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                format === 'roll80'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              80mm Thermal Roll
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Graphic:</label>
            <button
              onClick={() => setCodeType('BARCODE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                codeType === 'BARCODE'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
              }`}
            >
              Code-128 Barcode
            </button>
            <button
              onClick={() => setCodeType('QR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                codeType === 'QR'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
              }`}
            >
              QR Code
            </button>
          </div>
        </div>

        {/* Selected Items Config List */}
        <div className="space-y-2 text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200 block">
            Batch Items for Printing
          </span>
          <div className="flex flex-wrap gap-2">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => handleAddProductToBatch(p.id)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/60 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3 text-emerald-600" />
                <span>{p.name}</span>
                <span className="font-mono text-slate-400 text-[10px]">({p.sku})</span>
              </button>
            ))}
          </div>

          {/* Counts adjuster */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
            {labelConfigs.map((cfg, idx) => (
              <div
                key={cfg.productId}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="truncate mr-2">
                  <span className="font-semibold block truncate">{cfg.productName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Bar: {cfg.barcode} &bull; ₹{cfg.sellingPrice}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    min={1}
                    value={cfg.count}
                    onChange={(e) => {
                      const updated = [...labelConfigs];
                      updated[idx].count = Math.max(1, parseInt(e.target.value) || 1);
                      setLabelConfigs(updated);
                    }}
                    className="w-12 text-center py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 font-bold"
                  />
                  <button
                    onClick={() => setLabelConfigs(labelConfigs.filter((c) => c.productId !== cfg.productId))}
                    className="p-1 text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Printable Sheet Preview Area */}
      <div
        ref={containerRef}
        className={`print-area mx-auto p-4 bg-white text-slate-900 rounded-2xl shadow-sm border border-slate-200 ${
          format === 'roll80' ? 'max-w-[80mm]' : 'max-w-4xl'
        }`}
      >
        <div
          className={`grid gap-3 ${
            format === 'roll80'
              ? 'grid-cols-1'
              : columns === 3
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
              : 'grid-cols-2'
          }`}
        >
          {labelsToRender.map((lbl, idx) => (
            <LabelCard key={idx} config={lbl} storeName={settings.name} codeType={codeType} />
          ))}
        </div>
      </div>
    </div>
  );
};

interface LabelCardProps {
  config: LabelItemConfig;
  storeName: string;
  codeType: 'BARCODE' | 'QR';
}

const LabelCard: React.FC<LabelCardProps> = ({ config, storeName, codeType }) => {
  const barcodeRef = useRef<SVGSVGElement | null>(null);
  const qrRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (codeType === 'BARCODE' && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, config.barcode || config.sku, {
          format: 'CODE128',
          width: 1.2,
          height: 32,
          displayValue: true,
          fontSize: 10,
          font: 'monospace',
          margin: 2,
        });
      } catch (e) {
        console.warn('Barcode error:', e);
      }
    } else if (codeType === 'QR' && qrRef.current) {
      QRCode.toCanvas(
        qrRef.current,
        config.barcode || config.sku,
        { width: 64, margin: 1 },
        () => {}
      );
    }
  }, [config, codeType]);

  return (
    <div className="p-3 border border-dashed border-slate-400 rounded-xl bg-white text-slate-900 text-center flex flex-col items-center justify-between min-h-[140px] shadow-sm">
      <div className="w-full border-b border-slate-200 pb-1">
        <span className="font-extrabold text-[10px] tracking-wider uppercase text-emerald-800 block">
          {storeName}
        </span>
        <h4 className="font-bold text-xs truncate leading-tight mt-0.5">{config.productName}</h4>
      </div>

      <div className="my-1 flex items-center justify-center">
        {codeType === 'BARCODE' ? (
          <svg ref={barcodeRef} className="max-w-full" />
        ) : (
          <canvas ref={qrRef} />
        )}
      </div>

      <div className="w-full pt-1 border-t border-slate-200 flex items-center justify-between text-xs px-1">
        <span className="font-mono text-[10px] text-slate-600 font-bold">{config.sku}</span>
        <div className="flex items-baseline gap-1">
          {config.mrp > config.sellingPrice && (
            <span className="text-[10px] text-slate-400 line-through font-mono">
              ₹{config.mrp}
            </span>
          )}
          <span className="font-black text-sm text-slate-900 font-mono">
            ₹{config.sellingPrice}
          </span>
        </div>
      </div>
    </div>
  );
};
