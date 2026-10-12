import { Product, ProductVariant, CartItem } from '@/types/models';

export interface PricingEvaluation {
  productId: string;
  variantId?: string;
  name: string;
  mrp: number;
  costPrice: number;
  baseSellingPrice: number;
  absoluteFloor: number;
  negotiationEnabled: boolean;
  gstRate: number;
  
  // Negotiation evaluation
  customerOffer?: number;
  isOfferBelowFloor: boolean;
  suggestedCounterOffer: number;
  maxAllowableDiscount: number;
  potentialMarginAtOffer?: number;
  potentialMarginAtSuggested: number;
}

export class PricingEngine {
  /**
   * Evaluates pricing & negotiation parameters for an item
   */
  static evaluateItem(
    product: Product,
    variant?: ProductVariant,
    customerOffer?: number
  ): PricingEvaluation {
    const mrp = variant ? variant.mrp : product.mrp;
    const costPrice = variant ? variant.costPrice : product.costPrice;
    const baseSellingPrice = variant ? variant.sellingPrice : product.sellingPrice;
    const absoluteFloor = variant ? variant.floorPrice : product.floorPrice;
    const negotiationEnabled = product.negotiationEnabled;
    const gstRate = product.gstRate;

    // Max discount possible while respecting absolute floor
    const maxAllowableDiscount = Math.max(0, baseSellingPrice - absoluteFloor);

    // Suggested counter offer calculation
    // Locally accepted retail formula: Give approx 65-70% of room between selling price and floor price
    // e.g. SP: 349, Floor: 319 -> Diff: 30 -> 349 - (30 * 0.65) = 349 - 20 = 329
    let suggestedCounterOffer = baseSellingPrice;
    if (baseSellingPrice > absoluteFloor) {
      const discountBuffer = Math.round((baseSellingPrice - absoluteFloor) * 0.66);
      suggestedCounterOffer = Math.max(absoluteFloor, baseSellingPrice - discountBuffer);
    }

    const isOfferBelowFloor = customerOffer !== undefined ? customerOffer < absoluteFloor : false;
    const potentialMarginAtOffer = customerOffer !== undefined ? customerOffer - costPrice : undefined;
    const potentialMarginAtSuggested = suggestedCounterOffer - costPrice;

    return {
      productId: product.id,
      variantId: variant?.id,
      name: variant ? `${product.name} (${variant.name})` : product.name,
      mrp,
      costPrice,
      baseSellingPrice,
      absoluteFloor,
      negotiationEnabled,
      gstRate,
      customerOffer,
      isOfferBelowFloor,
      suggestedCounterOffer,
      maxAllowableDiscount,
      potentialMarginAtOffer,
      potentialMarginAtSuggested,
    };
  }

  /**
   * Validates if a proposed owner final price meets the absolute floor requirement
   */
  static validatePriceOverride(
    proposedPrice: number,
    absoluteFloor: number,
    baseSellingPrice: number
  ): {
    isValid: boolean;
    reason?: string;
  } {
    if (isNaN(proposedPrice) || proposedPrice <= 0) {
      return { isValid: false, reason: 'Invalid price amount' };
    }

    if (proposedPrice < absoluteFloor) {
      return {
        isValid: false,
        reason: `Price ₹${proposedPrice} is strictly below the absolute floor of ₹${absoluteFloor}. Local policy prevents loss-making overrides.`,
      };
    }

    return { isValid: true };
  }

  /**
   * Cart-level negotiation evaluator
   */
  static evaluateCartNegotiation(
    items: CartItem[],
    customerCartOffer: number
  ): {
    cartSubtotal: number;
    cartTotalFloor: number;
    cartCostTotal: number;
    isOfferBelowTotalFloor: boolean;
    suggestedCartTotal: number;
    totalSavingsRequested: number;
    recommendedSavings: number;
  } {
    const cartSubtotal = items.reduce((acc, item) => acc + item.originalSellingPrice * item.quantity, 0);
    const cartTotalFloor = items.reduce((acc, item) => acc + item.floorPrice * item.quantity, 0);
    const cartCostTotal = items.reduce((acc, item) => acc + item.costPrice * item.quantity, 0);

    const isOfferBelowTotalFloor = customerCartOffer < cartTotalFloor;
    const totalSavingsRequested = Math.max(0, cartSubtotal - customerCartOffer);

    // Recommended final price based on weighted floors
    const totalDiscretionaryMargin = Math.max(0, cartSubtotal - cartTotalFloor);
    const safeDiscount = Math.round(totalDiscretionaryMargin * 0.55);
    const suggestedCartTotal = Math.max(cartTotalFloor, cartSubtotal - safeDiscount);
    const recommendedSavings = cartSubtotal - suggestedCartTotal;

    return {
      cartSubtotal,
      cartTotalFloor,
      cartCostTotal,
      isOfferBelowTotalFloor,
      suggestedCartTotal,
      totalSavingsRequested,
      recommendedSavings,
    };
  }

  /**
   * Distribute a cart-level negotiated total across individual items proportionately
   * while strictly protecting every single item's floor price.
   */
  static distributeCartDiscount(
    items: CartItem[],
    finalCartTotal: number
  ): CartItem[] {
    const currentTotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const totalDiscountToApply = currentTotal - finalCartTotal;

    if (totalDiscountToApply <= 0) {
      return items;
    }

    // Calculate available buffer above floor for each item
    const itemBuffers = items.map((item) => ({
      item,
      buffer: Math.max(0, (item.unitPrice - item.floorPrice) * item.quantity),
    }));

    const totalBuffer = itemBuffers.reduce((acc, b) => acc + b.buffer, 0);

    if (totalBuffer === 0) {
      return items; // cannot discount further without breaching floor
    }

    return itemBuffers.map(({ item, buffer }) => {
      if (buffer <= 0) return item;

      const itemShareOfDiscount = (buffer / totalBuffer) * totalDiscountToApply;
      const discountPerUnit = itemShareOfDiscount / item.quantity;
      const proposedUnitPrice = Math.round((item.unitPrice - discountPerUnit) * 100) / 100;
      const finalUnitPrice = Math.max(item.floorPrice, proposedUnitPrice);

      return {
        ...item,
        unitPrice: finalUnitPrice,
        isNegotiated: true,
        negotiatedPrice: finalUnitPrice,
        ownerOverrideApproved: true,
      };
    });
  }

  /**
   * Formats Indian Rupee currency standard
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  }
}
