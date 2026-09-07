import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Barcode as BarcodeIcon,
  ScanBarcode,
  Printer,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Camera,
  Layers,
  Truck,
  MoveRight,
  Sliders,
  Copy,
  Download,
  Eye,
  Clock,
  User,
  Tag,
  Hash,
  Box,
  MapPin,
  CheckSquare,
  Square,
  Sparkles,
  Zap,
  FileSpreadsheet,
} from 'lucide-react';
import type { FabricRecord, DropdownMasterData, RackData, BarcodeScanLogEntry, BarcodeEntityType } from '../types.js';
import { Barcode } from '../components/Barcode.js';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal.js';
import { RollBarcodeModal } from '../components/RollBarcodeModal.js';
import { parseBarcode, generateRollBarcode, generateRackBarcode } from '../lib/barcodeUtils.js';
import { useBarcodeGun } from '../lib/useBarcodeGun.js';

interface BarcodeSystemViewProps {
  onNavigateTab?: (tab: any, context?: any) => void;
}

export const BarcodeSystemView: React.FC<BarcodeSystemViewProps> = ({ onNavigateTab }) => {
  // Navigation within Barcode System
  const [activeSubTab, setActiveSubTab] = useState<'scanner' | 'roll-tags' | 'rack-barcodes' | 'generator' | 'audit-log'>('scanner');

  // Master fabric & rack data
  const [fabrics, setFabrics] = useState<FabricRecord[]>([]);
  const [racks, setRacks] = useState<RackData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Scanner Station State
  const [scannedCodeInput, setScannedCodeInput] = useState<string>('');
  const [lastScannedResult, setLastScannedResult] = useState<{
    rawCode: string;
    type: BarcodeEntityType;
    matchedFabric?: FabricRecord;
    matchedRack?: RackData;
    timestamp: string;
  } | null>(null);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState<boolean>(false);
  const [scanToast, setScanToast] = useState<string | null>(null);

  // Roll Tag Studio Selection
  const [selectedFabricForTag, setSelectedFabricForTag] = useState<FabricRecord | null>(null);
  const [selectedFabricsForBatch, setSelectedFabricsForBatch] = useState<string[]>([]);
  const [rollSearchQuery, setRollSearchQuery] = useState<string>('');

  // Custom Generator State
  const [customText, setCustomText] = useState<string>('GMS-CHALLAN-2026-001');
  const [customFormat, setCustomFormat] = useState<'CODE128' | 'CODE39' | 'EAN13'>('CODE128');
  const [customWidth, setCustomWidth] = useState<number>(2);
  const [customHeight, setCustomHeight] = useState<number>(60);
  const [customDisplayText, setCustomDisplayText] = useState<boolean>(true);

  // Scan Audit Log
  const [scanLog, setScanLog] = useState<BarcodeScanLogEntry[]>([
    {
      id: 'log-1',
      code: 'GMS-SR1001-B1001-R01',
      type: 'ROLL',
      entityName: 'SR-1001 • Single Jersey • Batch B-1001',
      operator: 'MCD Operator #1',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString(),
      actionTaken: 'Verified Stock in Bay R-05',
    },
    {
      id: 'log-2',
      code: 'RACK-R-05-A-01',
      type: 'RACK',
      entityName: 'Rack R-05 / Bay A-01',
      operator: 'MCD Supervisor',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toLocaleTimeString(),
      actionTaken: 'Bay Inventory Audit',
    },
    {
      id: 'log-3',
      code: 'MRR-260905-101',
      type: 'MRR',
      entityName: 'MRR-260905-101 (Receive Inward)',
      operator: 'Receiving Officer',
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toLocaleTimeString(),
      actionTaken: 'Inward Roll Tag Generation',
    },
  ]);

  // Load Inventory & Rack Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [fabRes, rackRes] = await Promise.all([
        fetch('/api/fabric-received?limit=500'),
        fetch('/api/rack-data'),
      ]);

      const fabJson = await fabRes.json();
      const rackJson = await rackRes.json();

      setFabrics(fabJson.data || []);
      if (rackJson.success && Array.isArray(rackJson.racks)) {
        setRacks(rackJson.racks);
      }
    } catch (err) {
      console.error('Failed to load barcode system data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Process barcode scan string
  const handleProcessBarcode = useCallback(
    (codeToProcess: string) => {
      const parsed = parseBarcode(codeToProcess);
      const cleaned = parsed.identifier.toLowerCase();

      // Find matching fabric record
      const matchedFab = fabrics.find(
        (f) =>
          (f.mrrNo && f.mrrNo.toLowerCase() === cleaned) ||
          (f.batchNo && f.batchNo.toLowerCase() === cleaned) ||
          (f.storeRef && f.storeRef.toLowerCase() === cleaned) ||
          codeToProcess.toLowerCase().includes(f.storeRef.toLowerCase()) ||
          codeToProcess.toLowerCase().includes(f.batchNo.toLowerCase())
      );

      // Find matching rack
      const matchedR = racks.find(
        (r) =>
          r.rackId.toLowerCase() === cleaned ||
          r.name.toLowerCase().includes(cleaned) ||
          codeToProcess.toLowerCase().includes(r.rackId.toLowerCase())
      );

      const result = {
        rawCode: codeToProcess,
        type: parsed.type,
        matchedFabric: matchedFab,
        matchedRack: matchedR,
        timestamp: new Date().toLocaleTimeString(),
      };

      setLastScannedResult(result);
      setScannedCodeInput(codeToProcess);

      // Add to audit log
      const newEntry: BarcodeScanLogEntry = {
        id: `log-${Date.now()}`,
        code: codeToProcess,
        type: parsed.type,
        entityName: matchedFab
          ? `${matchedFab.storeRef} • ${matchedFab.fabricsType} • ${matchedFab.colour}`
          : matchedR
          ? matchedR.name
          : codeToProcess,
        operator: 'Current User',
        timestamp: new Date().toLocaleTimeString(),
        actionTaken: matchedFab ? 'Stock Lookup' : matchedR ? 'Rack Location Check' : 'General Barcode Scan',
      };
      setScanLog((prev) => [newEntry, ...prev.slice(0, 49)]);

      setScanToast(`Successfully scanned ${parsed.type}: ${codeToProcess}`);
      setTimeout(() => setScanToast(null), 4000);
    },
    [fabrics, racks]
  );

  // Global Hardware Barcode Gun Listener (USB / Bluetooth Laser Scanners)
  useBarcodeGun({
    onScan: (scanned) => {
      handleProcessBarcode(scanned);
    },
    enabled: true,
  });

  // Filtered fabrics for Roll Tag Studio
  const filteredFabrics = useMemo(() => {
    if (!rollSearchQuery) return fabrics;
    const q = rollSearchQuery.toLowerCase();
    return fabrics.filter(
      (f) =>
        f.storeRef.toLowerCase().includes(q) ||
        f.batchNo.toLowerCase().includes(q) ||
        f.buyerName.toLowerCase().includes(q) ||
        f.colour.toLowerCase().includes(q) ||
        f.fabricsType.toLowerCase().includes(q) ||
        f.location.toLowerCase().includes(q) ||
        f.mrrNo.toLowerCase().includes(q)
    );
  }, [fabrics, rollSearchQuery]);

  // Batch selection helpers
  const handleToggleSelectForBatch = (id: string) => {
    setSelectedFabricsForBatch((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllForBatch = () => {
    setSelectedFabricsForBatch(filteredFabrics.map((f) => f.id));
  };

  const handleDeselectAllForBatch = () => {
    setSelectedFabricsForBatch([]);
  };

  return (
    <div className="p-4 md:p-6 max-w-[1920px] mx-auto space-y-6">
      {/* Top Banner & Barcode Gun Status Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-slate-950 text-emerald-400 flex items-center justify-center shadow-xs">
            <BarcodeIcon className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                MCD Finish Fabric Barcode System
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>CODE 128 / 1D & 2D</span>
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1 max-w-3xl">
              Complete industrial barcode management: standard Code 128 roll stickers, long-range warehouse bay rack tags, real-time USB/Bluetooth scanner gun listener, and stock validation.
            </p>
          </div>
        </div>

        {/* Quick Hardware & Camera Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Laser Scanner Gun Listener Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 shadow-2xs">
            <Zap className="size-3.5 text-emerald-600 animate-pulse" />
            <span>Barcode Gun:</span>
            <span className="text-emerald-800 bg-emerald-100 font-mono px-1.5 py-0.2 rounded text-[11px]">
              Ready (Auto-Detect)
            </span>
          </div>

          {/* Open Live Camera Scanner */}
          <button
            id="open-barcode-camera-scanner-btn"
            onClick={() => setIsScannerModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Camera className="size-4 text-emerald-400" />
            <span>Scan with Camera</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {scanToast && (
        <div className="p-3.5 bg-emerald-900 text-white border border-emerald-600 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 shadow-md animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-300 shrink-0" />
            <span>{scanToast}</span>
          </div>
          <button
            onClick={() => setScanToast(null)}
            className="text-gray-300 hover:text-white text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-xl p-1 shadow-xs overflow-x-auto scrollbar-none gap-1">
        <button
          onClick={() => setActiveSubTab('scanner')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'scanner'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <ScanBarcode className="size-4" />
          <span>Scanner & Live Stock Station</span>
        </button>

        <button
          onClick={() => setActiveSubTab('roll-tags')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'roll-tags'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Printer className="size-4" />
          <span>Roll Barcode Tag Studio</span>
        </button>

        <button
          onClick={() => setActiveSubTab('rack-barcodes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'rack-barcodes'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Layers className="size-4" />
          <span>Rack & Bay Barcodes (Code 128)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('generator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'generator'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Sliders className="size-4" />
          <span>Custom Barcode Generator</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit-log')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'audit-log'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Clock className="size-4" />
          <span>Shift Barcode Audit Log ({scanLog.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SCANNER & LIVE STOCK STATION */}
      {/* ========================================================================= */}
      {activeSubTab === 'scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Input Station */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ScanBarcode className="size-4 text-emerald-700" />
                <h2 className="text-sm font-bold text-gray-900">
                  Barcode Input & Gun Receiver
                </h2>
              </div>
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                AUTO-LISTEN ON
              </span>
            </div>

            <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Hardware Scanner Gun Listener</span>
                </span>
                <span className="text-[10px] text-gray-400 font-mono">20-50ms</span>
              </div>
              <p className="text-[11px] text-gray-300">
                Aim any USB / Bluetooth barcode scanner gun anywhere on screen or on a physical roll sticker. Scans are captured automatically.
              </p>
            </div>

            {/* Manual Entry or Gun Scan */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700">
                Scan or Enter Barcode String:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={scannedCodeInput}
                  onChange={(e) => setScannedCodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && scannedCodeInput.trim()) {
                      handleProcessBarcode(scannedCodeInput.trim());
                    }
                  }}
                  placeholder="e.g. GMS-SR1001-B1001-R01 or RACK-R-05"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <button
                  onClick={() => {
                    if (scannedCodeInput.trim()) {
                      handleProcessBarcode(scannedCodeInput.trim());
                    }
                  }}
                  disabled={!scannedCodeInput.trim()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Lookup
                </button>
              </div>
            </div>

            {/* Sample Barcode Quick Clicks */}
            <div className="pt-2 border-t border-gray-100">
              <span className="text-[11px] font-semibold text-gray-500 block mb-2">
                Quick Test Codes (Simulate Laser Gun Scan):
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleProcessBarcode('GMS-SR1001-B1001-R01')}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-100 text-gray-800 hover:text-emerald-900 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer"
                >
                  Roll: SR-1001 R01
                </button>
                <button
                  onClick={() => handleProcessBarcode('RACK-R-05-A-01')}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-100 text-gray-800 hover:text-emerald-900 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer"
                >
                  Rack: R-05 (A-01)
                </button>
                <button
                  onClick={() => handleProcessBarcode('MRR-260905-101')}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-100 text-gray-800 hover:text-emerald-900 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer"
                >
                  MRR Inward
                </button>
                <button
                  onClick={() => handleProcessBarcode('B-1001')}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-100 text-gray-800 hover:text-emerald-900 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer"
                >
                  Batch B-1001
                </button>
              </div>
            </div>

            {/* Camera Scan Launch */}
            <button
              onClick={() => setIsScannerModalOpen(true)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Camera className="size-4 text-emerald-400" />
              <span>Open Camera Barcode Scanner</span>
            </button>
          </div>

          {/* Right Column (2 spans): Scanned Entity Manifest & Action Station */}
          <div className="lg:col-span-2 space-y-4">
            {lastScannedResult ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-5">
                {/* Result Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-mono font-black text-sm">
                      {lastScannedResult.type}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black font-mono text-gray-900">
                          {lastScannedResult.rawCode}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-white">
                          LIVE MATCH
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-mono">
                        Scanned at {lastScannedResult.timestamp} • Type: {lastScannedResult.type}
                      </p>
                    </div>
                  </div>

                  {/* Rendered Barcode */}
                  <div className="bg-gray-50 p-2 rounded-xl border border-gray-200 flex flex-col items-center">
                    <Barcode
                      value={lastScannedResult.rawCode}
                      format="CODE128"
                      width={1.6}
                      height={38}
                      fontSize={11}
                      margin={1}
                    />
                  </div>
                </div>

                {/* If Matched Fabric Record */}
                {lastScannedResult.matchedFabric ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <span className="text-[10px] uppercase font-bold text-gray-500 block">STORE REF</span>
                        <span className="text-sm font-black text-emerald-900">
                          {lastScannedResult.matchedFabric.storeRef}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <span className="text-[10px] uppercase font-bold text-gray-500 block">BATCH NO</span>
                        <span className="text-sm font-mono font-bold text-gray-900">
                          {lastScannedResult.matchedFabric.batchNo}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <span className="text-[10px] uppercase font-bold text-gray-500 block">BUYER / STYLE</span>
                        <span className="text-sm font-bold text-gray-900 truncate block">
                          {lastScannedResult.matchedFabric.buyerName}
                        </span>
                        <span className="text-[11px] text-gray-500 truncate block">
                          {lastScannedResult.matchedFabric.styleName}
                        </span>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-300">
                        <span className="text-[10px] uppercase font-bold text-emerald-800 block">RACK LOCATION</span>
                        <span className="text-sm font-mono font-black text-emerald-950">
                          {lastScannedResult.matchedFabric.location}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <span className="text-[10px] uppercase font-bold text-gray-500 block">FABRIC & COLOR</span>
                        <span className="font-bold text-gray-900 block">
                          {lastScannedResult.matchedFabric.fabricsType}
                        </span>
                        <span className="text-gray-600">{lastScannedResult.matchedFabric.colour}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <span className="text-[10px] uppercase font-bold text-gray-500 block">GSM / DIA</span>
                        <span className="font-bold text-gray-900 block">
                          {lastScannedResult.matchedFabric.gsm} GSM
                        </span>
                        <span className="text-gray-600">{lastScannedResult.matchedFabric.dia || 'Open'}</span>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                        <span className="text-[10px] uppercase font-bold text-emerald-800 block">RECEIVED WEIGHT</span>
                        <span className="text-sm font-mono font-black text-emerald-900">
                          {Number(lastScannedResult.matchedFabric.receivedQuantity).toLocaleString()} Kg
                        </span>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                        <span className="text-[10px] uppercase font-bold text-emerald-800 block">ROLL COUNT</span>
                        <span className="text-sm font-mono font-black text-emerald-900">
                          {lastScannedResult.matchedFabric.receivedRoll} Rolls
                        </span>
                      </div>
                    </div>

                    {/* Action Bar for this Fabric */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => setSelectedFabricForTag(lastScannedResult.matchedFabric!)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Printer className="size-4" />
                        <span>Print Roll Barcode Tags</span>
                      </button>

                      {onNavigateTab && (
                        <>
                          <button
                            onClick={() =>
                              onNavigateTab('delivery', {
                                storeRef: lastScannedResult.matchedFabric!.storeRef,
                              })
                            }
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Truck className="size-4 text-emerald-400" />
                            <span>Issue Delivery to Cutting</span>
                          </button>

                          <button
                            onClick={() =>
                              onNavigateTab('rack-qr', {
                                rack: lastScannedResult.matchedFabric!.location,
                              })
                            }
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <MapPin className="size-4 text-emerald-700" />
                            <span>Locate in Bay Rack</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : lastScannedResult.matchedRack ? (
                  /* If Matched Rack Record */
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-emerald-950 font-mono">
                          {lastScannedResult.matchedRack.name}
                        </h4>
                        <span className="text-xs font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                          {lastScannedResult.matchedRack.zone}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-emerald-200">
                        <div>
                          <span className="text-gray-500 block">Bay Capacity:</span>
                          <span className="font-bold">{lastScannedResult.matchedRack.capacityRolls} Rolls</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Weight Cap:</span>
                          <span className="font-bold">{lastScannedResult.matchedRack.capacityKg} Kg</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Location Code:</span>
                          <span className="font-mono font-bold text-emerald-800">
                            {lastScannedResult.matchedRack.rackId}
                          </span>
                        </div>
                      </div>
                    </div>

                    {onNavigateTab && (
                      <button
                        onClick={() =>
                          onNavigateTab('rack-qr', {
                            rack: lastScannedResult.matchedRack!.name,
                          })
                        }
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye className="size-4" />
                        <span>Inspect Bay Live Stock</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600">
                    <p>Scanned code: <span className="font-mono font-bold text-gray-900">{lastScannedResult.rawCode}</span></p>
                    <p className="mt-1">No direct matching record found in active fabric receiving. You can generate tags or register this barcode.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="size-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <ScanBarcode className="size-8" />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  Ready to Scan Barcodes
                </h3>
                <p className="text-xs text-gray-500 max-w-md">
                  Aim your wireless or USB barcode scanner gun at any roll sticker, rack tag, or gate pass, or click "Scan with Camera" to decode instantly.
                </p>
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => handleProcessBarcode('GMS-SR1001-B1001-R01')}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Simulate Roll Scan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ROLL BARCODE TAG STUDIO */}
      {/* ========================================================================= */}
      {activeSubTab === 'roll-tags' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Printer className="size-5 text-emerald-700" />
                <span>Roll Barcode Tag Studio & Batch Label Printing</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Generate and print industrial Code 128 thermal adhesive roll stickers for received finished fabric rolls.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="size-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={rollSearchQuery}
                onChange={(e) => setRollSearchQuery(e.target.value)}
                placeholder="Search SR, Batch, Buyer, Color..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Batch Selector Helpers */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAllForBatch}
                className="font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
              >
                <CheckSquare className="size-4" />
                <span>Select All ({filteredFabrics.length})</span>
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={handleDeselectAllForBatch}
                className="font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
              >
                <Square className="size-4" />
                <span>Clear Selection</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-gray-500">
                {selectedFabricsForBatch.length} items selected
              </span>
              <button
                onClick={() => {
                  if (selectedFabricsForBatch.length > 0) {
                    const first = fabrics.find((f) => f.id === selectedFabricsForBatch[0]);
                    if (first) setSelectedFabricForTag(first);
                  }
                }}
                disabled={selectedFabricsForBatch.length === 0}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="size-3.5" />
                <span>Print Selected Barcode Tags</span>
              </button>
            </div>
          </div>

          {/* Inventory Table with Barcode Previews */}
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 w-10 text-center">Sel</th>
                  <th className="p-3">Store Ref / PO</th>
                  <th className="p-3">Batch No</th>
                  <th className="p-3">Buyer & Style</th>
                  <th className="p-3">Fabric Specs</th>
                  <th className="p-3">Quantity / Rolls</th>
                  <th className="p-3">Rack Bay</th>
                  <th className="p-3 text-center">Code 128 Barcode</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFabrics.map((f) => {
                  const isChecked = selectedFabricsForBatch.includes(f.id);
                  const sampleRollBarcode = generateRollBarcode(f.storeRef, f.batchNo, 1);

                  return (
                    <tr
                      key={f.id}
                      className="hover:bg-emerald-50/40 transition-colors cursor-pointer"
                      onClick={() => handleToggleSelectForBatch(f.id)}
                    >
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectForBatch(f.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-900">
                        {f.storeRef}
                      </td>
                      <td className="p-3 font-mono font-bold text-gray-800">
                        {f.batchNo}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-gray-900">{f.buyerName}</div>
                        <div className="text-[11px] text-gray-500">{f.styleName || 'N/A'}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-gray-800">{f.fabricsType}</div>
                        <div className="text-[11px] text-gray-500">
                          {f.colour} • {f.gsm} GSM
                        </div>
                      </td>
                      <td className="p-3 font-mono">
                        <div className="font-black text-gray-900">
                          {Number(f.receivedQuantity).toLocaleString()} Kg
                        </div>
                        <div className="text-[11px] text-emerald-700 font-bold">
                          {f.receivedRoll} Rolls
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-gray-700">
                        {f.location}
                      </td>
                      <td className="p-3 text-center">
                        <Barcode
                          value={sampleRollBarcode}
                          format="CODE128"
                          width={1.2}
                          height={28}
                          fontSize={9}
                          margin={1}
                        />
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedFabricForTag(f)}
                          className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Printer className="size-3" />
                          <span>Print Tags</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RACK & BAY BARCODES (CODE 128) */}
      {/* ========================================================================= */}
      {activeSubTab === 'rack-barcodes' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Layers className="size-5 text-emerald-700" />
                <span>Warehouse Rack & Bay Barcodes (Code 128 Placards)</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Print high-contrast 1D Code 128 barcode signs for warehouse shelf uprights, readable by long-range laser scanner guns from forklifts.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Printer className="size-4" />
              <span>Print All Rack Placards</span>
            </button>
          </div>

          {/* Grid of Rack Placards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {racks.map((r) => {
              const rackBarcodeVal = generateRackBarcode(r.rackId, r.location);

              return (
                <div
                  key={r.rackId}
                  className="p-5 bg-white border-2 border-slate-900 rounded-2xl shadow-xs flex flex-col items-center text-center space-y-3"
                >
                  {/* Placard Header */}
                  <div className="w-full border-b-2 border-slate-900 pb-2">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-900 block">
                      GMS MCD FINISH FABRIC WAREHOUSE
                    </span>
                    <span className="text-[9px] font-bold text-emerald-800 uppercase">
                      {r.zone}
                    </span>
                  </div>

                  {/* Rack Info */}
                  <div className="space-y-0.5">
                    <div className="text-2xl font-black font-mono text-slate-950 uppercase">
                      Rack: {r.rackId}
                    </div>
                    {r.location && (
                      <div className="text-sm font-extrabold font-mono text-emerald-800 uppercase">
                        Location: {r.location}
                      </div>
                    )}
                  </div>

                  {/* High-Resolution Code 128 Barcode */}
                  <div className="py-2 bg-white px-3 border border-gray-200 rounded-xl w-full flex justify-center">
                    <Barcode
                      value={rackBarcodeVal}
                      format="CODE128"
                      width={2}
                      height={55}
                      fontSize={13}
                      margin={4}
                      className="w-full flex justify-center"
                    />
                  </div>

                  {/* Capacity Info */}
                  <div className="w-full pt-2 border-t border-gray-200 flex justify-between text-[11px] text-gray-600 font-medium">
                    <span>Capacity: <b>{r.capacityRolls} Rolls</b></span>
                    <span>Max Weight: <b>{r.capacityKg} Kg</b></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CUSTOM BARCODE GENERATOR */}
      {/* ========================================================================= */}
      {activeSubTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Column */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-5">
            <div className="pb-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Sliders className="size-4 text-emerald-700" />
                <span>Barcode Generator Settings</span>
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Generate Code 128, Code 39, or EAN barcodes on the fly for any warehouse document.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Barcode Value / Content:
                </label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Barcode Symbology Format:
                </label>
                <select
                  value={customFormat}
                  onChange={(e) => setCustomFormat(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl font-bold text-gray-800"
                >
                  <option value="CODE128">Code 128 (Universal High-Density Industrial)</option>
                  <option value="CODE39">Code 39 (Alphanumeric)</option>
                  <option value="EAN13">EAN-13 (Retail Standard)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Bar Width ({customWidth}px):
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={4}
                    step={0.5}
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Number(e.target.value))}
                    className="w-full cursor-pointer accent-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Bar Height ({customHeight}px):
                  </label>
                  <input
                    type="range"
                    min={30}
                    max={100}
                    step={5}
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Number(e.target.value))}
                    className="w-full cursor-pointer accent-emerald-700"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="display-text-toggle"
                  checked={customDisplayText}
                  onChange={(e) => setCustomDisplayText(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="display-text-toggle" className="font-bold text-gray-700 cursor-pointer">
                  Show human-readable text under barcode
                </label>
              </div>
            </div>
          </div>

          {/* Preview & Print Column */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-xs p-6 flex flex-col items-center justify-center text-center space-y-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Live Scalable SVG Barcode Output
            </span>

            <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl max-w-md w-full flex flex-col items-center">
              <div className="text-[11px] font-black uppercase text-gray-800 mb-3 tracking-tight">
                GMS COMPOSITE KNITTING IND. LTD.
              </div>

              <Barcode
                value={customText}
                format={customFormat}
                width={customWidth}
                height={customHeight}
                displayValue={customDisplayText}
                fontSize={14}
                margin={4}
                className="w-full flex justify-center"
              />

              <div className="mt-4 text-[10px] text-gray-500 font-mono">
                Symbology: {customFormat} • Scannable on all industrial 1D & 2D barcode guns
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="size-4" />
                <span>Print Custom Label</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SHIFT BARCODE AUDIT LOG */}
      {/* ========================================================================= */}
      {activeSubTab === 'audit-log' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Clock className="size-5 text-emerald-700" />
                <span>Shift Barcode Scan Activity & Audit Trail</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Full chronological log of all barcode gun and camera scans with timestamps, detected entities, and actions.
              </p>
            </div>
            <button
              onClick={() => {
                const csvRows = [
                  ['Timestamp', 'Barcode', 'Type', 'Entity Details', 'Operator', 'Action Taken'],
                  ...scanLog.map((s) => [s.timestamp, s.code, s.type, s.entityName, s.operator, s.actionTaken]),
                ];
                const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', `barcode-scan-audit-${new Date().toISOString().slice(0, 10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="size-4" />
              <span>Export Audit CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Barcode String</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Matched Entity</th>
                  <th className="p-3">Operator</th>
                  <th className="p-3">Action Recorded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {scanLog.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-mono text-gray-500 whitespace-nowrap">{entry.timestamp}</td>
                    <td className="p-3 font-mono font-bold text-gray-900">{entry.code}</td>
                    <td className="p-3">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-emerald-400">
                        {entry.type}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-gray-800">{entry.entityName}</td>
                    <td className="p-3 text-gray-600">{entry.operator}</td>
                    <td className="p-3 font-semibold text-emerald-800">{entry.actionTaken}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Camera Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onScanSuccess={(code) => {
          setIsScannerModalOpen(false);
          handleProcessBarcode(code);
        }}
      />

      {/* Roll Barcode Tag Generator & Print Modal */}
      {selectedFabricForTag && (
        <RollBarcodeModal
          record={selectedFabricForTag}
          onClose={() => setSelectedFabricForTag(null)}
        />
      )}
    </div>
  );
};
