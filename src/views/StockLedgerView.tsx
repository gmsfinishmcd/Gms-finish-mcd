import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Download,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  RotateCcw,
  Loader2
} from 'lucide-react';
import type { FabricRecord, DeliveryRecord } from '../types.js';

interface StockLedgerEntry {
  storeRef: string;
  buyerName: string;
  styleName: string;
  fabricsType: string;
  colour: string;
  gsm: string;
  totalBooking: number;
  totalReceived: number;
  totalDelivered: number;
  balanceInHand: number;
  rollsInHand: number;
  location: string;
  lastUpdated: string;
}

export const StockLedgerView: React.FC = () => {
  const [ledgerEntries, setLedgerEntries] = useState<StockLedgerEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selectedBuyer, setSelectedBuyer] = useState<string>('ALL');
  const [availableBuyers, setAvailableBuyers] = useState<string[]>([]);

  useEffect(() => {
    // Pre-populate available buyers for filter dropdown
    fetch('/api/fabric-received?limit=1000')
      .then((res) => res.json())
      .then((json) => {
        const fabrics: FabricRecord[] = json.data || [];
        const bList = Array.from(new Set(fabrics.map((f) => f.buyerName).filter(Boolean)));
        setAvailableBuyers(bList);
      })
      .catch((e) => console.error(e));
  }, []);

  const computeLedger = async () => {
    try {
      setLoading(true);
      const [fabRes, delRes] = await Promise.all([
        fetch('/api/fabric-received?limit=1000'),
        fetch('/api/fabric-delivery')
      ]);
      const fabData = await fabRes.json();
      const delData = await delRes.json();

      const fabrics: FabricRecord[] = fabData.data || [];
      const deliveries: DeliveryRecord[] = delData.data || [];

      // Group by Store Ref + Colour + FabricsType
      const map = new Map<string, StockLedgerEntry>();

      for (const f of fabrics) {
        const key = `${f.storeRef}__${f.colour}__${f.fabricsType}`;
        const existing = map.get(key);
        if (existing) {
          existing.totalReceived += f.receivedQuantity;
          existing.rollsInHand += f.receivedRoll;
          existing.totalBooking = Math.max(existing.totalBooking, f.bookingQty);
          if (f.receivedDate > existing.lastUpdated) existing.lastUpdated = f.receivedDate;
        } else {
          map.set(key, {
            storeRef: f.storeRef,
            buyerName: f.buyerName,
            styleName: f.styleName,
            fabricsType: f.fabricsType,
            colour: f.colour,
            gsm: f.gsm,
            totalBooking: f.bookingQty,
            totalReceived: f.receivedQuantity,
            totalDelivered: 0,
            balanceInHand: 0,
            rollsInHand: f.receivedRoll,
            location: f.location,
            lastUpdated: f.receivedDate
          });
        }
      }

      // Deduct deliveries
      for (const d of deliveries) {
        const key = `${d.storeRef}__${d.colour}__${d.fabricsType}`;
        const entry = map.get(key);
        if (entry) {
          entry.totalDelivered += d.deliveryQuantity;
          entry.rollsInHand = Math.max(0, entry.rollsInHand - d.deliveryRoll);
        }
      }

      // Calculate balance
      const entries = Array.from(map.values()).map((e) => ({
        ...e,
        balanceInHand: Math.max(0, e.totalReceived - e.totalDelivered)
      }));

      setLedgerEntries(entries);
      setHasLoaded(true);
    } catch (err) {
      console.error('Error calculating stock ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearch('');
    setSelectedBuyer('ALL');
    setLedgerEntries([]);
    setHasLoaded(false);
  };

  const buyers = availableBuyers.length > 0 ? availableBuyers : Array.from(new Set(ledgerEntries.map((e) => e.buyerName)));

  const filtered = ledgerEntries.filter((e) => {
    const q = search.toLowerCase();
    const matchesSearch =
      e.storeRef.toLowerCase().includes(q) ||
      e.buyerName.toLowerCase().includes(q) ||
      e.styleName.toLowerCase().includes(q) ||
      e.colour.toLowerCase().includes(q) ||
      e.fabricsType.toLowerCase().includes(q);

    const matchesBuyer = selectedBuyer === 'ALL' || e.buyerName === selectedBuyer;
    return matchesSearch && matchesBuyer;
  });

  const totalBalanceKg = filtered.reduce((s, e) => s + e.balanceInHand, 0);
  const totalDeliveredKg = filtered.reduce((s, e) => s + e.totalDelivered, 0);
  const totalRolls = filtered.reduce((s, e) => s + e.rollsInHand, 0);

  const exportCSV = () => {
    const headers = [
      'Store Ref',
      'Buyer',
      'Style',
      'Fabric Type',
      'Colour',
      'GSM',
      'Total Booked (Kg)',
      'Total Received (Kg)',
      'Total Delivered (Kg)',
      'Balance in Hand (Kg)',
      'Rolls in Hand',
      'Location',
      'Last Activity'
    ];

    const rows = filtered.map((e) => [
      e.storeRef,
      `"${e.buyerName}"`,
      `"${e.styleName}"`,
      `"${e.fabricsType}"`,
      e.colour,
      e.gsm,
      e.totalBooking,
      e.totalReceived,
      e.totalDelivered,
      e.balanceInHand,
      e.rollsInHand,
      e.location,
      e.lastUpdated
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `GMS_Stock_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-6 max-w-[1920px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="size-5 text-emerald-700" />
            <span>Finish Fabric Stock Ledger (Live Inventory)</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time material accounting showing booking, receipts, cutting deliveries, and physical rolls in hand
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={!hasLoaded || filtered.length === 0}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start md:self-auto cursor-pointer"
        >
          <Download className="size-4" />
          <span>Download Ledger (Excel)</span>
        </button>
      </div>

      {/* Stats Summary Bar */}
      {hasLoaded && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Active Store Refs
            </span>
            <span className="text-xl font-extrabold text-gray-900">{filtered.length}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Current Stock in Hand
            </span>
            <span className="text-xl font-extrabold text-emerald-700">
              {totalBalanceKg.toLocaleString()} Kg
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Delivered to Cutting
            </span>
            <span className="text-xl font-extrabold text-blue-700">
              {totalDeliveredKg.toLocaleString()} Kg
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Physical Rolls in Warehouse
            </span>
            <span className="text-xl font-extrabold text-gray-900">
              {totalRolls.toLocaleString()} Rolls
            </span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search Store Ref, Buyer, Colour, Style..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && computeLedger()}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="w-full sm:w-64">
            <select
              value={selectedBuyer}
              onChange={(e) => setSelectedBuyer(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
            >
              <option value="ALL">All Buyers</option>
              {buyers.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 flex-wrap">
          <button
            type="button"
            onClick={computeLedger}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white gap-1.5 h-8 px-4 rounded-lg text-xs font-bold inline-flex items-center transition-colors cursor-pointer shadow-2xs"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Search className="size-3.5" />
            )}
            <span>Show</span>
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="h-8 px-3 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>Clear Filter</span>
          </button>

          {hasLoaded && (
            <span className="ml-auto text-xs text-gray-400 font-medium">
              Total Found: {filtered.length} entries
            </span>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px] tracking-wider sticky top-0">
              <tr>
                <th className="py-2.5 px-3">Store Ref</th>
                <th className="py-2.5 px-3">Buyer & Style</th>
                <th className="py-2.5 px-3">Fabric Type</th>
                <th className="py-2.5 px-3">Colour / GSM</th>
                <th className="py-2.5 px-3 text-right">Booked (Kg)</th>
                <th className="py-2.5 px-3 text-right">Received (Kg)</th>
                <th className="py-2.5 px-3 text-right">Delivered (Kg)</th>
                <th className="py-2.5 px-3 text-right">Balance in Hand</th>
                <th className="py-2.5 px-3 text-right">Rolls</th>
                <th className="py-2.5 px-3">Rack</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!hasLoaded ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-400 text-sm">
                    Set filters and click <strong className="text-gray-700 font-bold mx-1">Show</strong> to load the stock ledger.
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-400">
                    <Loader2 className="size-5 animate-spin inline mr-2 text-emerald-600" />
                    Computing real-time stock balances...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-400 text-sm">
                    No matching stock entries found.
                  </td>
                </tr>
              ) : (
                filtered.map((e, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold font-mono text-gray-900">{e.storeRef}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-gray-800">{e.buyerName}</div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[140px]">
                        {e.styleName}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-gray-700">{e.fabricsType}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium">{e.colour}</span>
                      <span className="text-[10px] text-gray-400 block">{e.gsm} GSM</span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-500 font-medium">
                      {e.totalBooking}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-700 font-semibold">
                      {e.totalReceived}
                    </td>
                    <td className="py-2.5 px-3 text-right text-blue-700 font-semibold">
                      {e.totalDelivered}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">
                      {e.balanceInHand} Kg
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                      {e.rollsInHand}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-gray-600">{e.location}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          e.balanceInHand > 500
                            ? 'bg-emerald-100 text-emerald-800'
                            : e.balanceInHand > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {e.balanceInHand > 500
                          ? 'IN STOCK'
                          : e.balanceInHand > 0
                          ? 'LOW STOCK'
                          : 'EXHAUSTED'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
