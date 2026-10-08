import React from 'react';
import { useCrm } from '../context/CrmContext.tsx';
import {
  LayoutDashboard,
  Users2,
  Contact,
  Package,
  FileText,
  ShoppingBag,
  CreditCard,
  Hammer,
  Boxes,
  Truck,
  CalendarClock,
  BarChart3,
  Sparkles,
  Settings,
  FolderOpen,
  Plus,
  FileCheck,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { activeTab, setActiveTab, leads, followUps, orders, invoices, documents, setQuickAction } = useCrm();

  // Badges count
  const newLeadsCount = leads.filter((l) => l.status === 'New').length;
  const overdueFollowUps = followUps.filter((f) => f.status === 'Pending' && new Date(f.scheduledDate) <= new Date()).length;
  const activeOrdersCount = orders.filter((o) => !['Completed', 'Delivered', 'Cancelled'].includes(o.orderStatus)).length;
  const pendingInvoicesCount = invoices.filter((i) => i.balanceDue > 0).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Contact, badge: newLeadsCount > 0 ? newLeadsCount : undefined },
    { id: 'customers', label: 'Customers', icon: Users2 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'quotations', label: 'Quotations', icon: FileText },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: activeOrdersCount > 0 ? activeOrdersCount : undefined },
    { id: 'invoices', label: 'Invoices', icon: FileCheck, badge: pendingInvoicesCount > 0 ? pendingInvoicesCount : undefined, badgeColor: 'bg-amber-600' },
    { id: 'production', label: 'Production', icon: Hammer },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'dispatch', label: 'Dispatch', icon: Truck },
    { id: 'followups', label: 'Follow-ups', icon: CalendarClock, badge: overdueFollowUps > 0 ? overdueFollowUps : undefined, badgeColor: 'bg-rose-500' },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles, highlight: true },
    { id: 'documents', label: 'Documents', icon: FolderOpen, badge: documents.length > 0 ? documents.length : undefined },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-stone-200 bg-white transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-stone-200 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-900 text-stone-100 font-serif font-semibold text-lg shadow-xs">
              V
            </div>
            <div>
              <div className="font-serif text-lg font-bold tracking-tight text-stone-900 leading-none">
                Vartu Creations
              </div>
              <div className="text-[11px] font-medium text-stone-700 tracking-wide mt-1">
                CRM & Order Suite
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="p-3 border-b border-stone-100 grid grid-cols-2 gap-2">
          <button
            onClick={() => setQuickAction('newOrder')}
            className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors"
            title="Create Quick Order"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Order</span>
          </button>
          <button
            onClick={() => setQuickAction('newLead')}
            className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            title="Capture Inbound Lead"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Lead</span>
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-xs'
                    : item.highlight
                    ? 'text-amber-700 hover:bg-amber-50/70 font-semibold'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : item.highlight ? 'text-amber-700' : 'text-stone-700'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded-full text-white tabular-nums ${
                      item.badgeColor ? item.badgeColor : isActive ? 'bg-stone-700' : 'bg-amber-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Studio Info Footer */}
        <div className="border-t border-stone-200 p-3 bg-stone-50/60">
          <div className="text-[11px] text-stone-700 flex flex-col gap-0.5">
            <span className="font-semibold text-stone-700">Artisan Craft Studio</span>
            <span>Hyderabad, Telangana</span>
            <span className="text-[10px] text-stone-700 mt-1 font-mono">v1.0 Production Ready</span>
          </div>
        </div>
      </aside>
    </>
  );
};
