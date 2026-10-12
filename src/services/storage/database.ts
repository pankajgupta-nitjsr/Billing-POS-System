import {
  Product,
  Sale,
  StockMovement,
  Customer,
  Supplier,
  Purchase,
  Expense,
  CashierShift,
  StoreSettings,
  AuditLog,
  HeldBill,
  SaleReturn,
  NegotiationAnalyticsRecord,
  User,
} from '@/types/models';
import {
  INITIAL_PRODUCTS,
  INITIAL_STORE_SETTINGS,
  INITIAL_USERS,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
} from '@/services/seed/seedData';

const STORAGE_KEYS = {
  PRODUCTS: 'a2z_products_v1',
  SALES: 'a2z_sales_v1',
  STOCK_MOVEMENTS: 'a2z_stock_movements_v1',
  CUSTOMERS: 'a2z_customers_v1',
  SUPPLIERS: 'a2z_suppliers_v1',
  PURCHASES: 'a2z_purchases_v1',
  EXPENSES: 'a2z_expenses_v1',
  SHIFTS: 'a2z_shifts_v1',
  SETTINGS: 'a2z_settings_v1',
  USERS: 'a2z_users_v1',
  AUDIT_LOGS: 'a2z_audit_logs_v1',
  HELD_BILLS: 'a2z_held_bills_v1',
  RETURNS: 'a2z_returns_v1',
  NEGOTIATIONS: 'a2z_negotiations_v1',
  CURRENT_USER: 'a2z_current_user_v1',
  OFFLINE_QUEUE: 'a2z_offline_sync_queue_v1',
  ACTIVE_SHIFT: 'a2z_active_shift_v1',
};

class AppDatabase {
  private listeners: Set<() => void> = new Set();
  private memoryStore: Map<string, string> = new Map();

  constructor() {
    this.initializeIfEmpty();
  }

  private hasStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private getStorageItem(key: string): string | null {
    if (this.hasStorage()) {
      return localStorage.getItem(key);
    }
    return this.memoryStore.get(key) || null;
  }

  private setStorageItem(key: string, value: string): void {
    if (this.hasStorage()) {
      localStorage.setItem(key, value);
    } else {
      this.memoryStore.set(key, value);
    }
  }

  private removeStorageItem(key: string): void {
    if (this.hasStorage()) {
      localStorage.removeItem(key);
    } else {
      this.memoryStore.delete(key);
    }
  }

