import React, { createContext, useContext, useState } from 'react';
import { CartItem, Customer, Product, ProductVariant, HeldBill } from '@/types/models';
import { db } from '@/services/storage/database';
import { useStore } from './StoreContext';
import { PricingEngine } from '@/services/pricing/pricingEngine';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, variant?: ProductVariant, customQty?: number) => { success: boolean; message?: string };
  updateItemQuantity: (id: string, qty: number) => { success: boolean; message?: string };
  removeItem: (id: string) => void;
  clearCart: () => void;
  applyItemNegotiation: (
    cartItemId: string,
    finalPrice: number,
    customerOffer?: number,
    approvedBy?: string
  ) => { success: boolean; message?: string };
  applyCartNegotiation: (
    finalCartTotal: number,
    customerOffer: number,
    approvedBy: string
  ) => { success: boolean; message?: string };
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  totalItemsCount: number;
  hasNegotiation: boolean;
  holdBill: (notes?: string) => { success: boolean; billId?: string };
  resumeBill: (heldBill: HeldBill) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, addToast } = useStore();
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const addItem = (
    product: Product,
    variant?: ProductVariant,
    customQty?: number
  ): { success: boolean; message?: string } => {
    const qtyToAdd = customQty !== undefined ? customQty : product.isDecimalUnit ? 1 : 1;
    const availableStock = variant ? variant.stock : product.stock;

    // Check negative stock restriction
    if (!settings.allowNegativeStock && availableStock <= 0) {
      addToast('error', 'Out of Stock', `"${product.name}" has 0 stock remaining.`);
      return { success: false, message: 'Item is out of stock' };
    }

    const mrp = variant ? variant.mrp : product.mrp;
    const costPrice = variant ? variant.costPrice : product.costPrice;
    const sellingPrice = variant ? variant.sellingPrice : product.sellingPrice;
    const floorPrice = variant ? variant.floorPrice : product.floorPrice;
    const barcode = variant ? variant.barcode : product.barcode;
    const sku = variant ? variant.sku : product.sku;

    const existingIndex = items.findIndex(
      (item) => item.productId === product.id && item.variantId === variant?.id
    );

    if (existingIndex >= 0) {
      const existing = items[existingIndex];
      const newQty = existing.quantity + qtyToAdd;

      if (!settings.allowNegativeStock && newQty > availableStock) {
        addToast(
          'warning',
          'Stock Shortage',
          `Only ${availableStock} ${product.unit} available. Cannot add ${newQty}.`
        );
        return { success: false, message: `Only ${availableStock} units available` };
      }

      const updated = [...items];
      updated[existingIndex] = {
        ...existing,
        quantity: Math.round(newQty * 1000) / 1000,
      };
      setItems(updated);
      addToast('success', 'Cart Updated', `Increased quantity for ${product.name}`);
      return { success: true };
    } else {
      if (!settings.allowNegativeStock && qtyToAdd > availableStock) {
        addToast(
          'warning',
          'Stock Shortage',
          `Only ${availableStock} ${product.unit} available.`
        );
        return { success: false, message: `Only ${availableStock} units available` };
      }

      const newItem: CartItem = {
        id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        productId: product.id,
        variantId: variant?.id,
        variantName: variant?.name,
        name: variant ? `${product.name} (${variant.name})` : product.name,
        sku,
        barcode,
        unit: product.unit,
        isDecimalUnit: product.isDecimalUnit,
        quantity: Math.round(qtyToAdd * 1000) / 1000,
        mrp,
        costPrice,
        originalSellingPrice: sellingPrice,
        unitPrice: sellingPrice,
        floorPrice,
        gstRate: product.gstRate,
        hsnCode: product.hsnCode,
        negotiationEnabled: product.negotiationEnabled,
        isNegotiated: false,
      };

      setItems((prev) => [newItem, ...prev]);
      addToast('success', 'Item Added', `${newItem.name} added to cart`);
      return { success: true };
    }
  };

  const updateItemQuantity = (id: string, qty: number): { success: boolean; message?: string } => {
    if (qty <= 0) {
      removeItem(id);
      return { success: true };
    }

    const item = items.find((i) => i.id === id);
    if (!item) return { success: false, message: 'Item not found' };

    const product = db.getProductById(item.productId);
    const availableStock = item.variantId
      ? product?.variants?.find((v) => v.id === item.variantId)?.stock ?? 0
      : product?.stock ?? 0;

    if (!settings.allowNegativeStock && qty > availableStock) {
      addToast(
        'warning',
        'Stock Alert',
        `Cannot set quantity to ${qty}. Available stock is ${availableStock}.`
      );
      return { success: false, message: `Only ${availableStock} available` };
    }

    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, quantity: Math.round(qty * 1000) / 1000 } : it))
    );
    return { success: true };
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => {
    setItems([]);
    setSelectedCustomer(null);
  };

  const applyItemNegotiation = (
    cartItemId: string,
    finalPrice: number,
    customerOffer?: number,
    approvedBy?: string
  ): { success: boolean; message?: string } => {
    const item = items.find((i) => i.id === cartItemId);
    if (!item) return { success: false, message: 'Item not in cart' };

    const validation = PricingEngine.validatePriceOverride(
      finalPrice,
      item.floorPrice,
      item.originalSellingPrice
    );

    if (!validation.isValid) {
      return { success: false, message: validation.reason };
    }

    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== cartItemId) return it;
        return {
          ...it,
          unitPrice: finalPrice,
          negotiatedPrice: finalPrice,
          isNegotiated: true,
          ownerOverrideApproved: true,
          negotiatedBy: approvedBy || 'Store Owner',
          customerOffer,
        };
      })
    );

    addToast(
      'success',
      'Negotiation Finalized',
      `${item.name} price updated to ₹${finalPrice} for this bill.`
    );
    return { success: true };
  };

  const applyCartNegotiation = (
    finalCartTotal: number,
    customerOffer: number,
    approvedBy: string
  ): { success: boolean; message?: string } => {
    const totalFloor = items.reduce((acc, it) => acc + it.floorPrice * it.quantity, 0);

    if (finalCartTotal < totalFloor) {
      return {
        success: false,
        message: `Total ₹${finalCartTotal} is below the cart combined floor of ₹${totalFloor}.`,
      };
    }

    const distributedItems = PricingEngine.distributeCartDiscount(items, finalCartTotal);
    setItems(
      distributedItems.map((it) => ({
        ...it,
        customerOffer: customerOffer,
        negotiatedBy: approvedBy || 'Store Owner',
      }))
    );

    addToast(
      'success',
      'Cart Negotiation Applied',
      `Cart total finalized at ₹${finalCartTotal}. Item prices adjusted proportionally.`
    );
    return { success: true };
  };

  const holdBill = (notes?: string): { success: boolean; billId?: string } => {
    if (items.length === 0) {
      return { success: false };
    }

    const bill: HeldBill = {
      id: `held_${Date.now()}`,
      heldAt: new Date().toISOString(),
      billNumber: `HOLD-#${Math.floor(100 + Math.random() * 900)}`,
      customerName: selectedCustomer?.name,
      customerPhone: selectedCustomer?.phone,
      items: [...items],
      subtotal,
      total,
      notes,
    };

    db.saveHeldBill(bill);
    clearCart();
    addToast('info', 'Bill Held', `Saved as ${bill.billNumber}`);
    return { success: true, billId: bill.id };
  };

  const resumeBill = (heldBill: HeldBill) => {
    setItems(heldBill.items);
    if (heldBill.customerPhone) {
      const cust = db.getCustomers().find((c) => c.phone === heldBill.customerPhone);
      if (cust) setSelectedCustomer(cust);
    }
    db.deleteHeldBill(heldBill.id);
    addToast('success', 'Bill Resumed', `${heldBill.billNumber} loaded into checkout`);
  };

  // Calculations
  const subtotal = items.reduce(
    (acc, it) => acc + it.originalSellingPrice * it.quantity,
    0
  );

  const total = items.reduce(
    (acc, it) => acc + it.unitPrice * it.quantity,
    0
  );

  const discountTotal = Math.max(0, subtotal - total);

  // Indian Retail GST Calculation: Prices in retail kirana/fashion are typically MRP-inclusive
  const taxTotal = items.reduce((acc, it) => {
    if (it.gstRate > 0) {
      const lineTotal = it.unitPrice * it.quantity;
      const taxPart = lineTotal - lineTotal / (1 + it.gstRate / 100);
      return acc + taxPart;
    }
    return acc;
  }, 0);

  const totalItemsCount = items.reduce((acc, it) => acc + (it.isDecimalUnit ? 1 : it.quantity), 0);
  const hasNegotiation = items.some((it) => it.isNegotiated);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateItemQuantity,
        removeItem,
        clearCart,
        applyItemNegotiation,
        applyCartNegotiation,
        selectedCustomer,
        setSelectedCustomer,
        subtotal: Math.round(subtotal * 100) / 100,
        discountTotal: Math.round(discountTotal * 100) / 100,
        taxTotal: Math.round(taxTotal * 100) / 100,
        total: Math.round(total * 100) / 100,
        totalItemsCount,
        hasNegotiation,
        holdBill,
        resumeBill,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
