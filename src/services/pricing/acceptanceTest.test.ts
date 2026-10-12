import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/services/storage/database';
import { CartItem, Sale, User } from '@/types/models';

describe('A2Z Mart End-to-End POS Critical Acceptance Test', () => {
  const ownerUser: User = {
    id: 'user_owner_01',
    name: 'Rajesh Sharma',
    email: 'owner@a2zmart.in',
    role: 'OWNER',
    storeId: 'store_main_01',
    active: true,
    pin: '1234',
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    db.resetToDefaults();
  });

  it('successfully completes the critical acceptance test workflow', () => {
    // 1. Initial State: Men's T-Shirt has 20 stock, Selling: 349, Floor: 319, Cost: 240
    const tshirt = db.getProductByBarcode('TSH001');
    expect(tshirt).toBeDefined();
    expect(tshirt?.name).toBe("Men's T-Shirt");
    expect(tshirt?.sellingPrice).toBe(349);
    expect(tshirt?.floorPrice).toBe(319);
    expect(tshirt?.costPrice).toBe(240);
    expect(tshirt?.stock).toBe(20);

    // 2. Add to Cart: 1 unit
    const cartItem: CartItem = {
      id: 'cart_test_line_1',
      productId: tshirt!.id,
      name: tshirt!.name,
      sku: tshirt!.sku,
      barcode: tshirt!.barcode,
      unit: tshirt!.unit,
      isDecimalUnit: false,
      quantity: 1,
      mrp: tshirt!.mrp,
      costPrice: tshirt!.costPrice,
      originalSellingPrice: tshirt!.sellingPrice,
      unitPrice: 325, // Owner finalized negotiated price
      floorPrice: tshirt!.floorPrice,
      gstRate: tshirt!.gstRate,
      negotiationEnabled: true,
      isNegotiated: true,
      customerOffer: 300,
      negotiatedBy: 'Rajesh Sharma (Owner Approved)',
    };

    // 3. Create Sale: Net Total ₹325, Cash Tendered ₹500, Change Given ₹175
    const invoiceNumber = db.getNextInvoiceNumber();
    expect(invoiceNumber).toBe('INV-000001');

    const sale: Sale = {
      id: `sale_${Date.now()}`,
      storeId: 'store_main_01',
      invoiceNumber,
      items: [cartItem],
      subtotal: 349,
      taxTotal: 15.48,
      discountTotal: 24, // 349 - 325
      total: 325,
      costTotal: 240,
      grossProfit: 325 - 240, // 85
      paymentMethod: 'CASH',
      amountPaid: 325,
      cashTendered: 500,
      changeGiven: 175,
      paymentStatus: 'PAID',
      hasNegotiation: true,
      negotiationSummary: {
        totalOriginalPrice: 349,
        totalNegotiatedPrice: 325,
        totalDiscount: 24,
        approvedBy: 'Rajesh Sharma (Owner Approved)',
        approvedAt: new Date().toISOString(),
      },
      cashierId: ownerUser.id,
      cashierName: ownerUser.name,
      createdAt: new Date().toISOString(),
      status: 'COMPLETED',
    };

    db.createSale(sale, ownerUser);

    // 4. Assert: Stock becomes 19
    const updatedTshirt = db.getProductById(tshirt!.id);
    expect(updatedTshirt?.stock).toBe(19);

    // 5. Assert: Stock movement logged
    const movements = db.getStockMovements();
    const saleMovement = movements.find(
      (m) => m.productId === tshirt!.id && m.type === 'SALE'
    );
    expect(saleMovement).toBeDefined();
    expect(saleMovement?.quantity).toBe(-1);
    expect(saleMovement?.previousStock).toBe(20);
    expect(saleMovement?.newStock).toBe(19);

    // 6. Assert: Negotiation record stored
    const negRecords = db.getNegotiationRecords();
    const tshirtNeg = negRecords.find((n) => n.productId === tshirt!.id);
    expect(tshirtNeg).toBeDefined();
    expect(tshirtNeg?.originalPrice).toBe(349);
    expect(tshirtNeg?.customerOffer).toBe(300);
    expect(tshirtNeg?.finalPrice).toBe(325);
    expect(tshirtNeg?.discountGranted).toBe(24);

    // 7. Assert: Audit log records owner negotiation approval
    const auditLogs = db.getAuditLogs();
    const negAudit = auditLogs.find((a) => a.category === 'NEGOTIATION');
    expect(negAudit).toBeDefined();
    expect(negAudit?.action).toContain('Negotiation Approved');
    expect(negAudit?.details).toContain('Final price ₹325');
  });

  it('correctly handles Kirana decimal quantities in billing and stock reduction', () => {
    // Royal Basmati Rice: stock 120.5 kg, selling 95/kg
    const rice = db.getProductByBarcode('KIR001');
    expect(rice).toBeDefined();
    expect(rice?.stock).toBe(120.5);

    const qty = 1.75;
    const rate = rice!.sellingPrice;
    const lineTotal = Math.round(qty * rate * 100) / 100; // 1.75 * 95 = 166.25

    const cartItem: CartItem = {
      id: 'cart_rice_line',
      productId: rice!.id,
      name: rice!.name,
      sku: rice!.sku,
      barcode: rice!.barcode,
      unit: rice!.unit,
      isDecimalUnit: true,
      quantity: qty,
      mrp: rice!.mrp,
      costPrice: rice!.costPrice,
      originalSellingPrice: rate,
      unitPrice: rate,
      floorPrice: rice!.floorPrice,
      gstRate: rice!.gstRate,
      negotiationEnabled: true,
      isNegotiated: false,
    };

    const sale: Sale = {
      id: `sale_rice_${Date.now()}`,
      storeId: 'store_main_01',
      invoiceNumber: db.getNextInvoiceNumber(),
      items: [cartItem],
      subtotal: lineTotal,
      taxTotal: 0,
      discountTotal: 0,
      total: lineTotal,
      costTotal: qty * rice!.costPrice,
      grossProfit: lineTotal - qty * rice!.costPrice,
      paymentMethod: 'UPI',
      amountPaid: lineTotal,
      paymentStatus: 'PAID',
      hasNegotiation: false,
      cashierId: ownerUser.id,
      cashierName: ownerUser.name,
      createdAt: new Date().toISOString(),
      status: 'COMPLETED',
    };

    db.createSale(sale, ownerUser);

    const updatedRice = db.getProductById(rice!.id);
    expect(updatedRice?.stock).toBe(120.5 - 1.75); // 118.75 kg
  });
});
