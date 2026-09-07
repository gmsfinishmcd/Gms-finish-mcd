import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, CheckCircle2, ShieldCheck, Database, Radio } from 'lucide-react';
import type { DropdownMasterData } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { useRealtime } from '../context/RealtimeContext.js';

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const { isConnected } = useRealtime();

  const [dropdowns, setDropdowns] = useState<DropdownMasterData | null>(null);
  const [activeCategory, setActiveCategory] = useState<keyof DropdownMasterData>('buyerName');
  const [newItemValue, setNewItemValue] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchDropdowns = async () => {
    try {
      const res = await fetch('/api/settings/dropdown-data');
      const data = await res.json();
      setDropdowns(data);
    } catch (err) {
      console.error('Failed to load dropdowns:', err);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemValue.trim() || !dropdowns) return;

    const currentList = dropdowns[activeCategory] || [];
    if (currentList.includes(newItemValue.trim())) {
      alert('This item already exists.');
      return;
    }

    try {
      const res = await fetch('/api/settings/dropdown-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: activeCategory,
          value: newItemValue.trim()
        })
      });
      if (res.ok) {
        setSuccessMsg(`Added "${newItemValue.trim()}" to ${String(activeCategory)}!`);
        setTimeout(() => setSuccessMsg(null), 3000);
        setNewItemValue('');
        fetchDropdowns();
      }
    } catch (err) {
      console.error('Failed to add item:', err);
    }
  };

  const handleDeleteItem = async (val: string) => {
    if (!dropdowns) return;
    const currentList = dropdowns[activeCategory] || [];
    if (currentList.length <= 1) {
      alert('You cannot delete the last item in a dropdown.');
      return;
    }

    try {
      const res = await fetch('/api/settings/dropdown-data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: activeCategory,
          value: val
        })
      });
      if (res.ok) {
        fetchDropdowns();
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const categories: { key: keyof DropdownMasterData; label: string }[] = [
    { key: 'buyerName', label: 'Buyers' },
    { key: 'styleName', label: 'Styles' },
    { key: 'fabricsType', label: 'Fabric Types' },
    { key: 'colour', label: 'Colours' },
    { key: 'location', label: 'Rack Locations' },
    { key: 'personOfCutting', label: 'Cutting Supervisors' },
    { key: 'composition', label: 'Compositions' },
    { key: 'certificateName', label: 'Certificates' },
    { key: 'warehouseName', label: 'Warehouses' }
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1920px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="size-5 text-emerald-700" />
            <span>Warehouse Master Data & System Settings</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure dropdown lists, buyer master files, warehouse rack zones, and system accounts
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Account & Real-time Diagnostic Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>Active Operator Profile</span>
          </div>
          <div className="text-sm font-bold text-gray-900">{user?.name}</div>
          <div className="text-xs text-gray-500 font-mono">{user?.email}</div>
          <div className="text-[11px] text-emerald-700 font-semibold">{user?.role}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
            <Radio className="size-4 text-emerald-600" />
            <span>Real-time SSE Connectivity</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-xs font-bold text-gray-900">
              {isConnected ? 'Connected to /api/realtime/stream' : 'Disconnected'}
            </span>
          </div>
          <div className="text-[11px] text-gray-400">Low-latency project events streaming</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
            <Database className="size-4 text-emerald-600" />
            <span>Data Engine State</span>
          </div>
          <div className="text-xs font-bold text-gray-900">In-Memory Store & REST APIs Active</div>
          <div className="text-[11px] text-gray-400">Vite + Express Full-Stack Architecture</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
            <span>Firebase Cloud Storage</span>
          </div>
          <div className="text-xs font-bold text-gray-900 truncate">stock-finish-fabric-f8040</div>
          <div className="text-[11px] text-emerald-700 font-semibold">Region: asia-southeast1</div>
          <div className="text-[10px] text-gray-400 font-mono truncate">ID: ai-studio-gmsfinishfabricm</div>
        </div>
      </div>

      {/* Master Data Dropdown Editor */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5">
        <h2 className="text-sm font-bold text-gray-900 pb-3 border-b border-gray-100 mb-4">
          Master Dropdown Lists Editor
        </h2>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 pb-4 border-b border-gray-100 mb-4">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === c.key
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {c.label} ({dropdowns?.[c.key]?.length || 0})
            </button>
          ))}
        </div>

        {/* Add item form */}
        <form onSubmit={handleAddItem} className="flex gap-2 max-w-md mb-5">
          <input
            type="text"
            placeholder={`Add new ${String(activeCategory)} item...`}
            value={newItemValue}
            onChange={(e) => setNewItemValue(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Add</span>
          </button>
        </form>

        {/* Item List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {dropdowns?.[activeCategory]?.map((item) => (
            <div
              key={item}
              className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs hover:border-gray-300 transition-colors"
            >
              <span className="font-medium text-gray-800 truncate pr-2">{item}</span>
              <button
                onClick={() => handleDeleteItem(item)}
                className="text-gray-400 hover:text-red-600 p-0.5 rounded transition-colors"
                title="Remove item"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
