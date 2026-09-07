import React, { useState } from 'react';
import {
  ArrowDownToLine,
  FileText,
  Truck,
  ArrowRightLeft,
  BookOpen,
  ClipboardCheck,
  QrCode,
  CheckSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Radio,
  Sparkles,
  Barcode as BarcodeIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useRealtime } from '../context/RealtimeContext.js';

export type NavTabKey =
  | 'home'
  | 'transaction-history'
  | 'delivery'
  | 'order-transfer'
  | 'stock-ledger'
  | 'booking-closing-report'
  | 'barcode-system'
  | 'rack-qr'
  | 'tasks-updates'
  | 'settings';

interface NavbarProps {
  currentTab: NavTabKey;
  onSelectTab: (tab: NavTabKey) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout } = useAuth();
  const { isConnected, simulateWarehouseActivity } = useRealtime();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { key: 'home' as NavTabKey, label: 'Fabric Received', icon: ArrowDownToLine },
    { key: 'transaction-history' as NavTabKey, label: 'Receive History', icon: FileText },
    { key: 'delivery' as NavTabKey, label: 'Delivery', icon: Truck },
    { key: 'order-transfer' as NavTabKey, label: 'Order Transfer', icon: ArrowRightLeft },
    { key: 'stock-ledger' as NavTabKey, label: 'Stock Ledger', icon: BookOpen },
    { key: 'booking-closing-report' as NavTabKey, label: 'Booking Report', icon: ClipboardCheck },
    { key: 'barcode-system' as NavTabKey, label: 'Barcode System', icon: BarcodeIcon, highlight: true },
    { key: 'rack-qr' as NavTabKey, label: 'Rack QR', icon: QrCode },
    { key: 'tasks-updates' as NavTabKey, label: 'Tasks & Projects', icon: CheckSquare },
    { key: 'settings' as NavTabKey, label: 'Settings', icon: Settings }
  ];

  return (
    <>
      <nav id="main-navigation" className="sticky top-0 z-50 bg-emerald-700 text-white shadow-lg backdrop-blur-sm border-b border-emerald-600/60">
        <div className="max-w-[1920px] mx-auto px-3 py-2 flex items-center justify-between gap-2">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 border border-emerald-500/50 flex items-center justify-center font-bold text-white shadow-sm text-sm">
              MCD
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wide text-white leading-tight">
                GMS FINISH FABRIC MCD
              </span>
              <span className="text-[10px] text-emerald-200/80 font-medium leading-none hidden sm:inline">
                Warehouse Fabric Management System
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden xl:flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            {navItems.map((item) => {
              const active = item.key === currentTab;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  id={`nav-tab-${item.key}`}
                  onClick={() => onSelectTab(item.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150 whitespace-nowrap ${
                    active
                      ? 'bg-white/25 border border-white/40 text-white font-semibold shadow-xs'
                      : 'text-emerald-100 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <Icon className={`size-3.5 ${item.highlight && !active ? 'text-amber-300' : ''}`} />
                  <span>{item.label}</span>
                  {item.highlight && (
                    <span className="flex h-1.5 w-1.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Real-time sync badge */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                isConnected
                  ? 'bg-emerald-800/80 border-emerald-500/50 text-emerald-200'
                  : 'bg-amber-900/60 border-amber-600/50 text-amber-200'
              }`}
              title={isConnected ? 'Connected to live real-time stream' : 'Reconnecting...'}
            >
              <span className="relative flex h-2 w-2">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                ></span>
              </span>
              <span className="font-semibold">{isConnected ? 'LIVE SYNC' : 'OFFLINE'}</span>
            </div>

            {/* Live broadcast simulator button */}
            <button
              id="simulate-activity-btn"
              onClick={simulateWarehouseActivity}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-600/70 hover:bg-emerald-600 text-emerald-100 hover:text-white border border-emerald-400/40 transition-colors"
              title="Simulate a real-time warehouse project event"
            >
              <Radio className="size-3 text-amber-300 animate-pulse" />
              <span>Simulate Update</span>
            </button>

            {/* Current user email tag */}
            {user && (
              <div className="hidden lg:flex flex-col text-right pr-1">
                <span className="text-[11px] font-medium text-emerald-100 truncate max-w-[140px]">
                  {user.email}
                </span>
                <span className="text-[9px] text-emerald-300/70 uppercase tracking-wider">
                  {user.role || 'Warehouse Manager'}
                </span>
              </div>
            )}

            {/* Mobile hamburger toggle */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="xl:hidden p-1.5 rounded-md hover:bg-white/20 transition-colors text-white"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>

            {/* Logout button styled exactly matching the original web app */}
            <button
              id="logout-btn"
              onClick={logout}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium bg-red-500/20 border border-red-300/40 text-red-100 hover:bg-red-500/40 hover:text-white transition-all h-8"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-72 bg-emerald-800 shadow-2xl p-5 flex flex-col justify-between overflow-y-auto border-l border-emerald-700">
            <div>
              <div className="flex items-center justify-between pb-4 mb-3 border-b border-emerald-700">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-emerald-900 border border-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                    MCD
                  </div>
                  <span className="text-sm font-bold text-white">GMS Navigation</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded hover:bg-white/20 text-white"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* User info banner */}
              {user && (
                <div className="p-3 mb-3 bg-emerald-900/60 rounded-lg border border-emerald-700/60 text-xs">
                  <div className="font-semibold text-white">{user.name}</div>
                  <div className="text-emerald-200 text-[11px] truncate">{user.email}</div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>{isConnected ? 'Real-Time Sync Live' : 'Offline'}</span>
                  </div>
                </div>
              )}

              {/* Navigation Items */}
              <div className="flex flex-col gap-1.5">
                {navItems.map((item) => {
                  const active = item.key === currentTab;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        onSelectTab(item.key);
                        setMobileOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        active
                          ? 'bg-white/25 border border-white/40 text-white font-semibold'
                          : 'text-emerald-100 hover:bg-white/15 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.highlight && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-emerald-950">
                          NEW
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-emerald-700">
              <button
                onClick={simulateWarehouseActivity}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold mb-2"
              >
                <Sparkles className="size-3.5 text-amber-300" />
                <span>Trigger Live Simulation</span>
              </button>
              <p className="text-center text-[11px] text-emerald-300/60">
                GMS Finish Fabric MCD © {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
