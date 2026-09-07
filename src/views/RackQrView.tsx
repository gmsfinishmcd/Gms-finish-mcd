import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  QrCode,
  Printer,
  Layers,
  Search,
  RefreshCw,
  CheckCircle2,
  ScanLine,
  Eye,
  Camera,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Link,
  FileCode,
  Copy,
  PlusCircle,
  Truck,
  MoveRight,
  CheckSquare,
  Square,
  Sparkles,
  Database,
  ArrowUpRight,
} from 'lucide-react';
import QRCode from 'qrcode';
import type { FabricRecord, DropdownMasterData, RackData } from '../types.js';
import { RackQrScannerModal } from '../components/RackQrScannerModal.js';
import { RackStockDetailsModal } from '../components/RackStockDetailsModal.js';
import { RackBatchPrintModal } from '../components/RackBatchPrintModal.js';

interface EnrichedRack extends RackData {
  rackNo?: string;
  location?: string;
  totalBalanceQty?: number;
  totalBalanceRolls?: number;
  distinctSRs?: number;
  distinctBatches?: number;
}

interface RackQrViewProps {
  initialRack?: string | null;
  onNavigateTab?: (tab: any, context?: any) => void;
}

export const RackQrView: React.FC<RackQrViewProps> = ({
  initialRack,
  onNavigateTab,
}) => {
  const [selectedRack, setSelectedRack] = useState<string>(initialRack || 'Rack: R-05 / Location: A-01');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrEncoding, setQrEncoding] = useState<'url' | 'json'>('url');
  const [racks, setRacks] = useState<EnrichedRack[]>([]);
  const [rackNames, setRackNames] = useState<string[]>([]);
  const [fabrics, setFabrics] = useState<FabricRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Batch Print Selection State
  const [selectedForPrint, setSelectedForPrint] = useState<string[]>([]);
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState<boolean>(false);

  // Scanner & Modal State
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [inspectedRack, setInspectedRack] = useState<string>(initialRack || 'Rack: R-05 / Location: A-01');
  const [scanNotification, setScanNotification] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Fetch initial master data and rack inventory
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [rackDataRes, fabRes] = await Promise.all([
        fetch('/api/rack-data'),
        fetch('/api/fabric-received?limit=500'),
      ]);

      const rackDataJson = await rackDataRes.json();
      const fabData = await fabRes.json();

      let loadedRacks: EnrichedRack[] = [];
      if (rackDataJson.success && Array.isArray(rackDataJson.racks)) {
        loadedRacks = rackDataJson.racks;
      } else {
        // Fallback default racks
        loadedRacks = [
          { rackId: 'R-05', rackNo: 'R-05', location: 'A-01', name: 'Rack: R-05 / Location: A-01', zone: 'Zone A (Multi-SR Bay)', capacityRolls: 100, capacityKg: 3000 },
          { rackId: 'R-01', rackNo: 'R-01', location: 'A-01', name: 'Rack A-01', zone: 'Zone A (Bay 1)', capacityRolls: 60, capacityKg: 2500 },
          { rackId: 'R-02', rackNo: 'R-02', location: 'A-02', name: 'Rack A-02', zone: 'Zone A (Bay 2)', capacityRolls: 60, capacityKg: 2500 },
          { rackId: 'R-03', rackNo: 'R-03', location: 'B-01', name: 'Rack B-01', zone: 'Zone B (Bay 1)', capacityRolls: 60, capacityKg: 2500 },
          { rackId: 'R-04', rackNo: 'R-04', location: 'B-02', name: 'Rack B-02', zone: 'Zone B (Bay 2)', capacityRolls: 60, capacityKg: 2500 },
        ];
      }

      setRacks(loadedRacks);
      const names = loadedRacks.map((r) => r.name);
      setRackNames(names);
      setFabrics(fabData.data || []);

      // Default selection to multi-SR bay R-05 if available, or first rack
      if (!initialRack) {
        const defaultR = loadedRacks.find((r) => r.rackNo === 'R-05' || r.rackId === 'R-05') || loadedRacks[0];
        if (defaultR) {
          setSelectedRack(defaultR.name);
          setInspectedRack(defaultR.name);
        }
      }
    } catch (err) {
      console.error('Failed to load rack data:', err);
    } finally {
      setLoading(false);
    }
  }, [initialRack]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle URL deep-link if initialRack is provided (automatic detection)
  useEffect(() => {
    if (initialRack) {
      setSelectedRack(initialRack);
      setInspectedRack(initialRack);
      setIsDetailsModalOpen(true);
      setScanNotification(`Automatic Detection: Opened live stock for ${initialRack}`);
      setTimeout(() => setScanNotification(null), 5000);
    }
  }, [initialRack]);

  // Active rack object
  const activeRackObj = useMemo(() => {
    return racks.find((r) => r.name === selectedRack || r.rackNo === selectedRack || r.rackId === selectedRack) || {
      rackId: 'RACK',
      rackNo: selectedRack.split('/')[0]?.replace('Rack:', '').trim() || selectedRack,
      location: selectedRack.split('/')[1]?.replace('Location:', '').trim() || '',
      name: selectedRack,
      zone: 'Finish Fabric Warehouse',
      capacityKg: 2500,
      capacityRolls: 60,
    };
  }, [racks, selectedRack]);

  // Direct Web Scan URL for mobile scanning
  const webScanUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?tab=rack-qr&rack=${encodeURIComponent(selectedRack)}`
    : `/?tab=rack-qr&rack=${encodeURIComponent(selectedRack)}`;

  // Generate QR Code whenever selected rack changes
  useEffect(() => {
    let payload = '';

    if (qrEncoding === 'url') {
      // Direct Web Link: Phone cameras open this exact bay automatically
      payload = webScanUrl;
    } else {
      // WMS barcode gun JSON format
      payload = JSON.stringify({
        rackNo: activeRackObj.rackNo || selectedRack,
        location: activeRackObj.location || '',
        name: selectedRack,
        warehouse: 'MCD Finish Fabric Warehouse',
        system: 'Warehouse Rack QR Location System',
        timestamp: new Date().toISOString(),
      });
    }

    QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      color: {
        dark: '#022c22', // deep emerald-950
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code error:', err));
  }, [selectedRack, activeRackObj, qrEncoding, webScanUrl]);

  // Handle scanned QR payload or text (Automatic Detection)
  const handleScanSuccess = (scannedText: string) => {
    setIsScannerOpen(false);

    let detectedRackName = '';

    // 1. Try URL parsing if scanned item is a web link
    try {
      if (scannedText.includes('http') || scannedText.includes('?')) {
        const urlObj = new URL(scannedText, window.location.origin);
        const rackParam = urlObj.searchParams.get('rack') || urlObj.searchParams.get('location');
        if (rackParam) {
          detectedRackName = decodeURIComponent(rackParam);
        }
      }
    } catch {
      // Not a valid URL
    }

    // 2. Try JSON parsing
    if (!detectedRackName) {
      try {
        const parsed = JSON.parse(scannedText);
        if (parsed.name) {
          detectedRackName = parsed.name;
        } else if (parsed.rackNo) {
          detectedRackName = parsed.rackNo;
        } else if (parsed.rack) {
          detectedRackName = parsed.rack;
        } else if (parsed.location) {
          detectedRackName = parsed.location;
        }
      } catch {
        // Not JSON, continue with string matching
      }
    }

    // 3. Direct string / fuzzy match
    if (!detectedRackName) {
      const cleaned = scannedText.trim();
      const directMatch = racks.find(
        (r) =>
          r.name.toLowerCase() === cleaned.toLowerCase() ||
          r.rackId.toLowerCase() === cleaned.toLowerCase() ||
          (r.rackNo && r.rackNo.toLowerCase() === cleaned.toLowerCase()) ||
          (r.location && r.location.toLowerCase() === cleaned.toLowerCase())
      );
      if (directMatch) {
        detectedRackName = directMatch.name;
      } else {
        // Check if scanned item is an MRR or Batch No in our fabric inventory
        const matchingFabric = fabrics.find(
          (f) =>
            (f.mrrNo && f.mrrNo.toLowerCase() === cleaned.toLowerCase()) ||
            (f.batchNo && f.batchNo.toLowerCase() === cleaned.toLowerCase()) ||
            (f.storeRef && f.storeRef.toLowerCase() === cleaned.toLowerCase())
        );

        if (matchingFabric && matchingFabric.location) {
          detectedRackName = matchingFabric.location;
        } else {
          detectedRackName = cleaned;
        }
      }
    }

    setSelectedRack(detectedRackName);
    setInspectedRack(detectedRackName);
    setIsDetailsModalOpen(true);

    setScanNotification(`Automatic Rack Detection: Successfully loaded ${detectedRackName}`);
    setTimeout(() => setScanNotification(null), 4500);
  };

  const handleOpenInspectModal = (rack: string) => {
    setSelectedRack(rack);
    setInspectedRack(rack);
    setIsDetailsModalOpen(true);
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(webScanUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Toggle single rack selection for batch print
  const handleToggleSelectForPrint = (rackName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForPrint((prev) =>
      prev.includes(rackName) ? prev.filter((n) => n !== rackName) : [...prev, rackName]
    );
  };

  const handleSelectAllForPrint = () => {
    setSelectedForPrint(racks.map((r) => r.name));
  };

  const handleDeselectAllForPrint = () => {
    setSelectedForPrint([]);
  };

  // Batches locally mapped
  const rackBatches = fabrics.filter((f) => f.location === selectedRack);
  const totalRackKg = activeRackObj.totalBalanceQty !== undefined
    ? activeRackObj.totalBalanceQty
    : rackBatches.reduce((s, b) => s + (Number(b.receivedQuantity) || 0), 0);
  const totalRackRolls = activeRackObj.totalBalanceRolls !== undefined
    ? activeRackObj.totalBalanceRolls
    : rackBatches.reduce((s, b) => s + (Number(b.receivedRoll) || 0), 0);

  return (
    <div className="p-4 md:p-6 max-w-[1920px] mx-auto space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <QrCode className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Warehouse Rack QR Location System
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  REAL-TIME SYNC
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1 max-w-2xl">
                Scan rack QR with mobile camera or barcode gun to automatically detect bay location, view real-time multi-SR stock balances, and batch print physical bay tags.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Main QR Scanner Button */}
          <button
            id="open-qr-scanner-btn"
            onClick={() => setIsScannerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer group"
          >
            <Camera className="size-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Scan Rack QR</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full">
              Mobile Camera / Gun
            </span>
          </button>

          {/* Batch Print Labels (Requirement #1) */}
          <button
            id="batch-print-qr-btn"
            onClick={() => {
              if (selectedForPrint.length === 0) {
                // Pre-select current rack or all
                setSelectedForPrint([selectedRack]);
              }
              setIsBatchPrintOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="size-4" />
            <span>Batch Print Labels</span>
            {selectedForPrint.length > 0 && (
              <span className="text-[10px] bg-white text-emerald-900 font-mono px-1.5 py-0.2 rounded-full font-black">
                {selectedForPrint.length}
              </span>
            )}
          </button>

          {/* Inspect Stock Details Button */}
          <button
            id="inspect-stock-details-btn"
            onClick={() => handleOpenInspectModal(selectedRack)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <Eye className="size-4 text-emerald-700" />
            <span>Inspect Live Bay Stock</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {scanNotification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-900 flex items-center justify-between gap-2 shadow-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>{scanNotification}</span>
          </div>
          <button
            onClick={() => handleOpenInspectModal(inspectedRack)}
            className="font-bold underline text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
          >
            <span>View Manifest</span>
            <ArrowUpRight className="size-3" />
          </button>
        </div>
      )}

      {/* Main 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Rack Selector with Multi-Select Checkboxes (Requirement #1) */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-gray-900">
                Warehouse Rack Locations
              </h2>
            </div>
            <span className="text-[11px] font-mono bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded-full">
              {racks.length} Locations
            </span>
          </div>

          {/* Batch Print Selection Helpers */}
          <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAllForPrint}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
              >
                <CheckSquare className="size-3.5" />
                <span>Select All</span>
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={handleDeselectAllForPrint}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
              >
                <Square className="size-3.5" />
                <span>Clear</span>
              </button>
            </div>

            <button
              onClick={() => setIsBatchPrintOpen(true)}
              disabled={selectedForPrint.length === 0}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Printer className="size-3" />
              <span>Print {selectedForPrint.length} Selected</span>
            </button>
          </div>

          {/* Racks List */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Select Rack to View or Multi-Select for Printing
            </label>
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
              {racks.map((r) => {
                const isSelected = selectedRack === r.name;
                const isCheckedForPrint = selectedForPrint.includes(r.name);
                const rackNo = r.rackNo || r.name.split('/')[0]?.replace('Rack:', '').trim() || r.name;
                const locStr = r.location || r.name.split('/')[1]?.replace('Location:', '').trim() || '';

                return (
                  <div
                    key={r.name}
                    onClick={() => setSelectedRack(r.name)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                        : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-emerald-50/40 hover:border-emerald-300'
                    }`}
                  >
                    {/* Checkbox for batch printing */}
                    <button
                      onClick={(e) => handleToggleSelectForPrint(r.name, e)}
                      className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                        isSelected
                          ? 'text-emerald-200 hover:text-white hover:bg-emerald-700'
                          : 'text-gray-400 hover:text-emerald-700 hover:bg-gray-200'
                      }`}
                      title="Select for batch printing"
                    >
                      {isCheckedForPrint ? (
                        <CheckSquare className="size-4 text-emerald-400" />
                      ) : (
                        <Square className="size-4" />
                      )}
                    </button>

                    {/* Rack and Location Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm uppercase">
                          Rack: {rackNo}
                        </span>
                        {locStr && (
                          <span
                            className={`text-xs font-mono font-bold px-1.5 py-0.2 rounded-md ${
                              isSelected
                                ? 'bg-emerald-700 text-emerald-100'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            Loc: {locStr}
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-[11px] truncate mt-0.5 ${
                          isSelected ? 'text-emerald-100' : 'text-gray-500'
                        }`}
                      >
                        {r.zone || 'Storage Zone'}
                      </div>
                    </div>

                    {/* Real-time Stock Balance Indicator */}
                    <div className="text-right shrink-0">
                      <div
                        className={`font-mono font-black text-xs ${
                          isSelected ? 'text-white' : 'text-emerald-800'
                        }`}
                      >
                        {r.totalBalanceQty !== undefined
                          ? `${r.totalBalanceQty.toLocaleString()} Kg`
                          : 'Live Stock'}
                      </div>
                      <div
                        className={`text-[10px] font-medium ${
                          isSelected ? 'text-emerald-200' : 'text-gray-500'
                        }`}
                      >
                        {r.totalBalanceRolls !== undefined ? `${r.totalBalanceRolls} rolls` : ''}
                        {r.distinctSRs ? ` • ${r.distinctSRs} SRs` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Bay Live Overview */}
          <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Selected Rack Number:</span>
              <span className="font-mono font-black text-gray-900">
                {activeRackObj.rackNo || selectedRack}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Bay Location:</span>
              <span className="font-mono font-bold text-emerald-800">
                {activeRackObj.location || 'Standard Bay'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Current Balance Stock:</span>
              <span className="font-mono font-black text-emerald-800 text-sm">
                {totalRackKg.toLocaleString()} Kg
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Current Balance Rolls:</span>
              <span className="font-bold text-gray-900">{totalRackRolls} Rolls</span>
            </div>

            <button
              onClick={() => handleOpenInspectModal(selectedRack)}
              className="w-full mt-2 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Eye className="size-4" />
              <span>Inspect Real-Time Bay Manifest</span>
            </button>
          </div>
        </div>

        {/* Center: Printable QR Tag Card with Rack Number and Location (Requirement #1) */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 flex flex-col items-center justify-center text-center">
          {/* Encoding Mode Selector */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl mb-4 text-xs font-semibold">
            <button
              onClick={() => setQrEncoding('url')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                qrEncoding === 'url'
                  ? 'bg-white text-emerald-950 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Link className="size-3.5 text-emerald-600" />
              <span>Mobile Camera Link</span>
            </button>
            <button
              onClick={() => setQrEncoding('json')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                qrEncoding === 'json'
                  ? 'bg-white text-emerald-950 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileCode className="size-3.5 text-slate-600" />
              <span>Barcode Gun JSON</span>
            </button>
          </div>

          {/* Physical Placard Preview */}
          <div className="p-6 bg-emerald-50/40 rounded-2xl border-2 border-dashed border-emerald-300 max-w-sm w-full flex flex-col items-center shadow-xs">
            <div className="w-full text-center pb-3 border-b-2 border-emerald-300 mb-3">
              <span className="text-[9px] uppercase font-black text-slate-800 tracking-wider block">
                GMS MCD FINISH FABRIC WAREHOUSE
              </span>
              <span className="text-[8px] font-bold text-emerald-800 uppercase tracking-widest">
                {activeRackObj.zone || 'Storage Zone'}
              </span>
            </div>

            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for ${selectedRack}`}
                className="w-48 h-48 rounded-xl shadow-xs bg-white p-2 border border-emerald-200 hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-48 h-48 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                Generating QR...
              </div>
            )}

            {/* Clear Rack Number & Location Display (Requirement #1) */}
            <div className="w-full text-center pt-3 border-t-2 border-emerald-300 mt-3 space-y-1">
              <h3 className="text-2xl font-black font-mono text-slate-950 uppercase tracking-tight">
                Rack: {activeRackObj.rackNo || selectedRack}
              </h3>
              <div className="text-base font-extrabold font-mono text-emerald-800 uppercase">
                Location: {activeRackObj.location || 'Bay Center'}
              </div>

              <div className="pt-2 text-[11px] text-emerald-950 font-semibold space-y-0.5">
                <div>
                  Live Balance: <b>{totalRackKg.toLocaleString()} Kg</b> ({totalRackRolls} Rolls)
                </div>
                <div className="font-mono text-[10px] text-gray-500">
                  {qrEncoding === 'url'
                    ? 'Scanning with mobile automatically opens live stock'
                    : 'Encoded for high-speed industrial barcode guns'}
                </div>
              </div>

              {/* Instant Inspect Trigger */}
              <button
                onClick={() => handleOpenInspectModal(selectedRack)}
                className="mt-3 w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ScanLine className="size-4" />
                <span>Simulate QR Scan / Open Live Stock</span>
              </button>
            </div>
          </div>

          {/* Shareable Link Box */}
          {qrEncoding === 'url' && (
            <div className="mt-4 w-full max-w-sm flex items-center gap-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded-lg p-1.5">
              <span className="font-mono text-gray-500 truncate flex-1 text-left px-1">
                {webScanUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-2 py-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded text-[10px] font-bold shrink-0 cursor-pointer flex items-center gap-1"
                title="Copy Direct URL"
              >
                <Copy className="size-3" />
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Real-time Multi-SR Preview */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Real-Time Stock Breakdown
              </h2>
              <p className="text-[11px] text-gray-500 font-mono">
                {activeRackObj.rackNo} / {activeRackObj.location}
              </p>
            </div>
            <button
              onClick={() => handleOpenInspectModal(selectedRack)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Modal</span>
              <ArrowUpRight className="size-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[440px] pr-1 scrollbar-thin flex-1">
            {rackBatches.length === 0 ? (
              <div className="text-center py-16 text-xs text-gray-400">
                <p>No active fabric batches recorded in this bay.</p>
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="mt-3 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Camera className="size-3.5" />
                  <span>Scan Physical Tag</span>
                </button>
              </div>
            ) : (
              rackBatches.map((b) => (
                <div
                  key={b.id}
                  className="p-3 bg-gray-50 hover:bg-emerald-50/50 rounded-xl border border-gray-200 hover:border-emerald-300 text-xs space-y-1 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-emerald-900">{b.storeRef}</span>
                    <span className="font-mono text-gray-500 font-semibold">{b.batchNo}</span>
                  </div>
                  <div className="font-semibold text-gray-800">
                    {b.buyerName} {b.styleName ? `• ${b.styleName}` : ''}
                  </div>
                  <div className="text-gray-500 text-[11px]">
                    {b.fabricsType} ({b.colour}) {b.gsm ? `• ${b.gsm} GSM` : ''}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-gray-200 text-[11px]">
                    <span className="font-bold text-emerald-800">
                      {Number(b.receivedQuantity).toLocaleString()} Kg
                    </span>
                    <span className="font-semibold text-gray-700">{b.receivedRoll} Rolls</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* QR Code Scanner Modal (Live Camera / Gun / Upload) */}
      <RackQrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        availableRacks={rackNames}
      />

      {/* Batch Print Modal for Multiple Selected Racks (Requirement #1) */}
      <RackBatchPrintModal
        isOpen={isBatchPrintOpen}
        onClose={() => setIsBatchPrintOpen(false)}
        racks={racks}
        selectedRackNames={selectedForPrint.length > 0 ? selectedForPrint : [selectedRack]}
        onToggleRack={(name) => {
          setSelectedForPrint((prev) =>
            prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
          );
        }}
        onSelectAll={handleSelectAllForPrint}
        onDeselectAll={handleDeselectAllForPrint}
      />

      {/* Warehouse Stock Details & Real-Time Rack Capacity Modal (Full WMS Functionality) */}
      <RackStockDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        rackId={inspectedRack}
        allRacks={rackNames}
        fabrics={fabrics}
        onRefreshFabrics={fetchData}
        onNavigateTab={onNavigateTab}
        onOpenScanner={() => {
          setIsDetailsModalOpen(false);
          setIsScannerOpen(true);
        }}
      />
    </div>
  );
};
