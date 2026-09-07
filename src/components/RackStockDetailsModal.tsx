import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Layers,
  Scale,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Printer,
  Download,
  ClipboardCheck,
  RefreshCw,
  Box,
  TrendingUp,
  Tag,
  ShieldCheck,
  ArrowRight,
  Truck,
  PlusCircle,
  MoveRight,
  Sliders,
  Check,
  History,
  AlertCircle,
  CheckCheck,
  Radio,
  Zap,
} from 'lucide-react';
import type { FabricRecord, RackStockResponse, RackStockItem, RackSRGroupSummary } from '../types.js';
import { syncRackAuditToFirebase, syncFabricRecordToFirebase } from '../lib/firebase.js';

interface RackStockDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rackId: string;
  allRacks: string[];
  fabrics: FabricRecord[];
  onRefreshFabrics?: () => void;
  onOpenScanner?: () => void;
  onNavigateTab?: (tab: any, context?: any) => void;
}

export const RackStockDetailsModal: React.FC<RackStockDetailsModalProps> = ({
  isOpen,
  onClose,
  rackId,
  allRacks = [],
  fabrics,
  onRefreshFabrics,
  onOpenScanner,
  onNavigateTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState('ALL');
  const [showAuditPanel, setShowAuditPanel] = useState(false);

  // Live Server Data States
  const [serverStockData, setServerStockData] = useState<RackStockResponse | null>(null);
  const [isFetchingStock, setIsFetchingStock] = useState<boolean>(false);
  const [lastServerSync, setLastServerSync] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Relocation Sub-Modal State
  const [relocateItem, setRelocateItem] = useState<RackStockItem | null>(null);
  const [targetRack, setTargetRack] = useState<string>('');
  const [rollsToMove, setRollsToMove] = useState<number | ''>('');
  const [kgToMove, setKgToMove] = useState<number | ''>('');
  const [relocationNote, setRelocationNote] = useState<string>('');
  const [isRelocating, setIsRelocating] = useState<boolean>(false);
  const [relocateSuccessMsg, setRelocateSuccessMsg] = useState<string | null>(null);

  // Audit state
  const [auditPhysicalRolls, setAuditPhysicalRolls] = useState<number | ''>('');
  const [auditPhysicalKg, setAuditPhysicalKg] = useState<number | ''>('');
  const [auditAuditor, setAuditAuditor] = useState<string>('Warehouse Supervisor');
  const [auditNote, setAuditNote] = useState<string>('');
  const [auditSaved, setAuditSaved] = useState(false);
  const [isSavingAudit, setIsSavingAudit] = useState(false);

  // Fetch real-time stock balance calculated by server database
  const fetchLiveStock = useCallback(async () => {
    if (!rackId) return;
    setIsFetchingStock(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/racks/stock?rack=${encodeURIComponent(rackId)}`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data: RackStockResponse = await res.json();
      if (data.success) {
        setServerStockData(data);
        setLastServerSync(new Date(data.serverTimestamp).toLocaleTimeString());
      } else {
        throw new Error(data.message || 'Failed to calculate rack stock');
      }
    } catch (err: any) {
      console.warn('Real-time server fetch failed, falling back to local records:', err);
      setFetchError(err.message || 'Error fetching live server stock');
    } finally {
      setIsFetchingStock(false);
    }
  }, [rackId]);

  useEffect(() => {
    if (isOpen && rackId) {
      fetchLiveStock();
    }
  }, [isOpen, rackId, fetchLiveStock]);

  // Derived stock items (prefer live server data, fallback to local fabrics if offline)
  const stockItems: RackStockItem[] = useMemo(() => {
    if (serverStockData?.stocks && serverStockData.stocks.length > 0) {
      return serverStockData.stocks;
    }
    // Fallback calculation from local fabrics
    return fabrics
      .filter((f) => f.location && f.location.trim().toLowerCase() === rackId.trim().toLowerCase())
      .map((f) => ({
        id: f.id,
        storeRef: f.storeRef,
        buyer: f.buyerName,
        fabricType: f.fabricsType,
        gsm: f.gsm,
        color: f.colour,
        batchNo: f.batchNo,
        lotNo: f.lotNo || f.batchNo,
        receiveQty: Number(f.receivedQuantity) || 0,
        deliveryQty: 0,
        balanceQty: Number(f.receivedQuantity) || 0,
        receiveRoll: Number(f.receivedRoll) || 0,
        deliveryRoll: 0,
        balanceRoll: Number(f.receivedRoll) || 0,
        rackNo: rackId,
        rackLocation: rackId,
        mrrNo: f.mrrNo,
        styleName: f.styleName,
        composition: f.composition,
        approvalOk: f.approvalOk,
        receivedDate: f.receivedDate,
        remarks: f.remarks,
      }));
  }, [serverStockData, fabrics, rackId]);

  // Grouped Multiple SRs Summary
  const srSummaries: RackSRGroupSummary[] = useMemo(() => {
    if (serverStockData?.srSummary && serverStockData.srSummary.length > 0) {
      return serverStockData.srSummary;
    }
    // Compute fallback groups by SR
    const map = new Map<string, RackSRGroupSummary>();
    stockItems.forEach((item) => {
      const sr = item.storeRef || 'N/A';
      if (!map.has(sr)) {
        map.set(sr, {
          storeRef: sr,
          buyer: item.buyer,
          fabricType: item.fabricType,
          color: item.color,
          gsm: item.gsm,
          receiveQty: 0,
          deliveryQty: 0,
          balanceQty: 0,
          receiveRoll: 0,
          deliveryRoll: 0,
          balanceRoll: 0,
          batchCount: 0,
          batches: [],
        });
      }
      const g = map.get(sr)!;
      g.receiveQty += item.receiveQty;
      g.deliveryQty += item.deliveryQty;
      g.balanceQty += item.balanceQty;
      g.receiveRoll += item.receiveRoll;
      g.deliveryRoll += item.deliveryRoll;
      g.balanceRoll += item.balanceRoll;
      if (!g.batches.includes(item.batchNo)) {
        g.batches.push(item.batchNo);
        g.batchCount += 1;
      }
    });
    return Array.from(map.values());
  }, [serverStockData, stockItems]);

  // Overall Totals
  const totalBalanceKg = serverStockData?.summary?.totalBalanceQty ??
    stockItems.reduce((acc, b) => acc + (Number(b.balanceQty) || 0), 0);
  const totalBalanceRolls = serverStockData?.summary?.totalBalanceRolls ??
    stockItems.reduce((acc, b) => acc + (Number(b.balanceRoll) || 0), 0);
  const totalReceiveKg = serverStockData?.summary?.totalReceiveQty ??
    stockItems.reduce((acc, b) => acc + (Number(b.receiveQty) || 0), 0);
  const totalDeliveryKg = serverStockData?.summary?.totalDeliveryQty ??
    stockItems.reduce((acc, b) => acc + (Number(b.deliveryQty) || 0), 0);

  // Rack Information
  const rackNoDisplay = serverStockData?.rack?.rackNo || rackId.split('/')[0]?.replace('Rack:', '').trim() || rackId;
  const rackLocationDisplay = serverStockData?.rack?.location || rackId.split('/')[1]?.replace('Location:', '').trim() || '';
  const rackZoneDisplay = serverStockData?.rack?.zone || 'Finish Fabric Warehouse';

  // Capacity calculations
  const MAX_BAY_CAPACITY_KG = serverStockData?.rack?.capacityKg || 2500;
  const MAX_BAY_ROLLS = serverStockData?.rack?.capacityRolls || 60;
  const capacityPercentKg = Math.min(Math.round((totalBalanceKg / MAX_BAY_CAPACITY_KG) * 100), 100);
  const capacityPercentRolls = Math.min(Math.round((totalBalanceRolls / MAX_BAY_ROLLS) * 100), 100);
  const remainingCapacityKg = Math.max(0, MAX_BAY_CAPACITY_KG - totalBalanceKg);

  // Filtered Stock Items
  const filteredStockItems = useMemo(() => {
    return stockItems.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.storeRef?.toLowerCase().includes(q) ||
        item.buyer?.toLowerCase().includes(q) ||
        item.batchNo?.toLowerCase().includes(q) ||
        item.lotNo?.toLowerCase().includes(q) ||
        item.mrrNo?.toLowerCase().includes(q) ||
        item.fabricType?.toLowerCase().includes(q) ||
        item.color?.toLowerCase().includes(q) ||
        item.gsm?.toString().includes(q);

      const matchBuyer = selectedBuyer === 'ALL' || item.buyer === selectedBuyer;
      return matchQuery && matchBuyer;
    });
  }, [stockItems, searchQuery, selectedBuyer]);

  const uniqueBuyers = useMemo(() => {
    const set = new Set<string>();
    stockItems.forEach((b) => {
      if (b.buyer) set.add(b.buyer);
    });
    return Array.from(set);
  }, [stockItems]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (stockItems.length === 0) return;
    const headers = [
      'Store Ref (SR)',
      'Buyer',
      'Fabric Type',
      'GSM',
      'Color',
      'Batch No',
      'Lot No',
      'Receive Qty (Kg)',
      'Delivery Qty (Kg)',
      'Balance Qty (Kg)',
      'Balance Rolls',
      'Rack No',
      'Rack Location',
      'MRR No',
      'Style',
    ];
    const rows = stockItems.map((b) => [
      `"${b.storeRef || ''}"`,
      `"${b.buyer || ''}"`,
      `"${b.fabricType || ''}"`,
      `"${b.gsm || ''}"`,
      `"${b.color || ''}"`,
      `"${b.batchNo || ''}"`,
      `"${b.lotNo || ''}"`,
      b.receiveQty,
      b.deliveryQty,
      b.balanceQty,
      b.balanceRoll,
      `"${b.rackNo || rackNoDisplay}"`,
      `"${b.rackLocation || rackLocationDisplay}"`,
      `"${b.mrrNo || ''}"`,
      `"${b.styleName || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rack_Stock_${rackNoDisplay}_${rackLocationDisplay}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit Physical Audit
  const handleSaveAudit = async () => {
    setIsSavingAudit(true);
    const auditRecord = {
      id: `audit_${Date.now()}`,
      rackId,
      rackName: `${rackNoDisplay} / ${rackLocationDisplay}`,
      auditedBy: auditAuditor || 'Supervisor',
      physicalKg: Number(auditPhysicalKg) || 0,
      physicalRolls: Number(auditPhysicalRolls) || 0,
      systemKg: totalBalanceKg,
      systemRolls: totalBalanceRolls,
      discrepancyNote: auditNote,
      timestamp: new Date().toISOString(),
    };

    try {
      await syncRackAuditToFirebase(auditRecord);
      setAuditSaved(true);
      setTimeout(() => setAuditSaved(false), 4000);
    } catch (err) {
      console.error('Audit save error:', err);
    } finally {
      setIsSavingAudit(false);
    }
  };

  // Relocation Handler
  const handleStartRelocate = (item: RackStockItem) => {
    setRelocateItem(item);
    setRollsToMove(item.balanceRoll);
    setKgToMove(item.balanceQty);
    const otherRack = allRacks.find((r) => r.toLowerCase() !== rackId.toLowerCase()) || allRacks[0] || 'Rack A-02';
    setTargetRack(otherRack);
    setRelocateSuccessMsg(null);
  };

  const handleConfirmRelocation = async () => {
    if (!relocateItem || !targetRack) return;
    setIsRelocating(true);

    try {
      const matchingFabric = fabrics.find(
        (f) => f.id === relocateItem.id || (f.batchNo === relocateItem.batchNo && f.storeRef === relocateItem.storeRef)
      );

      if (matchingFabric) {
        const updatedRecord: FabricRecord = {
          ...matchingFabric,
          location: targetRack,
          remarks: `${matchingFabric.remarks || ''} [Relocated from ${rackId} to ${targetRack}: ${rollsToMove} rolls, ${kgToMove}kg. Note: ${relocationNote}]`.trim(),
        };

        await syncFabricRecordToFirebase(updatedRecord);
        await fetch(`/api/fabric-received/${matchingFabric.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedRecord),
        });
      }

      setRelocateSuccessMsg(
        `Successfully transferred ${rollsToMove} rolls (${kgToMove} Kg) to ${targetRack}!`
      );
      if (onRefreshFabrics) onRefreshFabrics();
      await fetchLiveStock();
      setTimeout(() => {
        setRelocateItem(null);
        setRelocateSuccessMsg(null);
      }, 2500);
    } catch (err) {
      console.error('Relocation failed:', err);
      alert('Relocation failed. Please try again.');
    } finally {
      setIsRelocating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="rack-stock-details-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        id="rack-stock-details-modal-container"
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full overflow-hidden border border-gray-200 flex flex-col max-h-[96vh]"
      >
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Layers className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-bold">
                  BAY LOCATION REAL-TIME MANIFEST
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                  AUTO-DETECTED
                </span>
              </div>
              <h2 className="text-xl font-mono font-extrabold text-white flex items-center gap-2">
                <span>Rack: {rackNoDisplay}</span>
                {rackLocationDisplay && (
                  <span className="text-emerald-400 font-bold">/ Location: {rackLocationDisplay}</span>
                )}
                <span className="text-xs text-slate-400 font-sans font-normal">
                  • {rackZoneDisplay}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Refresh Button */}
            <button
              onClick={fetchLiveStock}
              disabled={isFetchingStock}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              title="Query server database for live balance stock"
            >
              <RefreshCw className={`size-3.5 ${isFetchingStock ? 'animate-spin' : ''}`} />
              <span>{isFetchingStock ? 'Querying...' : 'Refresh Stock'}</span>
            </button>

            {/* Quick Inward to this Bay */}
            {onNavigateTab && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateTab('home', { rack: rackId });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors shadow-xs cursor-pointer"
                title="Receive and store new fabric into this bay"
              >
                <PlusCircle className="size-3.5 text-emerald-400" />
                <span>Inward Fabric</span>
              </button>
            )}

            {onOpenScanner && (
              <button
                onClick={onOpenScanner}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                title="Scan another rack"
              >
                <span>Scan Another</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              title="Print Bay Manifest"
            >
              <Printer className="size-3.5 text-slate-700" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Real-time Server Sync Sub-header */}
        <div className="bg-slate-800 text-slate-300 px-5 py-2 text-[11px] flex flex-wrap items-center justify-between gap-3 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-emerald-300">
              <Zap className="size-3.5 text-emerald-400 shrink-0" />
              <span>
                Real-Time Server Database: <b>{lastServerSync ? `Synchronized at ${lastServerSync}` : 'Connecting...'}</b>
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Clock className="size-3" />
              <span>Client Scan: {new Date().toLocaleTimeString()}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-mono">
              Bay Location: <b>{rackLocationDisplay || rackNoDisplay}</b>
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Stock Stream Active</span>
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Current Balance Stock in Hand (KG) */}
            <div className="bg-gradient-to-br from-slate-50 to-emerald-50/60 p-4 rounded-xl border border-emerald-300/80 shadow-xs">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span className="font-bold uppercase tracking-wider text-emerald-900">Current Balance Qty</span>
                <Scale className="size-4 text-emerald-700" />
              </div>
              <div className="text-2xl font-black font-mono text-emerald-950">
                {totalBalanceKg.toLocaleString()} <span className="text-xs font-sans text-gray-500">KG</span>
              </div>
              <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span>Stock in Hand:</span>
                  <span className="font-bold text-emerald-800">{totalBalanceKg.toLocaleString()} KG</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Rack Capacity:</span>
                  <span className="font-mono text-gray-600">{capacityPercentKg}% ({remainingCapacityKg.toLocaleString()} KG free)</span>
                </div>
              </div>
            </div>

            {/* Current Balance Rolls */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/60 p-4 rounded-xl border border-blue-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span className="font-bold uppercase tracking-wider text-blue-900">Current Balance Rolls</span>
                <Box className="size-4 text-blue-700" />
              </div>
              <div className="text-2xl font-black font-mono text-blue-950">
                {totalBalanceRolls} <span className="text-xs font-sans text-gray-500">Rolls in Hand</span>
              </div>
              <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span>Roll Utilization:</span>
                  <span className="font-bold text-blue-900">{totalBalanceRolls} / {MAX_BAY_ROLLS} Rolls ({capacityPercentRolls}%)</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Avg Roll Wt:</span>
                  <span className="font-mono text-gray-600">
                    {totalBalanceRolls > 0 ? (totalBalanceKg / totalBalanceRolls).toFixed(1) : 0} KG/Roll
                  </span>
                </div>
              </div>
            </div>

            {/* Inward vs Outward */}
            <div className="bg-gradient-to-br from-slate-50 to-amber-50/50 p-4 rounded-xl border border-amber-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span className="font-bold uppercase tracking-wider text-amber-900">Inward vs Delivered</span>
                <TrendingUp className="size-4 text-amber-700" />
              </div>
              <div className="text-2xl font-black font-mono text-amber-950">
                {totalReceiveKg.toLocaleString()} <span className="text-xs font-sans text-gray-500">KG Rec</span>
              </div>
              <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span>Total Delivered:</span>
                  <span className="font-bold text-rose-700">-{totalDeliveryKg.toLocaleString()} KG</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Net Balance:</span>
                  <span className="font-bold text-emerald-700">{totalBalanceKg.toLocaleString()} KG</span>
                </div>
              </div>
            </div>

            {/* Multiple SRs & Batches */}
            <div className="bg-gradient-to-br from-slate-50 to-purple-50/50 p-4 rounded-xl border border-purple-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span className="font-bold uppercase tracking-wider text-purple-900">Distinct SRs & Batches</span>
                  <Tag className="size-4 text-purple-700" />
                </div>
                <div className="text-2xl font-black font-mono text-purple-950">
                  {srSummaries.length} <span className="text-xs font-sans text-gray-500">SR Numbers</span>
                </div>
                <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                  <div className="flex justify-between text-[11px]">
                    <span>Total Batches:</span>
                    <span className="font-bold text-purple-900">{stockItems.length} Batches</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Buyers:</span>
                    <span className="font-bold text-gray-800">{uniqueBuyers.length} Accounts</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-purple-100">
                <button
                  onClick={() => setShowAuditPanel(!showAuditPanel)}
                  className="w-full py-1 px-2 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-md text-[10px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ClipboardCheck className="size-3" />
                  <span>{showAuditPanel ? 'Hide Physical Audit' : 'Audit Physical Count'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* REQUIREMENT #4: Multiple SR in One Rack Summary Table */}
          <div className="bg-white rounded-xl border-2 border-slate-900 overflow-hidden shadow-xs">
            <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-emerald-400" />
                <h3 className="text-xs sm:text-sm font-bold font-mono tracking-wide">
                  Multiple SR Breakdown in this Bay (Rack: {rackNoDisplay} / Location: {rackLocationDisplay})
                </h3>
              </div>
              <span className="text-[11px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                {srSummaries.length} Store References Active
              </span>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-mono text-[11px] uppercase tracking-wider border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3">SR No</th>
                    <th className="py-2.5 px-3">Buyer</th>
                    <th className="py-2.5 px-3">Fabric</th>
                    <th className="py-2.5 px-3">Color</th>
                    <th className="py-2.5 px-3 text-right">Qty (KG) [Balance]</th>
                    <th className="py-2.5 px-3 text-right">Rolls [Balance]</th>
                    <th className="py-2.5 px-3 text-right text-slate-500">Rec Qty</th>
                    <th className="py-2.5 px-3 text-right text-slate-500">Del Qty</th>
                    <th className="py-2.5 px-3 text-center">Batches</th>
                    <th className="py-2.5 px-3 text-center">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {srSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-gray-400">
                        No active fabric balances recorded in this bay.
                      </td>
                    </tr>
                  ) : (
                    srSummaries.map((sr) => (
                      <tr key={sr.storeRef} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-black text-emerald-900">
                          {sr.storeRef}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-gray-800">
                          {sr.buyer}
                        </td>
                        <td className="py-2.5 px-3 text-gray-800">
                          <span className="font-semibold">{sr.fabricType}</span>
                          {sr.gsm && <span className="text-gray-500 text-[11px]"> • {sr.gsm} GSM</span>}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-gray-700">
                          {sr.color}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700 text-sm">
                          {sr.balanceQty.toLocaleString()} KG
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                          {sr.balanceRoll}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-500">
                          {sr.receiveQty.toLocaleString()} KG
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                          {sr.deliveryQty > 0 ? `-${sr.deliveryQty.toLocaleString()} KG` : '0 KG'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-xs text-gray-600">
                          {sr.batches.join(', ')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {onNavigateTab && (
                            <button
                              onClick={() => {
                                onClose();
                                onNavigateTab('delivery', { storeRef: sr.storeRef, rack: rackId });
                              }}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              title="Issue delivery for this SR"
                            >
                              <Truck className="size-3 text-emerald-400" />
                              <span>Issue Delivery</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {/* Rack Total Summary Row */}
                <tfoot className="bg-emerald-50 text-emerald-950 font-mono font-bold border-t-2 border-slate-900">
                  <tr>
                    <td colSpan={4} className="py-3 px-3 uppercase text-xs">
                      Total Rack Balance (Rack: {rackNoDisplay} / Location: {rackLocationDisplay})
                    </td>
                    <td className="py-3 px-3 text-right text-sm font-black text-emerald-900">
                      {totalBalanceKg.toLocaleString()} KG
                    </td>
                    <td className="py-3 px-3 text-right text-sm font-black text-emerald-900">
                      {totalBalanceRolls} Rolls
                    </td>
                    <td className="py-3 px-3 text-right text-xs text-gray-600">
                      {totalReceiveKg.toLocaleString()} KG
                    </td>
                    <td className="py-3 px-3 text-right text-xs text-rose-700">
                      -{totalDeliveryKg.toLocaleString()} KG
                    </td>
                    <td colSpan={2} className="py-3 px-3 text-center text-xs text-emerald-800">
                      {srSummaries.length} Distinct SRs
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Physical Audit Panel (Collapsible) */}
          {showAuditPanel && (
            <div className="p-4 bg-amber-50/70 border-2 border-dashed border-amber-300 rounded-xl animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200 mb-3">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="size-5 text-amber-700" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                    Physical Stock Count & Discrepancy Verification ({rackNoDisplay} / {rackLocationDisplay})
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-amber-800">
                  Standard WMS ISO Quality Compliance
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    System Expected Weight
                  </label>
                  <div className="p-2 bg-white rounded-lg border border-gray-300 font-mono font-bold text-gray-900">
                    {totalBalanceKg.toLocaleString()} Kg
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Physical Counted Weight (Kg)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={auditPhysicalKg}
                    onChange={(e) =>
                      setAuditPhysicalKg(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="e.g. 1920"
                    className="w-full p-2 bg-white rounded-lg border border-amber-400 font-mono font-bold text-amber-950 outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Physical Counted Rolls
                  </label>
                  <input
                    type="number"
                    value={auditPhysicalRolls}
                    onChange={(e) =>
                      setAuditPhysicalRolls(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder={`Expected: ${totalBalanceRolls}`}
                    className="w-full p-2 bg-white rounded-lg border border-amber-400 font-mono font-bold text-amber-950 outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Auditor Name / ID
                  </label>
                  <input
                    type="text"
                    value={auditAuditor}
                    onChange={(e) => setAuditAuditor(e.target.value)}
                    className="w-full p-2 bg-white rounded-lg border border-gray-300 font-medium text-gray-800 outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={auditNote}
                  onChange={(e) => setAuditNote(e.target.value)}
                  placeholder="Notes, discrepancy remarks, or damaged rolls..."
                  className="flex-1 w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs outline-hidden focus:ring-1 focus:ring-amber-500"
                />
                <button
                  onClick={handleSaveAudit}
                  disabled={isSavingAudit || auditPhysicalKg === ''}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shrink-0 shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>{isSavingAudit ? 'Saving...' : 'Commit Physical Audit'}</span>
                </button>
              </div>

              {auditSaved && (
                <div className="mt-2 p-2 bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>Audit verified & saved to database.</span>
                </div>
              )}
            </div>
          )}

          {/* Stock Batches Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="size-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search SR, Batch, Lot, MRR, Buyer, Color..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                />
              </div>

              {uniqueBuyers.length > 1 && (
                <select
                  value={selectedBuyer}
                  onChange={(e) => setSelectedBuyer(e.target.value)}
                  className="px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 outline-hidden"
                >
                  <option value="ALL">All Buyers ({uniqueBuyers.length})</option>
                  {uniqueBuyers.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>
                Showing <b>{filteredStockItems.length}</b> of <b>{stockItems.length}</b> finished fabric items
              </span>
              <button
                onClick={handleExportCsv}
                className="px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="size-3.5 text-gray-500" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* REQUIREMENT #3: Complete Finished Fabric Stock Manifest Table (All 13 fields) */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs bg-white">
            <div className="overflow-x-auto max-h-[420px] scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100/90 text-gray-700 uppercase font-mono text-[10px] tracking-wider sticky top-0 z-10 border-b border-gray-200 backdrop-blur-xs">
                  <tr>
                    <th className="py-2.5 px-3">SR Number</th>
                    <th className="py-2.5 px-3">Buyer</th>
                    <th className="py-2.5 px-3">Fabric Type</th>
                    <th className="py-2.5 px-3">GSM</th>
                    <th className="py-2.5 px-3">Color</th>
                    <th className="py-2.5 px-3">Batch No</th>
                    <th className="py-2.5 px-3">Lot No</th>
                    <th className="py-2.5 px-3 text-right">Rec Qty</th>
                    <th className="py-2.5 px-3 text-right">Del Qty</th>
                    <th className="py-2.5 px-3 text-right font-bold text-emerald-800">Balance Qty (KG)</th>
                    <th className="py-2.5 px-3 text-right">Roll Qty</th>
                    <th className="py-2.5 px-3">Rack No</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="py-12 text-center text-gray-400">
                        <Box className="size-8 mx-auto mb-2 text-gray-300" />
                        <span className="font-semibold block">No matching fabric items found</span>
                        <span className="text-[11px] text-gray-400">
                          {stockItems.length === 0
                            ? 'This bay currently has 0 registered fabric items.'
                            : 'No items match your filter criteria.'}
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filteredStockItems.map((item) => (
                      <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
                        {/* 1. SR Number */}
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-emerald-950 block">{item.storeRef}</span>
                          <span className="font-mono text-[10px] text-gray-500">{item.mrrNo}</span>
                        </td>

                        {/* 2. Buyer */}
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-gray-900 block">{item.buyer}</span>
                          {item.styleName && <span className="text-[10px] text-gray-500 truncate max-w-[120px] block">{item.styleName}</span>}
                        </td>

                        {/* 3. Fabric Type */}
                        <td className="py-2.5 px-3 font-medium text-gray-800">
                          {item.fabricType}
                        </td>

                        {/* 4. GSM */}
                        <td className="py-2.5 px-3 font-mono text-gray-700">
                          {item.gsm || '-'}
                        </td>

                        {/* 5. Color */}
                        <td className="py-2.5 px-3 font-medium text-gray-800">
                          {item.color}
                        </td>

                        {/* 6. Batch Number */}
                        <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                          {item.batchNo}
                        </td>

                        {/* 7. Lot Number */}
                        <td className="py-2.5 px-3 font-mono text-gray-600">
                          {item.lotNo || item.batchNo}
                        </td>

                        {/* 8. Receive Quantity */}
                        <td className="py-2.5 px-3 text-right font-mono text-gray-700">
                          {item.receiveQty.toLocaleString()}
                        </td>

                        {/* 9. Delivery Quantity */}
                        <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                          {item.deliveryQty > 0 ? `-${item.deliveryQty.toLocaleString()}` : '0'}
                        </td>

                        {/* 10. Current Balance Quantity / Stock in Hand */}
                        <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700 bg-emerald-50/50">
                          {item.balanceQty.toLocaleString()} <span className="text-[10px] font-sans text-emerald-900">KG</span>
                        </td>

                        {/* 11. Roll Quantity */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-800">
                          {item.balanceRoll} <span className="text-[10px] font-sans text-gray-400">/ {item.receiveRoll}</span>
                        </td>

                        {/* 12. Rack Number */}
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          {item.rackNo || rackNoDisplay}
                        </td>

                        {/* 13. Rack Location */}
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">
                          {item.rackLocation || rackLocationDisplay}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleStartRelocate(item)}
                              className="px-2 py-1 bg-white border border-gray-300 hover:bg-emerald-50 hover:border-emerald-300 text-gray-700 rounded text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Relocate this batch to another rack"
                            >
                              <MoveRight className="size-3 text-emerald-600" />
                              <span>Relocate</span>
                            </button>

                            {onNavigateTab && (
                              <button
                                onClick={() => {
                                  onClose();
                                  onNavigateTab('delivery', {
                                    storeRef: item.storeRef,
                                    batchNo: item.batchNo,
                                    rack: rackId,
                                  });
                                }}
                                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                title="Issue Delivery to Cutting"
                              >
                                <Truck className="size-3 text-emerald-400" />
                                <span>Issue</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Relocation Drawer / Modal */}
        {relocateItem && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-gray-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <MoveRight className="size-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Relocate Fabric Batch</h3>
                    <p className="text-[11px] text-gray-500">
                      From <b>{rackNoDisplay} / {rackLocationDisplay}</b> to target warehouse bay
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRelocateItem(null)}
                  className="text-gray-400 hover:text-gray-700 p-1"
                >
                  <X className="size-4" />
                </button>
              </div>

              {relocateSuccessMsg ? (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-center space-y-2">
                  <CheckCheck className="size-8 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-emerald-900">{relocateSuccessMsg}</p>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Batch & MRR:</span>
                      <span className="font-mono font-bold text-gray-900">
                        {relocateItem.batchNo} ({relocateItem.mrrNo})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Store Ref & Buyer:</span>
                      <span className="font-semibold text-gray-800">
                        {relocateItem.storeRef} - {relocateItem.buyer}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Balance in this Bay:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {relocateItem.balanceQty.toLocaleString()} Kg ({relocateItem.balanceRoll} Rolls)
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Destination Rack Location
                    </label>
                    <select
                      value={targetRack}
                      onChange={(e) => setTargetRack(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    >
                      {allRacks
                        .filter((r) => r.toLowerCase() !== rackId.toLowerCase())
                        .map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Rolls to Move
                      </label>
                      <input
                        type="number"
                        max={relocateItem.balanceRoll}
                        min={1}
                        value={rollsToMove}
                        onChange={(e) =>
                          setRollsToMove(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Weight to Move (Kg)
                      </label>
                      <input
                        type="number"
                        max={relocateItem.balanceQty}
                        min={0.1}
                        step="any"
                        value={kgToMove}
                        onChange={(e) =>
                          setKgToMove(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Relocation Reason / Supervisor Note
                    </label>
                    <input
                      type="text"
                      value={relocationNote}
                      onChange={(e) => setRelocationNote(e.target.value)}
                      placeholder="e.g. Bay reorganization or consolidation..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => setRelocateItem(null)}
                      className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmRelocation}
                      disabled={isRelocating || !targetRack}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="size-3.5" />
                      <span>{isRelocating ? 'Transferring...' : 'Confirm Transfer'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-gray-600">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>
              Rack: <b>{rackNoDisplay}</b> • Location: <b>{rackLocationDisplay}</b> • Rated Bay Capacity:{' '}
              <b>{MAX_BAY_CAPACITY_KG.toLocaleString()} Kg</b> ({MAX_BAY_ROLLS} Rolls)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg font-semibold transition-colors cursor-pointer"
            >
              Print Manifest
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors shadow-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
