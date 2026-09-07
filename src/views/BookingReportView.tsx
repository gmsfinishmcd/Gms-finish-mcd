import React, { useState } from 'react';
import {
  ClipboardCheck,
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  Printer,
  RotateCcw,
  Loader2
} from 'lucide-react';
import type { FabricRecord } from '../types.js';

interface BookingClosingRow {
  storeRef: string;
  buyerName: string;
  styleName: string;
  fabricsType: string;
  bookingQty: number;
  receivedQty: number;
  differenceQty: number;
  fulfillmentPercent: number;
  status: 'CLOSED' | 'SHORT' | 'EXCESS' | 'IN PROGRESS';
  lastBatchDate: string;
  isClosedManually: boolean;
}

export const BookingReportView: React.FC = () => {
  const [rows, setRows] = useState<BookingClosingRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchAndCompute = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/fabric-received?limit=1000');
      const data = await res.json();
      const records: FabricRecord[] = data.data || [];

      const map = new Map<string, BookingClosingRow>();

      for (const r of records) {
        const key = r.storeRef;
        const existing = map.get(key);
        if (existing) {
          existing.receivedQty += r.receivedQuantity;
          existing.bookingQty = Math.max(existing.bookingQty, r.bookingQty);
          if (r.receivedDate > existing.lastBatchDate) existing.lastBatchDate = r.receivedDate;
        } else {
          map.set(key, {
            storeRef: r.storeRef,
            buyerName: r.buyerName,
            styleName: r.styleName,
            fabricsType: r.fabricsType,
            bookingQty: r.bookingQty,
            receivedQty: r.receivedQuantity,
            differenceQty: 0,
            fulfillmentPercent: 0,
            status: 'IN PROGRESS',
            lastBatchDate: r.receivedDate,
            isClosedManually: false
          });
        }
      }

      const calculated = Array.from(map.values()).map((row) => {
        const diff = row.bookingQty - row.receivedQty;
        const pct = row.bookingQty > 0 ? (row.receivedQty / row.bookingQty) * 100 : 0;

        let status: BookingClosingRow['status'] = 'IN PROGRESS';
        if (pct >= 99 && pct <= 103) status = 'CLOSED';
        else if (pct > 103) status = 'EXCESS';
        else if (pct < 99 && row.receivedQty > 0) status = 'SHORT';

        return {
          ...row,
          differenceQty: diff,
          fulfillmentPercent: parseFloat(pct.toFixed(1)),
          status
        };
      });

      setRows(calculated);
      setHasLoaded(true);
    } catch (err) {
      console.error('Failed to load booking report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearch('');
    setFilterStatus('ALL');
    setRows([]);
    setHasLoaded(false);
  };

  const toggleManualClose = (storeRef: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.storeRef === storeRef
          ? {
              ...r,
              isClosedManually: !r.isClosedManually,
              status: !r.isClosedManually ? 'CLOSED' : 'IN PROGRESS'
            }
          : r
      )
    );
  };

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      r.storeRef.toLowerCase().includes(q) ||
      r.buyerName.toLowerCase().includes(q) ||
      r.styleName.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q);

    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const exportCSV = () => {
    if (!hasLoaded || filtered.length === 0) return;
    const headers = [
      'Store Ref',
      'Buyer',
      'Style',
      'Fabric',
      'Booking Qty (Kg)',
      'Received Qty (Kg)',
      'Difference (Kg)',
      'Fulfillment %',
      'Closing Status',
      'Last Batch Date'
    ];

    const csvRows = filtered.map((r) => [
      r.storeRef,
      `"${r.buyerName}"`,
      `"${r.styleName}"`,
      `"${r.fabricsType}"`,
      r.bookingQty,
      r.receivedQty,
      r.differenceQty,
      `${r.fulfillmentPercent}%`,
      r.status,
      r.lastBatchDate
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Booking_Closing_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-6 max-w-[1920px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="size-5 text-emerald-700" />
            <span>Booking vs Received Closing Report</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Audit store reference fulfillment, detect excess or short deliveries, and lock finished bookings
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            disabled={!hasLoaded || filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="size-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={exportCSV}
            disabled={!hasLoaded || filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="size-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search Store Ref, Buyer, Style, Status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAndCompute()}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="w-full sm:w-56">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="CLOSED">CLOSED</option>
              <option value="SHORT">SHORT</option>
              <option value="EXCESS">EXCESS</option>
              <option value="IN PROGRESS">IN PROGRESS</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 flex-wrap">
          <button
            type="button"
            onClick={fetchAndCompute}
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
              Total Found: {filtered.length} references
            </span>
          )}
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Store Ref</th>
                <th className="py-2.5 px-3">Buyer</th>
                <th className="py-2.5 px-3">Style</th>
                <th className="py-2.5 px-3">Fabric</th>
                <th className="py-2.5 px-3 text-right">Booked Qty (Kg)</th>
                <th className="py-2.5 px-3 text-right">Total Received (Kg)</th>
                <th className="py-2.5 px-3 text-right">Difference (Kg)</th>
                <th className="py-2.5 px-3 text-center">Fulfillment %</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3">Last Batch</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!hasLoaded ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-400 text-sm">
                    Apply filters and click <strong className="text-gray-700 font-bold mx-1">Show</strong> to generate report.
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-400">
                    <Loader2 className="size-5 animate-spin inline mr-2 text-emerald-600" />
                    Computing booking balances...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-400 text-sm">
                    No booking records found matching filters.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.storeRef} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{r.storeRef}</td>
                    <td className="py-2.5 px-3 font-medium">{r.buyerName}</td>
                    <td className="py-2.5 px-3 text-gray-600 truncate max-w-[140px]" title={r.styleName}>
                      {r.styleName}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">{r.fabricsType}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-gray-600">
                      {r.bookingQty}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                      {r.receivedQty}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono font-semibold ${
                        r.differenceQty > 0 ? 'text-amber-700' : 'text-gray-500'
                      }`}
                    >
                      {r.differenceQty.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              r.fulfillmentPercent >= 100 ? 'bg-emerald-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, r.fulfillmentPercent)}%` }}
                          />
                        </div>
                        <span className="text-[11px]">{r.fulfillmentPercent}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'CLOSED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'EXCESS'
                            ? 'bg-blue-100 text-blue-800'
                            : r.status === 'SHORT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 text-[11px]">{r.lastBatchDate}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => toggleManualClose(r.storeRef)}
                        title={r.isClosedManually ? 'Unlock Booking' : 'Lock/Close Booking'}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                          r.isClosedManually
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : 'bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:text-emerald-800'
                        }`}
                      >
                        {r.isClosedManually ? <Unlock className="size-3" /> : <Lock className="size-3" />}
                        <span>{r.isClosedManually ? 'Reopen' : 'Close'}</span>
                      </button>
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
