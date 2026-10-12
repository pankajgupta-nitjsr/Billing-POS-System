import React, { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { X, Printer, FileText, Share2, Download, Check, Sparkles } from 'lucide-react';
import { Sale } from '@/types/models';
import { useStore } from '@/context/StoreContext';
import { PricingEngine } from '@/services/pricing/pricingEngine';

interface ReceiptModalProps {
  sale: Sale;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const { settings } = useStore();
  const [printFormat, setPrintFormat] = useState<'80mm' | 'a4'>('80mm');
  const [copied, setCopied] = useState(false);
  const barcodeRef = useRef<SVGSVGElement | null>(null);
  const qrRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (barcodeRef.current && sale.invoiceNumber) {
      try {
        JsBarcode(barcodeRef.current, sale.invoiceNumber, {
          format: 'CODE128',
          width: 1.5,
          height: 38,
          displayValue: true,
          fontSize: 11,
          font: 'monospace',
          margin: 4,
        });
      } catch (e) {
        console.warn('Barcode error:', e);
      }
    }

    if (qrRef.current) {
      QRCode.toCanvas(
        qrRef.current,
        `INV:${sale.invoiceNumber}|TOTAL:${sale.total}|DATE:${sale.createdAt}`,
        { width: 72, margin: 1 },
        () => {}
      );
    }
  }, [sale, printFormat]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `A2Z Mart Receipt ${sale.invoiceNumber}`,
        text: `Receipt from ${settings.name} for ₹${sale.total}. Invoice: ${sale.invoiceNumber}`,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `A2Z Mart Bill: ${sale.invoiceNumber} | Total: ₹${sale.total} | Date: ${new Date(sale.createdAt).toLocaleDateString()}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in no-print">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header Controls */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPrintFormat('80mm')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                printFormat === '80mm'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              80mm Thermal
            </button>
            <button
              onClick={() => setPrintFormat('a4')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                printFormat === 'a4'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              A4 Tax Invoice
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Preview */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 dark:bg-slate-950 flex justify-center">
          {printFormat === '80mm' ? (
            /* 80mm THERMAL RECEIPT PREVIEW */
            <div className="print-area receipt-80mm shadow-md rounded-sm border border-slate-300 bg-white text-slate-900 p-4 w-[76mm]">
              {/* Store Header */}
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <h2 className="text-base font-extrabold uppercase tracking-wide">{settings.name}</h2>
                <p className="text-[10px] text-slate-600">{settings.tagline}</p>
                <p className="text-[10px] text-slate-700 leading-tight mt-0.5">{settings.address}</p>
                <p className="text-[10px] text-slate-800">Phone: {settings.phone}</p>
                <p className="text-[10px] font-bold">GSTIN: {settings.gstin}</p>
              </div>

              {/* Invoice Meta */}
              <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span>INVOICE: <strong>{sale.invoiceNumber}</strong></span>
                  <span>DATE: {new Date(sale.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>CASHIER: {sale.cashierName.split(' ')[0]}</span>
                  <span>TIME: {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {sale.customerName && (
                  <div>
                    <span>CUSTOMER: {sale.customerName} {sale.customerPhone ? `(${sale.customerPhone})` : ''}</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="py-2 border-b border-dashed border-slate-400">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-400 text-left font-bold">
                      <th className="pb-1">ITEM</th>
                      <th className="pb-1 text-center">QTY</th>
                      <th className="pb-1 text-right">RATE</th>
                      <th className="pb-1 text-right">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items.map((it) => (
                      <tr key={it.id} className="align-top">
                        <td className="py-1">
                          <span className="font-semibold block leading-tight">{it.name}</span>
                          {it.isNegotiated && (
                            <span className="text-[9px] text-emerald-700 block">
                              *Special Final: ₹{it.unitPrice}
                            </span>
                          )}
                        </td>
                        <td className="py-1 text-center">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="py-1 text-right">₹{it.unitPrice}</td>
                        <td className="py-1 text-right font-bold">
                          ₹{Math.round(it.unitPrice * it.quantity * 100) / 100}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Totals */}
              <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-1">
                <div className="flex justify-between">
                  <span>Items Count:</span>
                  <span>{sale.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{sale.subtotal}</span>
                </div>
                {sale.discountTotal > 0 && (
                  <div className="flex justify-between font-bold text-emerald-800">
                    <span>Discount / Bargain:</span>
                    <span>-₹{sale.discountTotal}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax (GST Included):</span>
                  <span>₹{sale.taxTotal}</span>
                </div>
                <div className="flex justify-between text-xs font-black pt-1 border-t border-slate-400">
                  <span>NET TOTAL:</span>
                  <span>₹{sale.total}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span>PAYMENT MODE:</span>
                  <span className="font-bold">{sale.paymentMethod}</span>
                </div>
                {sale.paymentMethod === 'CASH' && (
                  <>
                    <div className="flex justify-between">
                      <span>CASH TENDERED:</span>
                      <span>₹{sale.cashTendered || sale.total}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>CHANGE RETURNED:</span>
                      <span>₹{sale.changeGiven || 0}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Barcode & Footer */}
              <div className="pt-3 text-center flex flex-col items-center">
                <svg ref={barcodeRef} className="max-w-full" />
                <p className="text-[9px] text-slate-600 mt-1">{settings.receiptFooterMessage}</p>
                <p className="text-[8px] font-mono text-slate-500 mt-1">*** A2Z MART SMART POS ***</p>
              </div>
            </div>
          ) : (
            /* A4 TAX INVOICE PREVIEW */
            <div className="print-area shadow-md bg-white text-slate-900 p-6 rounded-lg w-full max-w-md text-xs space-y-4 border border-slate-300">
              <div className="flex justify-between border-b pb-3">
                <div>
                  <h1 className="text-lg font-bold text-emerald-800">{settings.name}</h1>
                  <p className="text-slate-600 text-[11px]">{settings.address}</p>
                  <p className="text-slate-700 font-semibold text-[11px]">GSTIN: {settings.gstin}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm block">TAX INVOICE</span>
                  <p className="text-slate-600 font-mono">{sale.invoiceNumber}</p>
                  <p className="text-slate-500">{new Date(sale.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b pb-3 text-[11px]">
                <div>
                  <span className="font-semibold block text-slate-500">Billed To:</span>
                  <p className="font-bold">{sale.customerName || 'Walk-in Customer'}</p>
                  {sale.customerPhone && <p>{sale.customerPhone}</p>}
                </div>
                <div className="text-right">
                  <span className="font-semibold block text-slate-500">Payment Status:</span>
                  <span className="font-bold text-emerald-700">{sale.paymentStatus} ({sale.paymentMethod})</span>
                </div>
              </div>

              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b font-bold text-slate-600">
                    <th className="text-left pb-1">Item Description</th>
                    <th className="text-center pb-1">Qty</th>
                    <th className="text-right pb-1">Rate</th>
                    <th className="text-right pb-1">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((it) => (
                    <tr key={it.id} className="border-b border-slate-100">
                      <td className="py-1.5">{it.name}</td>
                      <td className="py-1.5 text-center">{it.quantity}</td>
                      <td className="py-1.5 text-right">₹{it.unitPrice}</td>
                      <td className="py-1.5 text-right font-semibold">₹{it.unitPrice * it.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end pt-2">
                <div className="w-48 space-y-1 text-right text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal:</span>
                    <span>₹{sale.subtotal}</span>
                  </div>
                  {sale.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Discount:</span>
                      <span>-₹{sale.discountTotal}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm border-t pt-1">
                    <span>Total:</span>
                    <span>₹{sale.total}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t text-center text-[10px] text-slate-500">
                {settings.receiptFooterMessage}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
            >
              Done
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
