import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  ShieldCheck,
  KeyRound,
  Edit2,
  Lock,
  Unlock,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Store,
} from 'lucide-react';
import { User } from '@/types/models';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';

export const CashierManagementScreen: React.FC = () => {
  const { currentUser, cashiers, createCashier, updateCashier, toggleCashierStatus, deleteCashier } = useAuth();
  const { addToast } = useStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCashier, setEditingCashier] = useState<User | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('Cashier@123');
  const [pin, setPin] = useState('');
  const [station, setStation] = useState('Counter 1 (Main POS)');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingCashier(null);
    setName('');
    setEmail('');
    const nextCode = `CSH-${100 + cashiers.length + 1}`;
    setEmployeeCode(nextCode);
    setPhone('');
    setPassword('Cashier@123');
    setPin(String(Math.floor(1000 + Math.random() * 9000)));
    setStation(`Counter ${cashiers.length + 1}`);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (csh: User) => {
    setEditingCashier(csh);
    setName(csh.name);
    setEmail(csh.email);
    setEmployeeCode(csh.employeeCode || '');
    setPhone(csh.phone || '');
    setPassword(csh.password || 'Cashier@123');
    setPin(csh.pin || '');
    setStation(csh.station || 'Counter 1');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !email.trim() || !employeeCode.trim() || !pin.trim()) {
      setErrorMsg('All security fields (Name, Email, Employee Code, and PIN) are required.');
      return;
    }

    if (pin.trim().length < 4) {
      setErrorMsg('Cashier PIN must be at least 4 digits.');
      return;
    }

    if (editingCashier) {
      const res = updateCashier(editingCashier.id, {
        name: name.trim(),
        email: email.trim(),
        employeeCode: employeeCode.trim().toUpperCase(),
        phone: phone.trim() || undefined,
        password: password.trim(),
        pin: pin.trim(),
        station: station.trim(),
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to update cashier');
        return;
      }

      addToast('success', 'Cashier Updated', `Updated credentials for ${name}`);
    } else {
      const res = createCashier({
        name: name.trim(),
        email: email.trim(),
        employeeCode: employeeCode.trim().toUpperCase(),
        phone: phone.trim() || undefined,
        password: password.trim(),
        pin: pin.trim(),
        station: station.trim(),
        storeId: currentUser?.storeId || 'store_main_01',
        active: true,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create cashier');
        return;
      }

      addToast('success', 'Cashier Assigned', `Assigned ${name} (${employeeCode}) to ${station}`);
    }

    setModalOpen(false);
  };

  const handleToggle = (csh: User) => {
    const nextStatus = !csh.active;
    toggleCashierStatus(csh.id, nextStatus);
    addToast(
      nextStatus ? 'success' : 'warning',
      nextStatus ? 'Access Enabled' : 'Access Suspended',
      `${csh.name} POS access ${nextStatus ? 'enabled' : 'suspended'}.`
    );
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white">
            Cashier Management &amp; Access Control
          </h1>
          <p className="text-xs text-slate-500">
            Assigned by Shop Owner: <span className="font-bold text-slate-800 dark:text-slate-200">{currentUser?.name}</span> &bull; Strict unique credentials enforcement
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Assign New Cashier</span>
        </button>
      </div>

      {/* Security Rule Card */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-slate-700 dark:text-slate-300">
          <p className="font-bold text-slate-900 dark:text-white">
            Strict Multi-Terminal Security Policy Active
          </p>
          <p>
            Cashiers are strictly forbidden from modifying purchase costs, permanent selling prices, or accessing sensitive profit statements. Each cashier requires a unique Employee ID, login email, and station PIN.
          </p>
        </div>
      </div>

      {/* Cashier List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cashiers.map((csh) => (
          <div
            key={csh.id}
            className={`p-5 rounded-3xl border transition shadow-sm space-y-4 ${
              csh.active
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-850 opacity-60'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                  {csh.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{csh.name}</h3>
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold block">
                    ID: {csh.employeeCode || 'CSH-NA'}
                  </span>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  csh.active
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                }`}
              >
                {csh.active ? 'Active' : 'Suspended'}
              </span>
            </div>

            {/* Credential Details */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Login Email:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate ml-2">
                  {csh.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Station:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {csh.station || 'General Counter'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Terminal PIN:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                  {csh.pin || '****'}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-400">
                <span>Assigned By:</span>
                <span>{csh.assignedByName || currentUser?.name || 'Shop Owner'}</span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => handleToggle(csh)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  csh.active
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                }`}
              >
                {csh.active ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>{csh.active ? 'Suspend POS' : 'Activate POS'}</span>
              </button>

              <button
                type="button"
                onClick={() => openEditModal(csh)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1 text-slate-700 dark:text-slate-300 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {editingCashier ? 'Edit Cashier Credentials' : 'Assign New Cashier'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Owner Authorization: {currentUser?.name || 'Shop Owner'}
                  </p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-3.5 text-xs flex-1">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">Cashier Full Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Suresh Verma"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold mb-1">
                    Employee Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CSH-103"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold uppercase outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Station / Counter <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={station}
                    onChange={(e) => setStation(e.target.value)}
                    placeholder="e.g. Counter 3"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Login Email Address <span className="text-rose-500">*</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="suresh.cashier@a2zmart.in"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold mb-1">Password</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Terminal PIN (4-6 digits) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="e.g. 5566"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-emerald-500 font-mono font-bold text-center tracking-widest text-sm outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Contact Phone (Optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                >
                  {editingCashier ? 'Update Credentials' : 'Assign Cashier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
