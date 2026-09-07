import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Download,
  Printer,
  Trash2,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  RotateCcw,
  Loader2
} from 'lucide-react';
import type { FabricRecord } from '../types.js';

export const ReceiveHistoryView: React.FC = () => {
  const [records, setRecords] = useState<FabricRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [filterBuyer, setFilterBuyer] = useState<string>('ALL');
  const [filterApproval, setFilterApproval] = useState<string>('ALL');
  const [filterMonth, setFilterMonth] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [availableBuyers, setAvailableBuyers] = useState<string[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<FabricRecord | null>(null);

  useEffect(() => {
    // Pre-populate available buyers and months for filter dropdowns
    fetch('/api/fabric-received?limit=1000')
      .then((res) => res.json())
      .then((json) => {
        const allRecs: FabricRecord[] = json.data || [];
        const bList = Array.from(new Set(allRecs.map((r) => r.buyerName).filter(Boolean)));
        const mList = Array.from(new Set(allRecs.map((r) => r.monthName).filter(Boolean)));
        setAvailableBuyers(bList);
        setAvailableMonths(mList);
      })
      .catch((e) => console.error(e));
  }, []);

  const handleShow = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/fabric-received?limit=1000');
      const data = await res.json();
      setRecords(data.data || []);
      setHasLoaded(true);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setSearch('');
    setFilterBuyer('ALL');
    setFilterApproval('ALL');
    setFilterMonth('ALL');
    setDateFrom('');
    setDateTo('');
    setRecords([]);
    setHasLoaded(false);
  };

  const handleDelete = async (id: string, mrrNo: string) => {
    if (!confirm(`Confirm deleting receive record ${mrrNo}?`)) return;
    try {
      const res = await fetch(`/api/fabric-received/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const exportToCSV = () => {
    if (records.length === 0) return;
    const headers = [
      'MRR No',
      'Warehouse',
      'Buyer',
      'Style',
      'Store Ref',
      'Fabric Type',
      'GSM',
      'Composition',
      'Received Date',
      'Colour',
      'Batch No',
      'Booking Qty (Kg)',
      'Grey Qty (Kg)',
      'Received Qty (Kg)',
      'Received Rolls',
      'PL %',
      'Approval',
      'Dyeing Status',
      'Location',
      'Person of Cutting',
      'Month'
    ];

    const rows = filteredRecords.map((r) => [
      r.mrrNo,
      `"${r.warehouseName}"`,
      `"${r.buyerName}"`,
      `"${r.styleName}"`,
      r.storeRef,
      `"${r.fabricsType}"`,
      r.gsm,
      `"${r.composition}"`,
      r.receivedDate,
      r.colour,
      r.batchNo,
      r.bookingQty,
      r.greyQty,
      r.receivedQuantity,
      r.receivedRoll,
      r.plPercent,
      r.approvalOk,
      r.dyeingStatus,
      r.location,
      `"${r.personOfCutting}"`,
      r.monthName
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GMS_Fabric_Receive_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const buyers = availableBuyers.length > 0 ? availableBuyers : Array.from(new Set(records.map((r) => r.buyerName).filter(Boolean)));
  const months = availableMonths.length > 0 ? availableMonths : Array.from(new Set(records.map((r) => r.monthName).filter(Boolean)));

  const filteredRecords = records.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      r.mrrNo.toLowerCase().includes(q) ||
      r.storeRef.toLowerCase().includes(q) ||
      r.buyerName.toLowerCase().includes(q) ||
      r.styleName.toLowerCase().includes(q) ||
      r.batchNo.toLowerCase().includes(q) ||
      r.colour.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q);

    const matchesBuyer = filterBuyer === 'ALL' || r.buyerName === filterBuyer;
    const matchesApproval = filterApproval === 'ALL' || r.approvalOk === filterApproval;
    const matchesMonth = filterMonth === 'ALL' || r.monthName === filterMonth;
    const matchesDateFrom = !dateFrom || (r.receivedDate && r.receivedDate >= dateFrom);
    const matchesDateTo = !dateTo || (r.receivedDate && r.receivedDate <= dateTo);

    return matchesSearch && matchesBuyer && matchesApproval && matchesMonth && matchesDateFrom && matchesDateTo;
  });

  const totalReceivedKg = filteredRecords.reduce((sum, r) => sum + r.receivedQuantity, 0);
  const totalRolls = filteredRecords.reduce((sum, r) => sum + r.receivedRoll, 0);
  const avgPl =
    filteredRecords.length > 0
      ? (
          filteredRecords.reduce((sum, r) => sum + (parseFloat(r.plPercent) || 0), 0) /
          filteredRecords.length
        ).toFixed(2)
      : '0.00';

  return (
    <div className="p-4 md:p-6 max-w-[1920px] mx-auto space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="size-5 text-emerald-700" />
            <span>Fabric Receive History & Transaction Log</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Complete historical audit trail of all warehouse fabric goods receipts (MRR)
          </p>
        </div>

        <button
          onClick={exportToCSV}
          disabled={!hasLoaded || filteredRecords.length === 0}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start md:self-auto cursor-pointer"
        >
          <Download className="size-4" />
          <span>Export to Excel / CSV</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      {hasLoaded && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Total Batches
            </span>
            <span className="text-xl font-extrabold text-gray-900">{filteredRecords.length}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Total Finish Qty (Kg)
            </span>
            <span className="text-xl font-extrabold text-emerald-700">
              {totalReceivedKg.toLocaleString()} Kg
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Total Rolls Received
            </span>
            <span className="text-xl font-extrabold text-gray-900">
              {totalRolls.toLocaleString()} Rolls
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Avg Process Loss %
            </span>
            <span className="text-xl font-extrabold text-amber-700">{avgPl}%</span>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search MRR, Store Ref, Batch, Style..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleShow()}
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <select
              value={filterBuyer}
              onChange={(e) => setFilterBuyer(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
            >
              <option value="ALL">All Buyers</option>
              {buyers.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterApproval}
              onChange={(e) => setFilterApproval(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
            >
              <option value="ALL">All Approval Statuses</option>
              <option value="OK">OK (Pass)</option>
              <option value="RE-CHECK">RE-CHECK</option>
              <option value="PENDING">PENDING</option>
              <option value="REJECT">REJECT</option>
            </select>
          </div>

          <div>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
            >
              <option value="ALL">All Months</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Date From"
              title="Received Date From"
              className="w-full px-2.5 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100 flex-wrap">
          <button
            type="button"
            onClick={handleShow}
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
            onClick={handleClearFilter}
            className="h-8 px-3 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>Clear Filter</span>
          </button>

          {hasLoaded && (
            <span className="ml-auto text-xs text-gray-400 font-medium">
              Total Found: {filteredRecords.length} records
            </span>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[650px] scrollbar-thin">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200 sticky top-0 uppercase text-[10px] tracking-wider z-10">
              <tr>
                <th className="py-3 px-3">MRR No</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Store Ref</th>
                <th className="py-3 px-3">Buyer</th>
                <th className="py-3 px-3">Style</th>
                <th className="py-3 px-3">Fabric Type</th>
                <th className="py-3 px-3">GSM</th>
                <th className="py-3 px-3">Colour</th>
                <th className="py-3 px-3">Batch No</th>
                <th className="py-3 px-3 text-right">Received (Kg)</th>
                <th className="py-3 px-3 text-right">Rolls</th>
                <th className="py-3 px-3 text-right">PL %</th>
                <th className="py-3 px-3">Rack</th>
                <th className="py-3 px-3">Approval</th>
                <th className="py-3 px-3">Dyeing</th>
                <th className="py-3 px-3">Cutting Person</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!hasLoaded ? (
                <tr>
                  <td colSpan={17} className="py-12 text-center text-gray-400 text-sm">
                    Set filters and click <strong className="text-gray-700 font-bold mx-1">Show</strong> to load data.
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={17} className="py-12 text-center text-gray-400">
                    <Loader2 className="size-5 animate-spin inline mr-2 text-emerald-600" />
                    Loading transaction history...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={17} className="py-12 text-center text-gray-400 text-sm">
                    No records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-800 whitespace-nowrap">
                      {r.mrrNo}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">{r.receivedDate}</td>
                    <td className="py-2.5 px-3 font-bold text-gray-900 whitespace-nowrap">{r.storeRef}</td>
                    <td className="py-2.5 px-3 font-medium whitespace-nowrap">{r.buyerName}</td>
                    <td className="py-2.5 px-3 text-gray-600 truncate max-w-[130px]" title={r.styleName}>
                      {r.styleName}
                    </td>
                    <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap">{r.fabricsType}</td>
                    <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">{r.gsm}</td>
                    <td className="py-2.5 px-3 font-medium whitespace-nowrap">{r.colour}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-800 whitespace-nowrap">{r.batchNo}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-gray-900 whitespace-nowrap">
                      {r.receivedQuantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                      {r.receivedRoll}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-600 whitespace-nowrap">
                      {r.plPercent}%
                    </td>
                    <td className="py-2.5 px-3 font-mono text-gray-700 whitespace-nowrap">{r.location}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          r.approvalOk === 'OK'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.approvalOk}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-[10px] font-semibold text-gray-700">{r.dyeingStatus}</span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 truncate max-w-[130px]" title={r.personOfCutting}>
                      {r.personOfCutting}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedRecord(r)}
                          title="Print MRR"
                          className="p-1 rounded text-gray-500 hover:text-emerald-700 hover:bg-emerald-50"
                        >
                          <Printer className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id, r.mrrNo)}
                          title="Delete"
                          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Modal for Printing */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 border border-gray-300">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  GMS COMPOSITE KNITTING IND. LTD.
                </h3>
                <p className="text-xs text-gray-500">Material Received Report (MRR)</p>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-800 rounded">
                {selectedRecord.mrrNo}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-gray-50 p-4 rounded-lg">
              <div>
                <span className="text-gray-400 block text-[10px]">WAREHOUSE</span>
                <span className="font-bold text-gray-800">{selectedRecord.warehouseName}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">STORE REF</span>
                <span className="font-bold text-gray-800">{selectedRecord.storeRef}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">BUYER</span>
                <span className="font-bold text-gray-800">{selectedRecord.buyerName}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">STYLE</span>
                <span className="font-bold text-gray-800">{selectedRecord.styleName}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">FABRIC TYPE</span>
                <span className="font-semibold text-gray-800">{selectedRecord.fabricsType}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">COLOUR / GSM</span>
                <span className="font-semibold text-gray-800">
                  {selectedRecord.colour} ({selectedRecord.gsm} GSM)
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">BATCH NO</span>
                <span className="font-mono font-bold text-gray-800">{selectedRecord.batchNo}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">RECEIVED QUANTITY</span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  {selectedRecord.receivedQuantity} Kg
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">RECEIVED ROLLS</span>
                <span className="font-bold text-gray-800">{selectedRecord.receivedRoll} Rolls</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">RACK LOCATION</span>
                <span className="font-mono font-bold text-gray-800">{selectedRecord.location}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">PROCESS LOSS (PL %)</span>
                <span className="font-mono font-bold text-amber-700">{selectedRecord.plPercent}%</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">APPROVAL STATUS</span>
                <span className="font-bold text-emerald-700">{selectedRecord.approvalOk}</span>
              </div>
            </div>

            <div className="border-t pt-3 flex items-center justify-between text-xs text-gray-500">
              <span>Person of Cutting: {selectedRecord.personOfCutting}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium"
                >
                  Print Report
                </button>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
