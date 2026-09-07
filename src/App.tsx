import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { RealtimeProvider } from './context/RealtimeContext.js';
import { Navbar, type NavTabKey } from './components/Navbar.js';
import { LiveAlertToast } from './components/LiveAlertToast.js';
import { LoginView } from './components/LoginView.js';

// Views
import { FabricReceivedView } from './views/FabricReceivedView.js';
import { ReceiveHistoryView } from './views/ReceiveHistoryView.js';
import { DeliveryView } from './views/DeliveryView.js';
import { OrderTransferView } from './views/OrderTransferView.js';
import { StockLedgerView } from './views/StockLedgerView.js';
import { BookingReportView } from './views/BookingReportView.js';
import { RackQrView } from './views/RackQrView.js';
import { BarcodeSystemView } from './views/BarcodeSystemView.js';
import { TasksAndProjectsView } from './views/TasksAndProjectsView.js';
import { SettingsView } from './views/SettingsView.js';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTabKey>('home');
  const [initialRackParam, setInitialRackParam] = useState<string | null>(null);

  // Check URL parameters on mount (for mobile camera QR scanning)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const rackParam = urlParams.get('rack') || urlParams.get('location');
      const tabParam = urlParams.get('tab') as NavTabKey;

      if (rackParam) {
        setInitialRackParam(rackParam);
        setCurrentTab('rack-qr');
      } else if (tabParam) {
        setCurrentTab(tabParam);
      }
    } catch (e) {
      console.warn('URL param parse warning:', e);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-bold text-lg animate-pulse">
            MCD
          </div>
          <span className="text-xs font-semibold text-gray-500">Loading GMS Fabric MCD System...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleNavigateWithContext = (tab: NavTabKey, context?: { rack?: string; storeRef?: string }) => {
    if (context?.rack) {
      setInitialRackParam(context.rack);
    }
    setCurrentTab(tab);
  };

  const renderCurrentView = () => {
    switch (currentTab) {
      case 'home':
        return <FabricReceivedView />;
      case 'transaction-history':
        return <ReceiveHistoryView />;
      case 'delivery':
        return <DeliveryView />;
      case 'order-transfer':
        return <OrderTransferView />;
      case 'stock-ledger':
        return <StockLedgerView />;
      case 'booking-closing-report':
        return <BookingReportView />;
      case 'barcode-system':
        return <BarcodeSystemView onNavigateTab={handleNavigateWithContext} />;
      case 'rack-qr':
        return (
          <RackQrView
            initialRack={initialRackParam}
            onNavigateTab={handleNavigateWithContext}
          />
        );
      case 'tasks-updates':
        return <TasksAndProjectsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <FabricReceivedView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans text-gray-900">
      <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />
      <main className="flex-1 pb-12">{renderCurrentView()}</main>
      <LiveAlertToast />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-3 px-4 text-center text-xs text-gray-500">
        <div className="max-w-[1920px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>GMS Composite Knitting Ind. Ltd. • Finish Fabric MCD Warehouse System</span>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="text-amber-700 font-semibold flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
              Firebase: stock-finish-fabric-f8040
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-emerald-700 font-semibold">
              Connected: finishmcd@gmail.com
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <MainAppContent />
      </RealtimeProvider>
    </AuthProvider>
  );
}

export default App;
