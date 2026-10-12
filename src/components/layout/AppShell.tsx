import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Truck,
  Receipt,
  Users,
  Wallet,
  BarChart3,
  QrCode,
  ShieldAlert,
  Settings,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  UserCheck,
  Plus,
  Clock,
  Menu,
  X,
  Store,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { PricingEngine } from '@/services/pricing/pricingEngine';
import { ShiftModal } from '@/components/shift/ShiftModal';

export const AppShell: React.FC = () => {
  const { currentUser, switchUser, isOwner, activeShift } = useAuth();
  const {
    settings,
    isOnline,
    toggleOnline,
    pendingSyncCount,
    darkMode,
    toggleDarkMode,
    toasts,
    removeToast,
  } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    ...(isOwner
      ? [
          {
            to: '/',
            label: 'Dashboard',
            icon: LayoutDashboard,
            badge: null,
          },
        ]
      : []),
    {
      to: '/pos',
      label: 'POS Billing',
      icon: ShoppingCart,
      badge: 'F2',
      primary: true,
    },
    {
      to: '/products',
      label: 'Products & Catalog',
      icon: Package,
      badge: null,
    },
    {
      to: '/inventory',
      label: 'Inventory & Stock',
      icon: Layers,
      badge: null,
    },
    ...(isOwner
      ? [
          {
            to: '/purchases',
            label: 'Purchases & Inward',
            icon: Truck,
            badge: null,
          },
        ]
      : []),
    {
      to: '/sales',
      label: 'Sales & Returns',
      icon: Receipt,
      badge: null,
    },
    {
      to: '/customers',
      label: 'Customers',
      icon: Users,
      badge: null,
    },
    ...(isOwner
      ? [
          {
            to: '/suppliers',
            label: 'Suppliers',
            icon: Truck,
            badge: null,
          },
          {
            to: '/expenses',
            label: 'Expenses',
            icon: Wallet,
            badge: null,
          },
          {
            to: '/reports',
            label: 'Reports & Analytics',
            icon: BarChart3,
            badge: null,
          },
          {
            to: '/labels',
            label: 'Barcode & QR Studio',
            icon: QrCode,
            badge: null,
          },
          {
            to: '/audit',
            label: 'Audit Logs',
            icon: ShieldAlert,
            badge: null,
          },
          {
            to: '/settings',
            label: 'Store Settings',
            icon: Settings,
            badge: null,
          },
        ]
      : []),
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100">
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-slide-in ${
              toast.type === 'success'
                ? 'bg-emerald-900/90 border-emerald-700 text-emerald-100'
                : toast.type === 'warning'
                ? 'bg-amber-900/90 border-amber-700 text-amber-100'
                : toast.type === 'error'
                ? 'bg-rose-900/90 border-rose-700 text-rose-100'
                : 'bg-slate-900/90 border-slate-700 text-slate-100'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />}
            <div className="flex-1 text-sm">
              <p className="font-semibold">{toast.title}</p>
              <p className="text-xs opacity-90 mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/60 hover:text-white p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 flex items-center justify-center text-white shadow-sm font-bold text-lg">
            A2Z
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {settings.name}
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              Retail POS SaaS
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  } ${item.primary ? 'font-semibold' : ''}`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Current Active Role / Switcher Card */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/50">
          <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 overflow-hidden">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                  isOwner ? 'bg-indigo-600' : 'bg-amber-600'
                }`}
              >
                {isOwner ? 'OW' : 'CS'}
              </div>
              <div className="truncate text-xs">
                <p className="font-semibold truncate text-slate-800 dark:text-slate-200">
                  {currentUser.name.split(' ')[0]}
                </p>
                <span className="text-[10px] text-slate-500 uppercase tracking-wide font-mono">
                  {currentUser.role}
                </span>
              </div>
            </div>
            <button
              onClick={() => switchUser(isOwner ? 'CASHIER' : 'OWNER')}
              title={`Switch to ${isOwner ? 'Cashier' : 'Owner'} Mode`}
              className="text-[11px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition"
            >
              Switch
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP APP HEADER */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 lg:px-6 z-20 shrink-0">
          {/* Mobile Menu & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base lg:text-lg text-slate-900 dark:text-white truncate">
                {settings.name}
              </span>
              <span className="hidden sm:inline-block text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                GSTIN: {settings.gstin}
              </span>
            </div>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Quick Online/Offline Status Indicator & Toggle */}
            <button
              onClick={toggleOnline}
              title={isOnline ? 'Online - Click to test Offline mode' : 'Offline - Click to reconnect'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 animate-pulse'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    Offline {pendingSyncCount > 0 && `(${pendingSyncCount})`}
                  </span>
                </>
              )}
            </button>

            {/* Cashier Shift Status Button */}
            <button
              onClick={() => setShiftModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                activeShift && activeShift.status === 'OPEN'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                  : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden md:inline">
                {activeShift ? 'Shift Active' : 'Open Shift'}
              </span>
            </button>

            {/* Quick Actions Dropdown (New Sale, Add Product, etc.) */}
            <div className="relative">
              <button
                onClick={() => setQuickActionOpen(!quickActionOpen)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Action</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {quickActionOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 text-xs"
                  onClick={() => setQuickActionOpen(false)}
                >
                  <button
                    onClick={() => navigate('/pos')}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <ShoppingCart className="w-4 h-4 text-emerald-600" />
                    New Sale (POS)
                  </button>
                  {isOwner && (
                    <>
                      <button
                        onClick={() => navigate('/products?new=1')}
                        className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                      >
                        <Package className="w-4 h-4 text-blue-600" />
                        Add Product
                      </button>
                      <button
                        onClick={() => navigate('/purchases?new=1')}
                        className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                      >
                        <Truck className="w-4 h-4 text-amber-600" />
                        Inward Purchase
                      </button>
                      <button
                        onClick={() => navigate('/expenses?new=1')}
                        className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                      >
                        <Wallet className="w-4 h-4 text-purple-600" />
                        Record Expense
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => navigate('/customers?new=1')}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <Users className="w-4 h-4 text-teal-600" />
                    New Customer
                  </button>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* ROUTED CONTENT VIEWPORT */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 pb-16 lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around z-30 px-2">
        {isOwner && (
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 py-1 text-[10px] font-medium ${
                isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Home</span>
          </NavLink>
        )}
        <NavLink
          to="/pos"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-14 py-1 text-[10px] font-medium ${
              isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
            }`
          }
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Billing</span>
        </NavLink>
        <NavLink
          to="/products"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-14 py-1 text-[10px] font-medium ${
              isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
            }`
          }
        >
          <Package className="w-5 h-5" />
          <span>Items</span>
        </NavLink>
        <NavLink
          to="/sales"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-14 py-1 text-[10px] font-medium ${
              isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
            }`
          }
        >
          <Receipt className="w-5 h-5" />
          <span>Sales</span>
        </NavLink>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center w-14 py-1 text-[10px] font-medium text-slate-500"
        >
          <Menu className="w-5 h-5" />
          <span>Menu</span>
        </button>
      </div>

      {/* MOBILE SLIDE-OUT DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80%] bg-white dark:bg-slate-900 h-full flex flex-col z-10 shadow-2xl">
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white">{settings.name}</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-md text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                        isActive
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <p className="text-xs text-slate-500 font-mono mb-2">Logged in as {currentUser.name}</p>
              <button
                onClick={() => {
                  switchUser(isOwner ? 'CASHIER' : 'OWNER');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                Switch Role ({isOwner ? 'Cashier' : 'Owner'})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cashier Shift Modal */}
      {shiftModalOpen && <ShiftModal onClose={() => setShiftModalOpen(false)} />}
    </div>
  );
};
