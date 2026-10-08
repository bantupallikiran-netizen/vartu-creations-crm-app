import React from 'react';
import { useCrm } from '../context/CrmContext.tsx';
import { UserRole } from '../types.ts';
import { Menu, Search, Sparkles, Plus, Shield, Database, RefreshCw } from 'lucide-react';

interface TopBarProps {
  onMenuClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const {
    activeTab,
    setActiveTab,
    currentRole,
    setCurrentRole,
    setQuickAction,
    dbConnected,
    dbInfo,
    syncWithSqlServer,
    isSyncing,
  } = useCrm();

  const getBreadcrumb = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Executive Overview';
      case 'leads':
        return 'Inbound Leads & Pipeline';
      case 'customers':
        return 'Customer 360° Directory';
      case 'products':
        return 'Product Catalogue & Costing';
      case 'quotations':
        return 'Quotations & Estimates';
      case 'orders':
        return 'Order Management & Customizations';
      case 'invoices':
        return 'Tax Invoices & Client Billing';
      case 'production':
        return 'Production Tracking & QC';
      case 'inventory':
        return 'Inventory & Raw Materials';
      case 'payments':
        return 'Payments & Ledger';
      case 'dispatch':
        return 'Dispatch & Couriers';
      case 'followups':
        return 'Follow-up Task Engine';
      case 'reports':
        return 'Analytics & Profitability';
      case 'ai-assistant':
        return 'Vartu AI Intelligence';
      case 'documents':
        return 'Document Management';
      case 'settings':
        return 'Business Configuration';
      default:
        return 'Vartu Creations';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-stone-200 bg-white/95 px-4 backdrop-blur-xs md:px-6">
      {/* Zone 1: Mobile Hamburger & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-1.5 text-stone-500 hover:text-stone-900 md:hidden rounded-lg hover:bg-stone-100"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-amber-800 hidden sm:inline uppercase tracking-wider">
            Vartu Creations
          </span>
          <span className="text-stone-300 hidden sm:inline">/</span>
          <h1 className="text-sm font-semibold text-stone-900 truncate">{getBreadcrumb()}</h1>
        </div>
      </div>

      {/* Zone 2: Global Search & AI Quick Ask */}
      <div className="hidden lg:flex items-center gap-2 max-w-sm w-full mx-4">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search leads, customers, orders..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700 focus:bg-white text-stone-800 placeholder-stone-400 transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setActiveTab('leads');
              }
            }}
          />
        </div>
      </div>

      {/* Zone 3: Role Switcher & Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* SQL Server Connection Indicator */}
        <button
          onClick={syncWithSqlServer}
          disabled={isSyncing}
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium rounded-lg border transition-all cursor-pointer bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
          title={`SQL Server: ${dbInfo.server} | Database: ${dbInfo.database}\nClick to synchronize live data`}
        >
          <Database className={`w-3 h-3 ${dbConnected ? 'text-emerald-600' : 'text-amber-600'}`} />
          <span className="font-semibold text-stone-800">
            {dbConnected ? 'SQL Server' : 'SQL Server'}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <RefreshCw className={`w-2.5 h-2.5 text-stone-400 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>

        {/* Role Switcher */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100/80 rounded-lg border border-stone-200/80">
          <Shield className="w-3.5 h-3.5 text-stone-500 shrink-0 hidden xs:inline" />
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as UserRole)}
            className="bg-transparent text-xs font-medium text-stone-700 focus:outline-none cursor-pointer"
          >
            <option value="Owner/Admin">Admin (Full)</option>
            <option value="Sales/Order Manager">Sales Mgr</option>
            <option value="Production">Production</option>
            <option value="Accounts">Accounts</option>
            <option value="Viewer">Viewer</option>
          </select>
        </div>

        {/* AI Assistant shortcut */}
        <button
          onClick={() => setActiveTab('ai-assistant')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100/80 rounded-lg border border-amber-200/80 transition-colors"
          title="Open AI Sales Assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden sm:inline">AI Co-pilot</span>
        </button>

        {/* New Order Action */}
        <button
          onClick={() => setQuickAction('newOrder')}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          title="Create New Order"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">New Order</span>
        </button>

        {/* New Lead Action */}
        <button
          onClick={() => setQuickAction('newLead')}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors whitespace-nowrap"
          title="Create New Lead"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">New Lead</span>
        </button>
      </div>
    </header>
  );
};
