import React, { useState } from 'react';
import { CrmProvider, useCrm } from './context/CrmContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { TopBar } from './components/TopBar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { LeadsView } from './components/LeadsView.tsx';
import { CustomersView } from './components/CustomersView.tsx';
import { ProductsView } from './components/ProductsView.tsx';
import { QuotationsView } from './components/QuotationsView.tsx';
import { OrdersView } from './components/OrdersView.tsx';
import { ProductionView } from './components/ProductionView.tsx';
import { InventoryView } from './components/InventoryView.tsx';
import { PaymentsView } from './components/PaymentsView.tsx';
import { InvoicesView } from './components/InvoicesView.tsx';
import { DispatchView } from './components/DispatchView.tsx';
import { FollowUpsView } from './components/FollowUpsView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { AiAssistantView } from './components/AiAssistantView.tsx';
import { DocumentsView } from './components/DocumentsView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { QuickActionModal } from './components/QuickActionModal.tsx';

const MainAppContent: React.FC = () => {
  const { activeTab } = useCrm();
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'leads':
        return <LeadsView />;
      case 'customers':
        return <CustomersView />;
      case 'products':
        return <ProductsView />;
      case 'quotations':
        return <QuotationsView />;
      case 'orders':
        return <OrdersView />;
      case 'invoices':
        return <InvoicesView />;
      case 'production':
        return <ProductionView />;
      case 'inventory':
        return <InventoryView />;
      case 'payments':
        return <PaymentsView />;
      case 'dispatch':
        return <DispatchView />;
      case 'followups':
        return <FollowUpsView />;
      case 'reports':
        return <ReportsView />;
      case 'ai-assistant':
        return <AiAssistantView />;
      case 'documents':
        return <DocumentsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col antialiased selection:bg-amber-100 selection:text-amber-900">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <TopBar onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Quick Action Modal */}
      <QuickActionModal />
    </div>
  );
};

export default function App() {
  return (
    <CrmProvider>
      <MainAppContent />
    </CrmProvider>
  );
}
