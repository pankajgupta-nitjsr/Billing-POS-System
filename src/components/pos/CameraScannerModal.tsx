import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCw, Zap, Volume2, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '@/services/storage/database';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';

interface CameraScannerModalProps {
  onClose: () => void;
  onCodeScanned?: (code: string) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({ onClose, onCodeScanned }) => {
  const { addItem } = useCart();
  const { addToast } = useStore();
  const [continuousMode, setContinuousMode] = useState<boolean>(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [lastProductAdded, setLastProductAdded] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880; // A5 tone
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // AudioContext unavailable or blocked by autoplay policy
    }
  };

  const handleBarcodeIdentified = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    playBeep();
    setLastScannedCode(trimmed);

    const product = db.getProductByBarcode(trimmed);
    if (product) {
      const matchingVariant = product.variants?.find(
        (v) => v.barcode?.toLowerCase() === trimmed.toLowerCase() || v.sku?.toLowerCase() === trimmed.toLowerCase()
      );
      const res = addItem(product, matchingVariant);
      if (res.success) {
        setLastProductAdded(product.name);
        addToast('success', 'Scanned & Added', `${product.name} added to cart`);
      }
    } else {
      setLastProductAdded(null);
      addToast('warning', 'Product Not Found', `Barcode "${trimmed}" not found in catalog.`);
    }

    if (onCodeScanned) {
      onCodeScanned(trimmed);
    }

    if (!continuousMode) {
      handleClose();
    }
  };

  useEffect(() => {
    const elementId = 'camera-qr-reader';
    const scanner = new Html5Qrcode(elementId, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_39,
      ],
      verbose: false,
    });
    scannerRef.current = scanner;

    const startCamera = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 280, height: 180 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            handleBarcodeIdentified(decodedText);
          },
          () => {
            // Frame failed to detect code - normal in loop
          }
        );
        setIsScanning(true);
      } catch (err: any) {
        console.warn('Camera start failed or permission denied:', err);
        setCameraError(
          err?.message?.includes('Permission')
            ? 'Camera access permission was denied. Please allow camera in browser settings or use manual search.'
            : 'Camera could not be accessed. You can enter or simulate barcodes manually below.'
        );
        setIsScanning(false);
      }
    };

    startCamera();

    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [continuousMode]);

  const handleClose = () => {
    if (scannerRef.current && isScanning) {
      scannerRef.current.stop().catch(() => {});
    }
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleBarcodeIdentified(manualCode.trim());
      setManualCode('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Smartphone Barcode Scanner</h3>
              <p className="text-[11px] text-slate-400">QR, Code-128, EAN-13 & UPC</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport and Camera Area */}
        <div className="relative bg-black flex-1 flex flex-col items-center justify-center min-h-[260px] max-h-[340px] overflow-hidden">
          <div id="camera-qr-reader" className="w-full h-full object-cover" />

          {cameraError && (
            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-xs">
              <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
              <p className="font-semibold text-white mb-1">Camera Not Available</p>
              <p className="text-slate-400 mb-4">{cameraError}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleBarcodeIdentified('TSH001')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm"
                >
                  Simulate T-Shirt Scan (TSH001)
                </button>
                <button
                  type="button"
                  onClick={() => handleBarcodeIdentified('KIR001')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs"
                >
                  Scan Rice (KIR001)
                </button>
              </div>
            </div>
          )}

          {/* Scanner Overlay Visual */}
          {!cameraError && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-64 h-40 border-2 border-emerald-400/80 rounded-2xl relative shadow-lg">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse" />
              </div>
              <span className="mt-3 text-[11px] text-white/80 bg-black/50 px-2.5 py-1 rounded-full font-mono">
                Align barcode inside target frame
              </span>
            </div>
          )}
        </div>

        {/* Live Feedback Banner */}
        {lastScannedCode && (
          <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="font-mono text-emerald-400 font-bold">{lastScannedCode}</span>
                {lastProductAdded && (
                  <span className="text-slate-300 ml-2 font-medium">({lastProductAdded})</span>
                )}
              </div>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Scanned</span>
          </div>
        )}

        {/* Controls and Manual Entry */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={continuousMode}
                onChange={(e) => setContinuousMode(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-700"
              />
              <span>Continuous Scanning Mode</span>
            </label>
            <span className="text-[11px] text-slate-500">Rapid Supermarket Billing</span>
          </div>

          {/* Quick Barcode / SKU Input */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Or enter barcode / SKU manually..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
            >
              Lookup
            </button>
          </form>

          {/* Preset Buttons for One-Click Testing */}
          <div className="pt-1 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 font-medium">Quick Codes:</span>
            <button
              type="button"
              onClick={() => handleBarcodeIdentified('TSH001')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-emerald-400 font-mono"
            >
              TSH001 (T-Shirt)
            </button>
            <button
              type="button"
              onClick={() => handleBarcodeIdentified('KIR001')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-sky-400 font-mono"
            >
              KIR001 (Rice)
            </button>
            <button
              type="button"
              onClick={() => handleBarcodeIdentified('FSH002')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-indigo-400 font-mono"
            >
              FSH002 (Jeans)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
