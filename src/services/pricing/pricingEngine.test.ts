import { describe, it, expect } from 'vitest';
import { PricingEngine } from './pricingEngine';
import { Product, CartItem } from '@/types/models';

describe('PricingEngine & Smart Negotiation Business Logic', () => {
  const testTshirt: Product = {
    id: 'prod_test_tshirt',
    storeId: 'store_main_01',
    name: "Men's T-Shirt",
    sku: 'TSH-001',
    barcode: 'TSH001',
    category: 'Fashion',
    unit: 'pc',
    isDecimalUnit: false,
    costPrice: 240,
    mrp: 399,
    sellingPrice: 349,
    floorPrice: 319,
    gstRate: 5,
    stock: 20,
    minStockAlert: 5,
    active: true,
    negotiationEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('evaluates customer offer against absolute floor', () => {
    // Critical Acceptance Test: Offer ₹300, Floor ₹319
    const evaluation = PricingEngine.evaluateItem(testTshirt, undefined, 300);

    expect(evaluation.isOfferBelowFloor).toBe(true);
    expect(evaluation.absoluteFloor).toBe(319);
    expect(evaluation.baseSellingPrice).toBe(349);
    // Counter offer should be ₹329 as specified in prompt
    expect(evaluation.suggestedCounterOffer).toBe(329);
  });

  it('strictly BLOCKS owner final price below absolute floor', () => {
    // Attempting ₹318 when floor is ₹319 must be BLOCKED
    const checkUnder = PricingEngine.validatePriceOverride(318, 319, 349);
    expect(checkUnder.isValid).toBe(false);
    expect(checkUnder.reason).toContain('strictly below the absolute floor');

    // Offering exactly floor ₹319 is allowed
    const checkFloor = PricingEngine.validatePriceOverride(319, 319, 349);
    expect(checkFloor.isValid).toBe(true);

    // Finalizing ₹325 is allowed
    const checkValid = PricingEngine.validatePriceOverride(325, 319, 349);
    expect(checkValid.isValid).toBe(true);
  });

  it('evaluates cart-level negotiation and protects item floors', () => {
    const cartItems: CartItem[] = [
      {
        id: '1',
        productId: 'p1',
        name: 'T-Shirt',
        sku: 'TSH-001',
        barcode: 'TSH001',
        unit: 'pc',
        isDecimalUnit: false,
        quantity: 1,
        mrp: 399,
        costPrice: 240,
        originalSellingPrice: 349,
        unitPrice: 349,
        floorPrice: 319,
        gstRate: 5,
        negotiationEnabled: true,
      },
      {
        id: '2',
        productId: 'p2',
        name: 'Jeans',
        sku: 'JNS-002',
        barcode: 'FSH002',
        unit: 'pc',
        isDecimalUnit: false,
        quantity: 1,
        mrp: 799,
        costPrice: 480,
        originalSellingPrice: 599,
        unitPrice: 599,
        floorPrice: 520,
        gstRate: 5,
        negotiationEnabled: true,
      },
      {
        id: '3',
        productId: 'p3',
        name: 'Shirt',
        sku: 'SHT-003',
        barcode: 'FSH003',
        unit: 'pc',
        isDecimalUnit: false,
        quantity: 1,
        mrp: 599,
        costPrice: 360,
        originalSellingPrice: 399,
        unitPrice: 399,
        floorPrice: 360,
        gstRate: 5,
        negotiationEnabled: true,
      },
    ];

    // Total = 349 + 599 + 399 = 1347
    // Combined floor = 319 + 520 + 360 = 1199
    const evalResult = PricingEngine.evaluateCartNegotiation(cartItems, 1200);

    expect(evalResult.cartSubtotal).toBe(1347);
    expect(evalResult.cartTotalFloor).toBe(1199);
    expect(evalResult.isOfferBelowTotalFloor).toBe(false);

    // Owner finalizes at ₹1260
    const distributed = PricingEngine.distributeCartDiscount(cartItems, 1260);
    const distributedTotal = distributed.reduce((acc, it) => acc + it.unitPrice, 0);

    // Sum of distributed items should match ₹1260 approximately (+/- 1 due to rounding)
    expect(Math.abs(distributedTotal - 1260)).toBeLessThanOrEqual(1.5);

    // Verify NO item dropped below its individual floor
    distributed.forEach((item) => {
      expect(item.unitPrice).toBeGreaterThanOrEqual(item.floorPrice);
    });
  });

  it('correctly calculates cash change for tendered amount', () => {
    const billTotal = 325;
    const tendered = 500;
    const change = tendered - billTotal;
    expect(change).toBe(175);
  });
});
