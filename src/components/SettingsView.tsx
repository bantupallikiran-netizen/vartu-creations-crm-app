import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext.tsx';
import { UserRole } from '../types.ts';
import { Settings, Shield, Check, Save, Database, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, currentRole, setCurrentRole, dbConnected, dbInfo, dbSource, syncWithSqlServer, isSyncing } = useCrm();

  const [form, setForm] = useState(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [dbStatusMsg, setDbStatusMsg] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setDbStatusMsg(null);
    try {
      const res = await fetch('/api/db/health');
      const data = await res.json();
      if (data.success) {
        setDbStatusMsg(`Connected to SQL Server (${data.server}/${data.database}). Status: ONLINE.`);
        await syncWithSqlServer();
      } else {
        setDbStatusMsg(`Connection result: ${data.message || 'Offline'}. Local preview active.`);
      }
    } catch (err: any) {
      setDbStatusMsg(`Connection error: ${err.message}.`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleInitSeed = async () => {
    setIsTesting(true);
    setDbStatusMsg(null);
    try {
      const res = await fetch('/api/db/seed', { method: 'POST' });
      const data = await res.json();
      setDbStatusMsg(data.message || 'Database tables initialized and synchronized.');
      await syncWithSqlServer();
    } catch (err: any) {
      setDbStatusMsg(`Seed error: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
        <h2 className="text-base font-bold text-stone-900">Vartu Creations Studio & Business Settings</h2>
        <p className="text-xs text-stone-500">
          Configure artisan brand identity, GST taxation rates, bank payment coordinates, and RBAC user permissions.
        </p>
      </div>

      {/* SQL Server Integration Panel */}
      <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-700" />
            <span className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
              SQL Server Persistent Database Layer (VartuCRM)
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
              dbConnected
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dbConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {dbConnected ? 'Connected (SQL Server)' : 'Local Synchronized (mssql Ready)'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200 font-mono text-[11px]">
          <div>
            <span className="block text-stone-500 font-sans text-[10px] uppercase font-semibold">SQL Server Instance</span>
            <span className="text-stone-900 font-bold">{dbInfo.server}</span>
          </div>
          <div>
            <span className="block text-stone-500 font-sans text-[10px] uppercase font-semibold">Target Database</span>
            <span className="text-stone-900 font-bold">{dbInfo.database}</span>
          </div>
          <div>
            <span className="block text-stone-500 font-sans text-[10px] uppercase font-semibold">Driver & Architecture</span>
            <span className="text-stone-700">mssql (Node.js API)</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="text-[11px] text-stone-500">
            Persistent storage: <strong>React Frontend &rarr; Node.js Backend API &rarr; SQL Server ({dbInfo.database})</strong>.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || isSyncing}
              className="flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-medium transition-colors text-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting || isSyncing ? 'animate-spin' : ''}`} />
              <span>Test Connection & Sync</span>
            </button>
            <button
              type="button"
              onClick={handleInitSeed}
              disabled={isTesting || isSyncing}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-medium transition-colors text-xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
              <span>Verify / Seed Tables</span>
            </button>
          </div>
        </div>

        {dbStatusMsg && (
          <div className="p-2.5 rounded-lg bg-stone-100 border border-stone-200 text-stone-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{dbStatusMsg}</span>
          </div>
        )}
      </div>

      {/* Role Permission Preview */}
      <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-800" />
            <span className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
              Active Role Simulation (RBAC)
            </span>
          </div>
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as UserRole)}
            className="p-1.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-stone-900 cursor-pointer"
          >
            <option value="Owner/Admin">Owner/Admin (Full Unrestricted Access)</option>
            <option value="Sales/Order Manager">Sales/Order Manager (Leads, Quotes, Orders)</option>
            <option value="Production">Production Artisan (Work in Progress & QC)</option>
            <option value="Accounts">Accounts (Payments, Ledger & Invoices)</option>
            <option value="Viewer">Viewer (Read-Only Consultation)</option>
          </select>
        </div>

        <p className="text-stone-600">
          Current active session role: <strong>{currentRole}</strong>. The application enforces permissions dynamically.
        </p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Brand Information */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-sm text-stone-900">Studio & Brand Profile</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 mb-1 font-medium">Business Name</label>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-600 mb-1 font-medium">Tagline / Brand Subtitle</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-stone-600 mb-1 font-medium">WhatsApp Number</label>
              <input
                type="text"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-stone-600 mb-1 font-medium">Instagram Handle</label>
              <input
                type="text"
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-medium"
              />
            </div>
            <div>
              <label className="block text-stone-600 mb-1 font-medium">Website URL</label>
              <input
                type="text"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="block text-stone-600 mb-1 font-medium">Studio Physical Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-600 mb-1 font-medium">City & State</label>
              <input
                type="text"
                value={`${form.city}, ${form.state}`}
                onChange={(e) => {
                  const parts = e.target.value.split(',');
                  setForm({ ...form, city: parts[0]?.trim() || '', state: parts[1]?.trim() || '' });
                }}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-600 mb-1 font-medium">GSTIN</label>
              <input
                type="text"
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
              />
            </div>
          </div>
        </div>

        {/* Bank & Tax Rates */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-sm text-stone-900">Banking & Taxation Coordinates</h3>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-stone-600 mb-1 font-medium">Bank Name</label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-stone-600 mb-1 font-medium">Account Number</label>
              <input
                type="text"
                value={form.bankAccount}
                onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-stone-600 mb-1 font-medium">IFSC Code</label>
              <input
                type="text"
                value={form.bankIfsc}
                onChange={(e) => setForm({ ...form, bankIfsc: e.target.value })}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-stone-600 mb-1 font-medium">UPI ID</label>
              <input
                type="text"
                value={form.bankUpi}
                onChange={(e) => setForm({ ...form, bankUpi: e.target.value })}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono text-amber-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-stone-600 mb-1 font-medium">Default GST Rate (%)</label>
              <input
                type="number"
                value={form.defaultGstRate}
                onChange={(e) => setForm({ ...form, defaultGstRate: Number(e.target.value) })}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-stone-600 mb-1 font-medium">Default Advance Required (%)</label>
              <input
                type="number"
                value={form.defaultAdvancePercent}
                onChange={(e) => setForm({ ...form, defaultAdvancePercent: Number(e.target.value) })}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-stone-600 mb-1 font-medium">Order Prefix</label>
              <input
                type="text"
                value={form.orderPrefix}
                onChange={(e) => setForm({ ...form, orderPrefix: e.target.value })}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {savedSuccess ? (
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Settings updated successfully!
            </span>
          ) : (
            <div />
          )}

          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Company Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
