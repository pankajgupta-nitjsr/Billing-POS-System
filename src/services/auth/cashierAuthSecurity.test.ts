import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../storage/database';

describe('Shop Owner & Cashier Security Suite', () => {
  beforeEach(() => {
    db.resetToDefaults();
  });

  it('identifies Chandan Kumar Gupta as the Shop Owner with Google Auth', () => {
    const users = db.getUsers();
    const owner = users.find((u) => u.role === 'OWNER');
    expect(owner).toBeDefined();
    expect(owner?.name).toBe('Chandan Kumar Gupta');
    expect(owner?.email).toBe('chandankumargupta@a2zmart.in');
    expect(owner?.role).toBe('OWNER');
    expect(owner?.authProvider).toBe('GOOGLE');
  });

  it('lists existing pre-seeded cashiers assigned by Chandan Kumar Gupta', () => {
    const cashiers = db.getUsers().filter((u) => u.role === 'CASHIER');
    expect(cashiers.length).toBeGreaterThanOrEqual(2);

    const amit = cashiers.find((c) => c.employeeCode === 'CSH-101');
    expect(amit).toBeDefined();
    expect(amit?.name).toBe('Amit Kumar');
    expect(amit?.assignedByName).toBe('Chandan Kumar Gupta');
    expect(amit?.pin).toBe('5678');
  });

  it('allows Owner Chandan Kumar Gupta to assign a new cashier with unique credentials', () => {
    const owner = db.getUsers().find((u) => u.role === 'OWNER')!;
    const res = db.createCashierByOwner(
      {
        name: 'Rohan Verma',
        email: 'rohan.verma@a2zmart.in',
        employeeCode: 'CSH-103',
        phone: '9876543210',
        password: 'SecurePassword123!',
        pin: '9012',
        station: 'Counter 2 (Fashion)',
        active: true,
        storeId: owner.storeId,
      },
      owner
    );

    expect(res.success).toBe(true);
    expect(res.cashier).toBeDefined();
    expect(res.cashier?.employeeCode).toBe('CSH-103');
    expect(res.cashier?.pin).toBe('9012');
    expect(res.cashier?.assignedBy).toBe(owner.id);
    expect(res.cashier?.assignedByName).toBe('Chandan Kumar Gupta');
    expect(res.cashier?.active).toBe(true);

    // Verify it appears in cashiers list
    const updatedList = db.getUsers().filter((u) => u.role === 'CASHIER');
    expect(updatedList.some((c) => c.employeeCode === 'CSH-103')).toBe(true);
  });

  it('strictly rejects duplicate employee code with clear validation error', () => {
    const owner = db.getUsers().find((u) => u.role === 'OWNER')!;
    const res = db.createCashierByOwner(
      {
        name: 'Duplicate Code Cashier',
        email: 'unique.email@a2zmart.in',
        employeeCode: 'CSH-101', // already used by Amit Kumar
        pin: '7777',
        active: true,
        storeId: owner.storeId,
      },
      owner
    );

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Employee Code "CSH-101" is already assigned/);
  });

  it('strictly rejects duplicate email with clear validation error', () => {
    const owner = db.getUsers().find((u) => u.role === 'OWNER')!;
    const res = db.createCashierByOwner(
      {
        name: 'Duplicate Email Cashier',
        email: 'amit.cashier@a2zmart.in', // already used by Amit Kumar
        employeeCode: 'CSH-999',
        pin: '7777',
        active: true,
        storeId: owner.storeId,
      },
      owner
    );

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Email "amit.cashier@a2zmart.in" is already assigned/);
  });

  it('strictly rejects duplicate PIN for terminal POS security', () => {
    const owner = db.getUsers().find((u) => u.role === 'OWNER')!;
    const res = db.createCashierByOwner(
      {
        name: 'Duplicate PIN Cashier',
        email: 'dup.pin@a2zmart.in',
        employeeCode: 'CSH-999',
        pin: '5678', // already used by Amit Kumar
        active: true,
        storeId: owner.storeId,
      },
      owner
    );

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/PIN "5678" is already used/);
  });

  it('allows owner to suspend a cashier and deactivates POS billing access', () => {
    const owner = db.getUsers().find((u) => u.role === 'OWNER')!;
    const cashiers = db.getUsers().filter((u) => u.role === 'CASHIER');
    const amit = cashiers.find((c) => c.employeeCode === 'CSH-101')!;

    // Toggle to suspended/inactive
    const success = db.toggleCashierStatus(amit.id, false, owner);
    expect(success).toBe(true);

    // Verify status persisted
    const refreshed = db.getUsers().find((u) => u.id === amit.id);
    expect(refreshed?.active).toBe(false);
  });

  it('dynamically establishes any authenticated Google user as global store owner', () => {
    const customGoogleUser = {
      id: 'user_owner_custom_01',
      name: 'Ramesh Chandra Verma',
      email: 'ramesh.verma@a2zmart.in',
      role: 'OWNER' as const,
      authProvider: 'GOOGLE' as const,
      storeId: 'store_main_01',
      active: true,
      createdAt: new Date().toISOString(),
    };

    db.saveUser(customGoogleUser);

    const refreshedOwner = db.getUsers().find((u) => u.email === 'ramesh.verma@a2zmart.in');
    expect(refreshedOwner).toBeDefined();
    expect(refreshedOwner?.name).toBe('Ramesh Chandra Verma');
    expect(refreshedOwner?.role).toBe('OWNER');
    expect(refreshedOwner?.authProvider).toBe('GOOGLE');

    // Cashiers assigned by this dynamic owner reflect their identity
    const newCashier = db.createCashierByOwner(
      {
        name: 'Vikas Shah',
        email: 'vikas.shah@a2zmart.in',
        employeeCode: 'CSH-104',
        pin: '2345',
        active: true,
        storeId: 'store_main_01',
      },
      refreshedOwner!
    );

    expect(newCashier.success).toBe(true);
    expect(newCashier.cashier?.assignedByName).toBe('Ramesh Chandra Verma');
  });
});
