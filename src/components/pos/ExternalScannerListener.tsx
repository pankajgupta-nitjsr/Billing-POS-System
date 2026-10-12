import React, { useEffect, useRef } from 'react';
import { db } from '@/services/storage/database';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';

interface ExternalScannerListenerProps {
  onUnknownBarcode?: (code: string) => void;
}

export const ExternalScannerListener: React.FC<ExternalScannerListenerProps> = ({
  onUnknownBarcode,
}) => {
  const { addItem } = useCart();
  const { addToast } = useStore();
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) &&
        !target.dataset.scannerInput
      ) {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Retail USB/Bluetooth HID scanners emit key events with very short intervals (<50ms)
      if (timeDiff > 200) {
        bufferRef.current = '';
      }

      if (e.key === 'Enter' || e.key === 'Tab') {
        const barcode = bufferRef.current.trim();
        bufferRef.current = '';

        if (barcode.length >= 3) {
          e.preventDefault();
          lookupAndAdd(barcode);
        }
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    const lookupAndAdd = (code: string) => {
      const product = db.getProductByBarcode(code);
      if (product) {
        // If product has variants, check which variant matched the barcode
        const matchingVariant = product.variants?.find(
          (v) => v.barcode?.toLowerCase() === code.toLowerCase() || v.sku?.toLowerCase() === code.toLowerCase()
        );
        const res = addItem(product, matchingVariant);
        if (res.success) {
          addToast('success', 'Scanner Detected', `Added: ${product.name} [${code}]`);
        }
      } else {
        addToast('warning', 'Barcode Not Found', `Code "${code}" is not registered in product catalog.`);
        if (onUnknownBarcode) {
          onUnknownBarcode(code);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addItem, addToast, onUnknownBarcode]);

  return null;
};