  private initializeIfEmpty() {
    if (!this.getStorageItem(STORAGE_KEYS.PRODUCTS)) {
      this.save(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    }
    if (!this.getStorageItem(STORAGE_KEYS.SETTINGS)) {
      this.save(STORAGE_KEYS.SETTINGS, INITIAL_STORE_SETTINGS);
    }
    if (!this.getStorageItem(STORAGE_KEYS.USERS)) {
      this.save(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    if (!this.getStorageItem(STORAGE_KEYS.SUPPLIERS)) {
      this.save(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    }
    if (!this.getStorageItem(STORAGE_KEYS.CUSTOMERS)) {
      this.save(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    }
    if (!this.getStorageItem(STORAGE_KEYS.SALES)) {
      this.save(STORAGE_KEYS.SALES, []);
    }
    if (!this.getStorageItem(STORAGE_KEYS.STOCK_MOVEMENTS)) {
      // Create initial opening stock movements
      const initialMovements: StockMovement[] = INITIAL_PRODUCTS.map((p) => ({
        id: `sm_init_${p.id}`,
        storeId: p.storeId,
        productId: p.id,
        productName: p.name,
        type: 'OPENING',
        quantity: p.stock,
        previousStock: 0,
        newStock: p.stock,
        reason: 'Initial Opening Stock Entry',
        userId: 'user_owner_01',
        userName: 'Rajesh Sharma (Owner)',
        createdAt: p.createdAt,
      }));
      this.save(STORAGE_KEYS.STOCK_MOVEMENTS, initialMovements);
    }
    if (!this.getStorageItem(STORAGE_KEYS.AUDIT_LOGS)) {
      const initialAudit: AuditLog[] = [
        {
          id: 'audit_init_01',
          storeId: 'store_main_01',
          action: 'Store Setup Completed',
          category: 'SETTINGS',
          details: 'Initialized store settings, Kirana and Fashion product catalog with protective floor rules.',
          userId: 'user_owner_01',
          userName: 'Rajesh Sharma',
          userRole: 'OWNER',
          createdAt: new Date().toISOString(),
        },
      ];
      this.save(STORAGE_KEYS.AUDIT_LOGS, initialAudit);
    }
    if (!this.getStorageItem(STORAGE_KEYS.HELD_BILLS)) {
      this.save(STORAGE_KEYS.HELD_BILLS, []);
    }
    if (!this.getStorageItem(STORAGE_KEYS.RETURNS)) {
      this.save(STORAGE_KEYS.RETURNS, []);
    }
    if (!this.getStorageItem(STORAGE_KEYS.NEGOTIATIONS)) {
      this.save(STORAGE_KEYS.NEGOTIATIONS, []);
    }
    if (!this.getStorageItem(STORAGE_KEYS.EXPENSES)) {
      this.save(STORAGE_KEYS.EXPENSES, []);
    }
    if (!this.getStorageItem(STORAGE_KEYS.PURCHASES)) {
      this.save(STORAGE_KEYS.PURCHASES, []);
    }
    if (!this.getStorageItem(STORAGE_KEYS.SHIFTS)) {
      this.save(STORAGE_KEYS.SHIFTS, []);
    }
    if (!this.getStorageItem(STORAGE_KEYS.OFFLINE_QUEUE)) {
      this.save(STORAGE_KEYS.OFFLINE_QUEUE, []);
    }
  }

  private load<T>(key: string, defaultValue: T): T {
    try {
      const data = this.getStorageItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private save<T>(key: string, data: T) {
    try {
      this.setStorageItem(key, JSON.stringify(data));
      this.notifyListeners();
    } catch (e) {
      console.error(`Failed to save key ${key}:`, e);
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l());
  }

  // --- STORE SETTINGS ---
  getSettings(): StoreSettings {
    return this.load(STORAGE_KEYS.SETTINGS, INITIAL_STORE_SETTINGS);
  }

  updateSettings(settings: Partial<StoreSettings>, user: User): void {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    this.save(STORAGE_KEYS.SETTINGS, updated);

    this.addAuditLog({
      action: 'Updated Store Settings',
      category: 'SETTINGS',
      details: `Store profile or policy configuration updated by ${user.name}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      storeId: current.id,
    });
  }

  // --- PRODUCTS ---
  getProducts(): Product[] {
    return this.load(STORAGE_KEYS.PRODUCTS, []);
  }

  getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  }

  getProductByBarcode(code: string): Product | undefined {
    const cleaned = code.trim().toLowerCase();
    const products = this.getProducts();

    for (const p of products) {
      if (p.barcode?.toLowerCase() === cleaned) return p;
      if (p.sku?.toLowerCase() === cleaned) return p;
      if (p.qrCode?.toLowerCase() === cleaned) return p;
      if (p.variants) {
        const matchingVar = p.variants.find(
          (v) => v.barcode?.toLowerCase() === cleaned || v.sku?.toLowerCase() === cleaned
        );
        if (matchingVar) return p;
      }
    }
    return undefined;
  }

  saveProduct(product: Product, user: User, isNew: boolean = false): void {
    const products = this.getProducts();
    const existing = products.find((p) => p.id === product.id);

    if (existing) {
      // Check if price or floor changed
      if (existing.floorPrice !== product.floorPrice || existing.costPrice !== product.costPrice) {
        this.addAuditLog({
          action: 'Product Floor or Cost Modified',
          category: 'PRICING',
          details: `Floor price changed: ₹${existing.floorPrice} → ₹${product.floorPrice}, Cost: ₹${existing.costPrice} → ₹${product.costPrice} on ${product.name}`,
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          storeId: product.storeId,
          metadata: {
            oldFloor: existing.floorPrice,
            newFloor: product.floorPrice,
            oldCost: existing.costPrice,
            newCost: product.costPrice,
          },
        });
      }

      const updated = products.map((p) => (p.id === product.id ? product : p));
      this.save(STORAGE_KEYS.PRODUCTS, updated);
    } else {
      this.save(STORAGE_KEYS.PRODUCTS, [product, ...products]);
      this.addAuditLog({
        action: 'Created New Product',
        category: 'STOCK',
        details: `Created product "${product.name}" with initial stock ${product.stock} and floor ₹${product.floorPrice}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        storeId: product.storeId,
      });

      // Stock movement for opening
      if (product.stock > 0) {
        this.recordStockMovement({
          storeId: product.storeId,
          productId: product.id,
          productName: product.name,
          type: 'OPENING',
          quantity: product.stock,
          previousStock: 0,
          newStock: product.stock,
          reason: 'Initial Product Creation Opening Stock',
          userId: user.id,
          userName: user.name,
        });
      }
    }
  }

  deactivateProduct(productId: string, user: User): void {
    const products = this.getProducts();
    const p = products.find((item) => item.id === productId);
    if (!p) return;

    const updated = products.map((item) =>
      item.id === productId ? { ...item, active: false, updatedAt: new Date().toISOString() } : item
    );
    this.save(STORAGE_KEYS.PRODUCTS, updated);

    this.addAuditLog({
      action: 'Deactivated Product',
      category: 'STOCK',
      details: `Deactivated product "${p.name}" (soft-deleted). Sales history preserved.`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      storeId: p.storeId,
    });
  }

  // --- STOCK ENGINE ---
  recordStockMovement(movement: Omit<StockMovement, 'id' | 'createdAt'>): StockMovement {
    const movements = this.getStockMovements();
    const newMovement: StockMovement = {
      ...movement,
      id: `sm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
    };
    this.save(STORAGE_KEYS.STOCK_MOVEMENTS, [newMovement, ...movements]);
    return newMovement;
  }

  getStockMovements(): StockMovement[] {
    return this.load(STORAGE_KEYS.STOCK_MOVEMENTS, []);
  }

  adjustStock(
    productId: string,
    variantId: string | undefined,
    adjustmentQty: number, // + or -
    reason: string,
    user: User
  ): boolean {
    const products = this.getProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) return false;

    const prevStock = product.stock;
    const newStock = Math.max(0, prevStock + adjustmentQty);

    const updatedProducts = products.map((p) => {
      if (p.id !== productId) return p;
      if (variantId && p.variants) {
        const updatedVariants = p.variants.map((v) =>
          v.id === variantId ? { ...v, stock: Math.max(0, v.stock + adjustmentQty) } : v
        );
        return { ...p, stock: newStock, variants: updatedVariants, updatedAt: new Date().toISOString() };
      }
      return { ...p, stock: newStock, updatedAt: new Date().toISOString() };
    });

    this.save(STORAGE_KEYS.PRODUCTS, updatedProducts);

    this.recordStockMovement({
      storeId: product.storeId,
      productId: product.id,
      variantId,
      productName: product.name,
      type: adjustmentQty < 0 ? 'DAMAGE' : 'ADJUSTMENT',
      quantity: adjustmentQty,
      previousStock: prevStock,
      newStock,
      reason: reason || 'Manual Stock Adjustment',
      userId: user.id,
      userName: user.name,
    });

    this.addAuditLog({
      action: 'Stock Adjustment',
      category: 'STOCK',
      details: `Adjusted stock for ${product.name} by ${adjustmentQty > 0 ? '+' : ''}${adjustmentQty} units (${prevStock} → ${newStock}). Reason: ${reason}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      storeId: product.storeId,
    });

    return true;
  }

  // --- SALES & BILLING ---
  getNextInvoiceNumber(): string {
    const sales = this.getSales();
    const count = sales.length + 1;
    const padded = String(count).padStart(6, '0');
    return `INV-${padded}`;
  }

  getSales(): Sale[] {
    return this.load(STORAGE_KEYS.SALES, []);
  }

  getSaleById(id: string): Sale | undefined {
    return this.getSales().find((s) => s.id === id);
  }

  createSale(sale: Sale, user: User): Sale {
    const sales = this.getSales();
    const products = this.getProducts();

    // 1. Save Sale
    this.save(STORAGE_KEYS.SALES, [sale, ...sales]);

    // 2. Decrement stock & record stock movement for each item
    const updatedProducts = products.map((prod) => {
      const itemsSold = sale.items.filter((item) => item.productId === prod.id);
      if (itemsSold.length === 0) return prod;

      const totalQtySold = itemsSold.reduce((acc, it) => acc + it.quantity, 0);
      const prevStock = prod.stock;
      const newStock = Math.max(0, prevStock - totalQtySold);

      // Record stock movement
      this.recordStockMovement({
        storeId: prod.storeId,
        productId: prod.id,
        productName: prod.name,
        type: 'SALE',
        quantity: -totalQtySold,
        previousStock: prevStock,
        newStock,
        referenceDocId: sale.invoiceNumber,
        reason: `POS Sale ${sale.invoiceNumber}`,
        userId: user.id,
        userName: user.name,
      });

      // Update variant stock if variant sold
      let updatedVariants = prod.variants;
      if (prod.variants) {
        updatedVariants = prod.variants.map((v) => {
          const varSold = itemsSold.find((it) => it.variantId === v.id);
          if (varSold) {
            return { ...v, stock: Math.max(0, v.stock - varSold.quantity) };
          }
          return v;
        });
      }

      return {
        ...prod,
        stock: newStock,
        variants: updatedVariants,
        updatedAt: new Date().toISOString(),
      };
    });

    this.save(STORAGE_KEYS.PRODUCTS, updatedProducts);

    // 3. Record negotiation analytics if any item was bargained / negotiated
    const negotiatedItems = sale.items.filter((it) => it.isNegotiated);
    if (negotiatedItems.length > 0) {
      const negRecords = this.getNegotiationRecords();
      const newNegRecords: NegotiationAnalyticsRecord[] = negotiatedItems.map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const originalPrice = item.originalSellingPrice;
        const finalPrice = item.unitPrice;
        const discountGranted = Math.max(0, (originalPrice - finalPrice) * item.quantity);

        return {
          id: `neg_${Date.now()}_${item.id}`,
          storeId: sale.storeId,
          saleId: sale.id,
          invoiceNumber: sale.invoiceNumber,
          productId: item.productId,
          productName: item.name,
          category: prod?.category || 'General',
          originalPrice,
          customerOffer: item.customerOffer || finalPrice,
          floorPrice: item.floorPrice,
          finalPrice,
          discountGranted,
          approvedBy: item.negotiatedBy || user.name,
          cashierId: sale.cashierId,
          createdAt: sale.createdAt,
        };
      });

      this.save(STORAGE_KEYS.NEGOTIATIONS, [...newNegRecords, ...negRecords]);

      // Audit log the negotiation approval
      this.addAuditLog({
        action: 'Negotiation Approved on Sale',
        category: 'NEGOTIATION',
        details: `Negotiated price authorized on ${sale.invoiceNumber}. Final price ₹${sale.total} (Saved customer ₹${sale.discountTotal}). Approved by ${sale.negotiationSummary?.approvedBy || user.name}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        storeId: sale.storeId,
        metadata: {
          invoice: sale.invoiceNumber,
          negotiatedItems: negotiatedItems.map((n) => ({
            name: n.name,
            original: n.originalSellingPrice,
            final: n.unitPrice,
            floor: n.floorPrice,
          })),
        },
      });
    }

    // 4. Update customer stats if assigned
    if (sale.customerId) {
      this.updateCustomerPurchase(sale.customerId, sale.total);
    }

    // 5. Update active shift sales counter
    this.recordShiftSale(sale);

    return sale;
  }

  // --- RETURNS & REFUNDS ---
  processReturn(returnRecord: SaleReturn, user: User): boolean {
    const returns = this.getReturns();
    const sales = this.getSales();
    const products = this.getProducts();

    const sale = sales.find((s) => s.id === returnRecord.saleId);
    if (!sale) return false;

    // 1. Record Return
    this.save(STORAGE_KEYS.RETURNS, [returnRecord, ...returns]);

    // 2. Mark Sale as RETURNED or PARTIAL_RETURN
    const totalSaleItemsCount = sale.items.reduce((acc, i) => acc + i.quantity, 0);
    const returnedItemsCount = returnRecord.items.reduce((acc, i) => acc + i.quantity, 0);
    const isFullReturn = returnedItemsCount >= totalSaleItemsCount;

    const updatedSales = sales.map((s) => {
      if (s.id !== sale.id) return s;
      return {
        ...s,
        status: isFullReturn ? ('RETURNED' as const) : ('PARTIAL_RETURN' as const),
        returnedAmount: (s.returnedAmount || 0) + returnRecord.totalRefund,
      };
    });
    this.save(STORAGE_KEYS.SALES, updatedSales);

    // 3. Auto-restore inventory & record stock movements
    const updatedProducts = products.map((prod) => {
      const itemsRestored = returnRecord.items.filter((it) => it.productId === prod.id);
      if (itemsRestored.length === 0) return prod;

      const restoredQty = itemsRestored.reduce((acc, it) => acc + it.quantity, 0);
      const prevStock = prod.stock;
      const newStock = prevStock + restoredQty;

      this.recordStockMovement({
        storeId: prod.storeId,
        productId: prod.id,
        productName: prod.name,
        type: 'RETURN',
        quantity: restoredQty,
        previousStock: prevStock,
        newStock,
        referenceDocId: returnRecord.invoiceNumber,
        reason: `Sales Return for ${returnRecord.invoiceNumber}: ${returnRecord.reason}`,
        userId: user.id,
        userName: user.name,
      });

      let updatedVariants = prod.variants;
      if (prod.variants) {
        updatedVariants = prod.variants.map((v) => {
          const varRestored = itemsRestored.find((it) => it.variantId === v.id);
          if (varRestored) {
            return { ...v, stock: v.stock + varRestored.quantity };
          }
          return v;
        });
      }

      return {
        ...prod,
        stock: newStock,
        variants: updatedVariants,
        updatedAt: new Date().toISOString(),
      };
    });

    this.save(STORAGE_KEYS.PRODUCTS, updatedProducts);

    // 4. Audit Log
    this.addAuditLog({
      action: 'Sales Return Processed',
      category: 'RETURN',
      details: `Processed return on ${returnRecord.invoiceNumber} for ₹${returnRecord.totalRefund}. Reason: ${returnRecord.reason}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      storeId: returnRecord.storeId,
    });

    return true;
  }

  getReturns(): SaleReturn[] {
    return this.load(STORAGE_KEYS.RETURNS, []);
  }

  // --- HELD BILLS ---
  getHeldBills(): HeldBill[] {
    return this.load(STORAGE_KEYS.HELD_BILLS, []);
  }

  saveHeldBill(bill: HeldBill): void {
    const current = this.getHeldBills();
    this.save(STORAGE_KEYS.HELD_BILLS, [bill, ...current]);
  }

  deleteHeldBill(id: string): void {
    const current = this.getHeldBills();
    this.save(
      STORAGE_KEYS.HELD_BILLS,
      current.filter((b) => b.id !== id)
    );
  }

  // --- CASHIER SHIFTS ---
  getActiveShift(): CashierShift | null {
    return this.load(STORAGE_KEYS.ACTIVE_SHIFT, null);
  }

  startShift(cashierId: string, cashierName: string, openingCash: number): CashierShift {
    const newShift: CashierShift = {
      id: `shift_${Date.now()}`,
      storeId: 'store_main_01',
      cashierId,
      cashierName,
      openedAt: new Date().toISOString(),
      openingCash,
      cashSales: 0,
      upiSales: 0,
      cardSales: 0,
      refundsGiven: 0,
      cashExpenses: 0,
      expectedCash: openingCash,
      status: 'OPEN',
    };
    this.save(STORAGE_KEYS.ACTIVE_SHIFT, newShift);
    return newShift;
  }

  private recordShiftSale(sale: Sale): void {
    const shift = this.getActiveShift();
    if (!shift || shift.status !== 'OPEN') return;

    let cash = shift.cashSales;
    let upi = shift.upiSales;
    let card = shift.cardSales;

    if (sale.paymentMethod === 'CASH') cash += sale.total;
    else if (sale.paymentMethod === 'UPI') upi += sale.total;
    else if (sale.paymentMethod === 'CARD') card += sale.total;
    else if (sale.paymentMethod === 'SPLIT' && sale.paymentSplits) {
      sale.paymentSplits.forEach((sp) => {
        if (sp.method === 'CASH') cash += sp.amount;
        if (sp.method === 'UPI') upi += sp.amount;
        if (sp.method === 'CARD') card += sp.amount;
      });
    }

    const expectedCash = shift.openingCash + cash - shift.refundsGiven - shift.cashExpenses;

    const updated: CashierShift = {
      ...shift,
      cashSales: cash,
      upiSales: upi,
      cardSales: card,
      expectedCash,
    };

    this.save(STORAGE_KEYS.ACTIVE_SHIFT, updated);
  }

  closeShift(actualCash: number, reason?: string): CashierShift | null {
    const shift = this.getActiveShift();
    if (!shift) return null;

    const difference = actualCash - shift.expectedCash;
    const closed: CashierShift = {
      ...shift,
      actualCash,
      difference,
      differenceReason: reason,
      closedAt: new Date().toISOString(),
      status: 'CLOSED',
    };

    const shifts = this.load<CashierShift[]>(STORAGE_KEYS.SHIFTS, []);
    this.save(STORAGE_KEYS.SHIFTS, [closed, ...shifts]);
    this.save(STORAGE_KEYS.ACTIVE_SHIFT, null);

    this.addAuditLog({
      action: 'Cashier Shift Closed',
      category: 'AUTH',
      details: `Shift closed by ${shift.cashierName}. Expected Cash: ₹${shift.expectedCash}, Actual Cash: ₹${actualCash}, Variance: ₹${difference}`,
      userId: shift.cashierId,
      userName: shift.cashierName,
      userRole: 'CASHIER',
      storeId: shift.storeId,
    });

    return closed;
  }

  getShiftHistory(): CashierShift[] {
    return this.load(STORAGE_KEYS.SHIFTS, []);
  }

  // --- CUSTOMERS & SUPPLIERS ---
  getCustomers(): Customer[] {
    return this.load(STORAGE_KEYS.CUSTOMERS, []);
  }

  saveCustomer(customer: Customer): void {
    const customers = this.getCustomers();
    const idx = customers.findIndex((c) => c.id === customer.id);
    if (idx >= 0) {
      customers[idx] = customer;
      this.save(STORAGE_KEYS.CUSTOMERS, [...customers]);
    } else {
      this.save(STORAGE_KEYS.CUSTOMERS, [customer, ...customers]);
    }
  }

  private updateCustomerPurchase(customerId: string, amount: number) {
    const customers = this.getCustomers();
    const updated = customers.map((c) => {
      if (c.id !== customerId) return c;
      return {
        ...c,
        totalPurchases: c.totalPurchases + amount,
        totalVisits: c.totalVisits + 1,
        lastVisit: new Date().toISOString(),
      };
    });
    this.save(STORAGE_KEYS.CUSTOMERS, updated);
  }

  getSuppliers(): Supplier[] {
    return this.load(STORAGE_KEYS.SUPPLIERS, []);
  }

  saveSupplier(supplier: Supplier): void {
    const list = this.getSuppliers();
    const idx = list.findIndex((s) => s.id === supplier.id);
    if (idx >= 0) {
      list[idx] = supplier;
      this.save(STORAGE_KEYS.SUPPLIERS, [...list]);
    } else {
      this.save(STORAGE_KEYS.SUPPLIERS, [supplier, ...list]);
    }
  }

  // --- PURCHASES ---
  getPurchases(): Purchase[] {
    return this.load(STORAGE_KEYS.PURCHASES, []);
  }

  createPurchase(purchase: Purchase, user: User): Purchase {
    const purchases = this.getPurchases();
    const products = this.getProducts();

    this.save(STORAGE_KEYS.PURCHASES, [purchase, ...purchases]);

    // Increase stock of items
    const updatedProducts = products.map((prod) => {
      const pItem = purchase.items.find((it) => it.productId === prod.id);
      if (!pItem) return prod;

      const prevStock = prod.stock;
      const newStock = prevStock + pItem.quantity;

      this.recordStockMovement({
        storeId: prod.storeId,
        productId: prod.id,
        productName: prod.name,
        type: 'PURCHASE',
        quantity: pItem.quantity,
        previousStock: prevStock,
        newStock,
        referenceDocId: purchase.purchaseInvoiceNumber,
        reason: `Purchase Invoice from ${purchase.supplierName}`,
        userId: user.id,
        userName: user.name,
      });

      return {
        ...prod,
        stock: newStock,
        costPrice: pItem.costPrice, // update latest cost
        updatedAt: new Date().toISOString(),
      };
    });

    this.save(STORAGE_KEYS.PRODUCTS, updatedProducts);

    // Update supplier ledger
    const suppliers = this.getSuppliers();
    const updatedSuppliers = suppliers.map((s) => {
      if (s.id !== purchase.supplierId) return s;
      return {
        ...s,
        totalPurchases: s.totalPurchases + purchase.total,
        outstandingBalance: s.outstandingBalance + purchase.outstandingBalance,
      };
    });
    this.save(STORAGE_KEYS.SUPPLIERS, updatedSuppliers);

    this.addAuditLog({
      action: 'Purchase Invoice Inwarded',
      category: 'STOCK',
      details: `Received purchase invoice ${purchase.purchaseInvoiceNumber} from ${purchase.supplierName} total ₹${purchase.total}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      storeId: purchase.storeId,
    });

    return purchase;
  }

  // --- EXPENSES ---
  getExpenses(): Expense[] {
    return this.load(STORAGE_KEYS.EXPENSES, []);
  }

  createExpense(expense: Expense, user: User): Expense {
    const expenses = this.getExpenses();
    this.save(STORAGE_KEYS.EXPENSES, [expense, ...expenses]);

    this.addAuditLog({
      action: 'Expense Recorded',
      category: 'SETTINGS',
      details: `Recorded expense of ₹${expense.amount} under ${expense.category}: "${expense.description}"`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      storeId: expense.storeId,
    });

    return expense;
  }

  // --- AUDIT LOGS ---
  getAuditLogs(): AuditLog[] {
    return this.load(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  addAuditLog(entry: Omit<AuditLog, 'id' | 'createdAt'>): void {
    const current = this.getAuditLogs();
    const log: AuditLog = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
    };
    this.save(STORAGE_KEYS.AUDIT_LOGS, [log, ...current]);
  }

  // --- NEGOTIATION ANALYTICS ---
  getNegotiationRecords(): NegotiationAnalyticsRecord[] {
    return this.load(STORAGE_KEYS.NEGOTIATIONS, []);
  }

  // --- USER AUTH & PROFILES ---
  getUsers(): User[] {
    return this.load(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  saveUser(user: User): void {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
      this.save(STORAGE_KEYS.USERS, [...users]);
    } else {
      this.save(STORAGE_KEYS.USERS, [user, ...users]);
    }
  }

  // Reset database back to seed defaults
  resetToDefaults(): void {
    if (this.hasStorage()) {
      localStorage.clear();
    }
    this.memoryStore.clear();
    this.initializeIfEmpty();
    this.notifyListeners();
  }
}

export const db = new AppDatabase();
