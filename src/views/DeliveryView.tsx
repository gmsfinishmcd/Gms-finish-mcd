import React, { useState } from 'react';
import {
  Truck,
  History,
  Search,
  RotateCcw,
  Printer,
  Download,
  CheckCircle2,
  Package,
  Layers,
  Loader2,
  AlertTriangle,
  Clock,
  AlertCircle,
  Barcode as BarcodeIcon,
  Camera,
  Zap,
} from 'lucide-react';
import type { DeliveryRecord, FabricRecord, DropdownMasterData, OrderTransferRecord } from '../types.js';
import { Barcode } from '../components/Barcode.js';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal.js';
import { parseBarcode } from '../lib/barcodeUtils.js';

export const DeliveryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'delivery' | 'history'>('delivery');
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState<boolean>(false);
  const [scannedBarcodeMsg, setScannedBarcodeMsg] = useState<string | null>(null);

  // Delivery Entry (Stock Items) State
  const [stockItems, setStockItems] = useState<FabricRecord[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<OrderTransferRecord[]>([]);
  const [dropdowns, setDropdowns] = useState<DropdownMasterData | null>(null);
  const [loadingStock, setLoadingStock] = useState<boolean>(false);
  const [hasLoadedStock, setHasLoadedStock] = useState<boolean>(false);

  // Filters for Stock
  const [stockStoreRef, setStockStoreRef] = useState<string>('');
  const [stockMrrNo, setStockMrrNo] = useState<string>('');
  const [stockBatchNo, setStockBatchNo] = useState<string>('');

  // Delivery History State
  const [historyItems, setHistoryItems] = useState<DeliveryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState<boolean>(false);

  // Filters for History
  const [histStoreRef, setHistStoreRef] = useState<string>('');
  const [histColour, setHistColour] = useState<string>('');
  const [histBatchNo, setHistBatchNo] = useState<string>('');

  // Modal State for Issuing Delivery
  const [selectedStock, setSelectedStock] = useState<FabricRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedChallan, setSelectedChallan] = useState<DeliveryRecord | null>(null);

  // Delivery form state
  const [deliveryForm, setDeliveryForm] = useState({
    deliveryQuantity: '',
    deliveryRoll: '',
    deliveryLocation: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveredBy: 'Warehouse Dispatcher Kamal',
    deliveryRemarks: ''
  });

  // Fetch dropdowns on demand
  const ensureDropdowns = async () => {
    if (!dropdowns) {
      try {
        const dropRes = await fetch('/api/settings/dropdown-data');
        const dropData = await dropRes.json();
        setDropdowns(dropData);
      } catch (e) {
        console.error('Failed to load dropdowns', e);
      }
    }
  };

  // Show Stock Items (Delivery Entry)
  const handleShowStock = async () => {
    try {
      setLoadingStock(true);
      await ensureDropdowns();

      const [fabRes, delRes, pendRes] = await Promise.all([
        fetch('/api/fabric-received?limit=1000'),
        fetch('/api/fabric-delivery'),
        fetch('/api/order-transfer?mode=pending')
      ]);

      const [fabData, delData, pendData] = await Promise.all([
        fabRes.json(),
        delRes.json(),
        pendRes.ok ? pendRes.json() : { data: [] }
      ]);

      setStockItems(fabData.data || []);
      setDeliveries(delData.data || []);
      setPendingTransfers(pendData.data || []);
      setHasLoadedStock(true);
    } catch (err) {
      console.error('Error loading stock items:', err);
    } finally {
      setLoadingStock(false);
    }
  };

  const handleBarcodeScan = async (scannedCode: string) => {
    const parsed = parseBarcode(scannedCode);
    const identifier = parsed.identifier.toLowerCase();

    let items = stockItems;
    if (items.length === 0) {
      setLoadingStock(true);
      try {
        await ensureDropdowns();
        const [fabRes, delRes, pendRes] = await Promise.all([
          fetch('/api/fabric-received?limit=1000'),
          fetch('/api/fabric-delivery'),
          fetch('/api/order-transfer?mode=pending')
        ]);
        const [fabData, delData, pendData] = await Promise.all([
          fabRes.json(),
          delRes.json(),
          pendRes.ok ? pendRes.json() : { data: [] }
        ]);
        items = fabData.data || [];
        setStockItems(items);
        setDeliveries(delData.data || []);
        setPendingTransfers(pendData.data || []);
        setHasLoadedStock(true);
      } catch (e) {
        console.error('Barcode fetch error:', e);
      } finally {
        setLoadingStock(false);
      }
    }

    const matched = items.find(
      (s) =>
        s.storeRef.toLowerCase() === identifier ||
        s.batchNo.toLowerCase() === identifier ||
        (s.mrrNo && s.mrrNo.toLowerCase() === identifier) ||
        scannedCode.toLowerCase().includes(s.storeRef.toLowerCase()) ||
        scannedCode.toLowerCase().includes(s.batchNo.toLowerCase())
    );

    if (matched) {
      setStockStoreRef(matched.storeRef);
      setScannedBarcodeMsg(`Barcode matched: ${matched.storeRef} (Batch: ${matched.batchNo})`);
      setTimeout(() => setScannedBarcodeMsg(null), 5000);
      handleOpenDelivery(matched);
    } else {
      setScannedBarcodeMsg(`Scanned: "${scannedCode}". No exact fabric stock record matched.`);
      setTimeout(() => setScannedBarcodeMsg(null), 5000);
    }
  };

  const handleClearStockFilter = () => {
    setStockStoreRef('');
    setStockMrrNo('');
    setStockBatchNo('');
    setStockItems([]);
    setPendingTransfers([]);
    setHasLoadedStock(false);
  };

  // Show Delivery History
  const handleShowHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch('/api/fabric-delivery');
      const data = await res.json();
      setHistoryItems(data.data || []);
      setHasLoadedHistory(true);
    } catch (err) {
      console.error('Error loading delivery history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleClearHistoryFilter = () => {
    setHistStoreRef('');
    setHistColour('');
    setHistBatchNo('');
    setHistoryItems([]);
    setHasLoadedHistory(false);
  };

  // Compute remaining stock and pending hold for an item
  const getRemainingStock = (stock: FabricRecord) => {
    const totalDeliveredForBatch = deliveries
      .filter((d) => d.mrrNo === stock.mrrNo || (d.storeRef === stock.storeRef && d.batchNo === stock.batchNo))
      .reduce((sum, d) => sum + d.deliveryQuantity, 0);

    const totalDeliveredRolls = deliveries
      .filter((d) => d.mrrNo === stock.mrrNo || (d.storeRef === stock.storeRef && d.batchNo === stock.batchNo))
      .reduce((sum, d) => sum + d.deliveryRoll, 0);

    const remKg = Math.max(0, stock.receivedQuantity - totalDeliveredForBatch);
    const remRoll = Math.max(0, stock.receivedRoll - totalDeliveredRolls);

    // Find pending transfers for this stock item
    const pendingItems = pendingTransfers.filter(
      (t) =>
        t.status === 'PENDING' &&
        ((t.sourceMrrNo && t.sourceMrrNo === stock.mrrNo) ||
          (t.sourceStoreRef && t.sourceStoreRef === stock.storeRef && t.sourceBatchNo === stock.batchNo) ||
          t.sourceRecordId === stock.id)
    );

    const pendingKg = pendingItems.reduce(
      (sum, t) => sum + (Number(t.pendingQty ?? t.transferQty) || 0),
      0
    );
    const pendingRolls = pendingItems.reduce(
      (sum, t) => sum + (Number(t.pendingRoll ?? t.transferRoll) || 0),
      0
    );

    const deliverableKg = Math.max(0, remKg - pendingKg);
    const deliverableRoll = Math.max(0, remRoll - pendingRolls);

    return {
      remKg,
      remRoll,
      totalDeliveredForBatch,
      totalDeliveredRolls,
      pendingItems,
      pendingKg,
      pendingRolls,
      deliverableKg,
      deliverableRoll
    };
  };

  const handleOpenDelivery = (item: FabricRecord) => {
    const { deliverableKg, deliverableRoll } = getRemainingStock(item);
    setSelectedStock(item);
    setDeliveryForm({
      deliveryQuantity: String(Math.min(500, deliverableKg)),
      deliveryRoll: String(Math.min(15, deliverableRoll)),
      deliveryLocation: item.personOfCutting || (dropdowns?.personOfCutting?.[0] ?? 'Cutting Line 1'),
      deliveryDate: new Date().toISOString().split('T')[0],
      deliveredBy: 'Warehouse Dispatcher Kamal',
      deliveryRemarks: 'Issued for cutting schedule'
    });
    setIsModalOpen(true);
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;

    const { remKg, pendingKg, deliverableKg } = getRemainingStock(selectedStock);
    const delKg = parseFloat(deliveryForm.deliveryQuantity) || 0;
    const delRoll = parseInt(deliveryForm.deliveryRoll) || 0;

    if (delKg <= 0) {
      alert('Invalid Delivery Quantity. Must be greater than 0.');
      return;
    }

    if (delKg > deliverableKg) {
      if (pendingKg > 0) {
        alert(
          `ডেলিভারি অনুমোদিত নয়! এই স্টকের ${pendingKg} KG বর্তমানে Order Transfer-এ Pending (Hold) রয়েছে।\n` +
          `সর্বোচ্চ সরাসরি ডেলিভারিযোগ্য স্টক: ${deliverableKg} KG।\n` +
          `Pending Order ডেলিভারি দিতে হলে প্রথমে Order Transfer অপশন থেকে Release/Confirm করুন।`
        );
      } else {
        alert(`Invalid Delivery Quantity. Max available in hand is ${remKg} Kg.`);
      }
      return;
    }

    try {
      const payload = {
        storeRef: selectedStock.storeRef,
        buyerName: selectedStock.buyerName,
        styleName: selectedStock.styleName,
        colour: selectedStock.colour,
        fabricsType: selectedStock.fabricsType,
        batchNo: selectedStock.batchNo,
        mrrNo: selectedStock.mrrNo,
        deliveryQuantity: delKg,
        deliveryRoll: delRoll,
        deliveryLocation: deliveryForm.deliveryLocation,
        deliveryDate: deliveryForm.deliveryDate,
        deliveredBy: deliveryForm.deliveredBy,
        deliveryRemarks: deliveryForm.deliveryRemarks
      };

      const res = await fetch('/api/fabric-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create delivery challan');

      const saved = await res.json();
      setIsModalOpen(false);
      setSuccessMsg(`Challan ${saved.deliveryNo} created successfully! Dispatched ${delKg} Kg.`);

      // Refresh stock view
      await handleShowStock();

      // Show print preview
      setSelectedChallan(saved);

      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err) {
      console.error('Delivery failed:', err);
      alert('Failed to save delivery. Please try again.');
    }
  };

  // Filtered lists
  const filteredStock = stockItems.filter((s) => {
    const sRef = stockStoreRef.trim().toLowerCase();
    const sMrr = stockMrrNo.trim().toLowerCase();
    const sBatch = stockBatchNo.trim().toLowerCase();

    if (sRef && !s.storeRef.toLowerCase().includes(sRef)) return false;
    if (sMrr && !s.mrrNo.toLowerCase().includes(sMrr)) return false;
    if (sBatch && !s.batchNo.toLowerCase().includes(sBatch)) return false;
    return true;
  });

  const filteredHistory = historyItems.filter((d) => {
    const sRef = histStoreRef.trim().toLowerCase();
    const sCol = histColour.trim().toLowerCase();
    const sBatch = histBatchNo.trim().toLowerCase();

    if (sRef && !d.storeRef.toLowerCase().includes(sRef)) return false;
    if (sCol && !d.colour.toLowerCase().includes(sCol)) return false;
    if (sBatch && !d.batchNo.toLowerCase().includes(sBatch)) return false;
    return true;
  });

  // Export Stock Excel / CSV
  const exportStockCSV = () => {
    if (!hasLoadedStock || filteredStock.length === 0) return;
    const headers = [
      'MRR No',
      'Store Ref',
      'Colour',
      'Batch No',
      'Buyer Name',
      'Style Name',
      'Fabric Type',
      'GSM',
      'Composition',
      'Received Qty (KG)',
      'Received Roll',
      'Total Delivered (KG)',
      'Total Delivered (Roll)',
      'Stock in Hand (KG)',
      'Roll in Hand',
      'Location'
    ];

    const rows = filteredStock.map((s) => {
      const { remKg, remRoll, totalDeliveredForBatch, totalDeliveredRolls } = getRemainingStock(s);
      return [
        s.mrrNo,
        s.storeRef,
        `"${s.colour}"`,
        `"${s.batchNo}"`,
        `"${s.buyerName}"`,
        `"${s.styleName}"`,
        `"${s.fabricsType}"`,
        s.gsm,
        `"${s.composition || ''}"`,
        s.receivedQuantity,
        s.receivedRoll,
        totalDeliveredForBatch,
        totalDeliveredRolls,
        remKg,
        remRoll,
        `"${s.personOfCutting || ''}"`
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Stock_Summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export History Excel / CSV
  const exportHistoryCSV = () => {
    if (!hasLoadedHistory || filteredHistory.length === 0) return;
    const headers = [
      'Delivery No',
      'MRR No',
      'Store Ref',
      'Colour',
      'Batch No',
      'Buyer Name',
      'Style Name',
      'Fabric Type',
      'Delivery Qty (KG)',
      'Delivery Roll',
      'Cutting Unit',
      'Delivery Date',
      'Delivered By'
    ];

    const rows = filteredHistory.map((d) => [
      d.deliveryNo,
      d.mrrNo || '',
      d.storeRef,
      `"${d.colour}"`,
      `"${d.batchNo}"`,
      `"${d.buyerName}"`,
      `"${d.styleName}"`,
      `"${d.fabricsType}"`,
      d.deliveryQuantity,
      d.deliveryRoll,
      `"${d.deliveryLocation}"`,
      d.deliveryDate,
      `"${d.deliveredBy}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Delivery_History_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-6 max-w-[1920px] mx-auto space-y-4">
      {/* Tab Navigation Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('delivery')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs ${
            activeTab === 'delivery'
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
          }`}
        >
          <Truck className="size-4" />
          <span>Delivery Entry</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs ${
            activeTab === 'history'
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
          }`}
        >
          <History className="size-4" />
          <span>Delivery History</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {scannedBarcodeMsg && (
        <div className="p-3 bg-slate-900 border border-emerald-500 rounded-lg text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <BarcodeIcon className="size-4 text-emerald-400" />
          <span>{scannedBarcodeMsg}</span>
        </div>
      )}

      {/* TAB 1: DELIVERY ENTRY (STOCK ITEMS) */}
      {activeTab === 'delivery' && (
        <div className="space-y-4">
          {/* Filters Card */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Search className="size-4 text-gray-500" />
              <span className="text-sm font-bold text-gray-700">Received Items Filters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Store Reference</label>
                <input
                  type="text"
                  value={stockStoreRef}
                  onChange={(e) => setStockStoreRef(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleShowStock()}
                  placeholder="Store Ref"
                  className="w-full h-8 px-3 text-xs bg-gray-50 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">MRR No</label>
                <input
                  type="text"
                  value={stockMrrNo}
                  onChange={(e) => setStockMrrNo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleShowStock()}
                  placeholder="MRR No"
                  className="w-full h-8 px-3 text-xs bg-gray-50 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Batch No</label>
                <input
                  type="text"
                  value={stockBatchNo}
                  onChange={(e) => setStockBatchNo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleShowStock()}
                  placeholder="Batch No"
                  className="w-full h-8 px-3 text-xs bg-gray-50 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleShowStock}
                disabled={loadingStock}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white gap-1.5 h-8 px-4 rounded-lg text-xs font-bold inline-flex items-center transition-colors cursor-pointer shadow-2xs"
              >
                {loadingStock ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Search className="size-3.5" />
                )}
                <span>Show</span>
              </button>

              <button
                type="button"
                onClick={handleClearStockFilter}
                className="h-8 px-3 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                <span>Clear</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBarcodeModalOpen(true)}
                className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <BarcodeIcon className="size-3.5 text-emerald-400" />
                <span>Scan Barcode / Gun</span>
              </button>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Package className="size-4 text-emerald-600" />
                <span className="text-sm font-bold text-gray-800">Received Items (Ready for Delivery)</span>
                {hasLoadedStock && (
                  <span className="text-xs text-gray-500 font-normal">
                    • Total: {filteredStock.length} items
                  </span>
                )}
              </div>

              <button
                onClick={exportStockCSV}
                disabled={!hasLoadedStock || filteredStock.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 text-gray-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Download className="size-3.5" />
                <span>Export Excel</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-[550px]">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px] tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">MRR No</th>
                    <th className="py-2.5 px-3">Store Ref</th>
                    <th className="py-2.5 px-3">Colour</th>
                    <th className="py-2.5 px-3">Batch No</th>
                    <th className="py-2.5 px-3">Buyer Name</th>
                    <th className="py-2.5 px-3">Style Name</th>
                    <th className="py-2.5 px-3">Fabric Type</th>
                    <th className="py-2.5 px-3">GSM</th>
                    <th className="py-2.5 px-3">Composition</th>
                    <th className="py-2.5 px-3 text-right">Received Qty (KG)</th>
                    <th className="py-2.5 px-3 text-right">Received Roll</th>
                    <th className="py-2.5 px-3 text-right">Total Delivered (KG)</th>
                    <th className="py-2.5 px-3 text-right">Total Delivered (Roll)</th>
                    <th className="py-2.5 px-3 text-right">Stock in Hand (KG)</th>
                    <th className="py-2.5 px-3 text-right">Roll in Hand</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {!hasLoadedStock ? (
                    <tr>
                      <td colSpan={16} className="py-12 text-center text-gray-400 text-sm">
                        Enter filters and click <strong className="text-gray-700 font-bold mx-1">Show</strong> to find received items.
                      </td>
                    </tr>
                  ) : loadingStock ? (
                    <tr>
                      <td colSpan={16} className="py-12 text-center text-gray-400">
                        <Loader2 className="size-5 animate-spin inline mr-2 text-emerald-600" />
                        Loading received stock...
                      </td>
                    </tr>
                  ) : filteredStock.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="py-12 text-center text-gray-400 text-sm">
                        No received stock found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredStock.map((s) => {
                      const { remKg, remRoll, totalDeliveredForBatch, totalDeliveredRolls, pendingKg, deliverableKg } = getRemainingStock(s);
                      const isOutOfStock = remKg <= 0;
                      const isAllOnHold = remKg > 0 && deliverableKg <= 0;

                      return (
                        <tr
                          key={s.id}
                          className={`hover:bg-gray-50/80 transition-colors ${
                            isOutOfStock ? 'opacity-50 bg-gray-50' : ''
                          }`}
                        >
                          <td className="py-2 px-3 font-mono text-gray-500">{s.mrrNo}</td>
                          <td className="py-2 px-3 font-bold text-gray-900">{s.storeRef}</td>
                          <td className="py-2 px-3">{s.colour}</td>
                          <td className="py-2 px-3 font-mono font-medium">{s.batchNo}</td>
                          <td className="py-2 px-3">{s.buyerName}</td>
                          <td className="py-2 px-3 text-gray-600 max-w-[130px] truncate" title={s.styleName}>
                            {s.styleName}
                          </td>
                          <td className="py-2 px-3 text-gray-600">{s.fabricsType}</td>
                          <td className="py-2 px-3 font-mono">{s.gsm}</td>
                          <td className="py-2 px-3 text-gray-500">{s.composition || '100% Cotton'}</td>
                          <td className="py-2 px-3 text-right font-semibold text-gray-800">
                            {s.receivedQuantity} Kg
                          </td>
                          <td className="py-2 px-3 text-right text-gray-600">{s.receivedRoll}</td>
                          <td className="py-2 px-3 text-right text-purple-700 font-semibold">
                            {totalDeliveredForBatch} Kg
                          </td>
                          <td className="py-2 px-3 text-right text-purple-700">{totalDeliveredRolls}</td>
                          <td className="py-2 px-3 text-right">
                            <div className="font-extrabold text-emerald-800">{remKg} Kg</div>
                            {pendingKg > 0 && (
                              <div className="text-[10px] text-amber-700 font-bold flex items-center justify-end gap-1 mt-0.5" title={`Pending Hold: ${pendingKg} Kg`}>
                                <Clock className="size-2.5 text-amber-600 shrink-0" />
                                <span>Hold: {pendingKg} Kg</span>
                              </div>
                            )}
                            {pendingKg > 0 && (
                              <div className="text-[10px] text-teal-700 font-semibold">
                                Avail: {deliverableKg} Kg
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-700">
                            {remRoll}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              disabled={isOutOfStock || isAllOnHold}
                              onClick={() => handleOpenDelivery(s)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-white font-semibold text-[11px] shadow-2xs transition-colors cursor-pointer ${
                                isAllOnHold
                                  ? 'bg-amber-600 hover:bg-amber-700 disabled:opacity-70 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed'
                              }`}
                              title={isAllOnHold ? 'All stock is on Hold in Order Transfer. Must release before delivery.' : undefined}
                            >
                              <Truck className="size-3" />
                              <span>{isAllOnHold ? 'On Hold' : 'Deliver'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DELIVERY HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filters Card */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Search className="size-4 text-gray-500" />
              <span className="text-sm font-bold text-gray-700">Delivery History Filters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Store Reference</label>
                <input
                  type="text"
                  value={histStoreRef}
                  onChange={(e) => setHistStoreRef(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleShowHistory()}
                  placeholder="Store Ref"
                  className="w-full h-8 px-3 text-xs bg-gray-50 border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Colour</label>
                <input
                  type="text"
                  value={histColour}
                  onChange={(e) => setHistColour(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleShowHistory()}
                  placeholder="Colour"
                  className="w-full h-8 px-3 text-xs bg-gray-50 border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Batch No</label>
                <input
                  type="text"
                  value={histBatchNo}
                  onChange={(e) => setHistBatchNo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleShowHistory()}
                  placeholder="Batch No"
                  className="w-full h-8 px-3 text-xs bg-gray-50 border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleShowHistory}
                disabled={loadingHistory}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white gap-1.5 h-8 px-4 rounded-lg text-xs font-bold inline-flex items-center transition-colors cursor-pointer shadow-2xs"
              >
                {loadingHistory ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Search className="size-3.5" />
                )}
                <span>Show</span>
              </button>

              <button
                type="button"
                onClick={handleClearHistoryFilter}
                className="h-8 px-3 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-purple-600" />
                <span className="text-sm font-bold text-gray-800">Issued Delivery Challans & History</span>
                {hasLoadedHistory && (
                  <span className="text-xs text-gray-500 font-normal">
                    • Total: {filteredHistory.length} deliveries
                  </span>
                )}
              </div>

              <button
                onClick={exportHistoryCSV}
                disabled={!hasLoadedHistory || filteredHistory.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 text-gray-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Download className="size-3.5" />
                <span>Export Excel</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-[550px]">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200 uppercase text-[10px] tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Delivery No</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Store Ref</th>
                    <th className="py-2.5 px-3">Colour</th>
                    <th className="py-2.5 px-3">Batch No</th>
                    <th className="py-2.5 px-3">Buyer Name</th>
                    <th className="py-2.5 px-3">Style Name</th>
                    <th className="py-2.5 px-3">Fabric Type</th>
                    <th className="py-2.5 px-3 text-right">Delivered (Kg)</th>
                    <th className="py-2.5 px-3 text-right">Delivered Rolls</th>
                    <th className="py-2.5 px-3">Cutting Person / Unit</th>
                    <th className="py-2.5 px-3">Delivered By</th>
                    <th className="py-2.5 px-3 text-center">Print</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {!hasLoadedHistory ? (
                    <tr>
                      <td colSpan={13} className="py-12 text-center text-gray-400 text-sm">
                        Click <strong className="text-gray-700 font-bold mx-1">Show</strong> to load delivery history.
                      </td>
                    </tr>
                  ) : loadingHistory ? (
                    <tr>
                      <td colSpan={13} className="py-12 text-center text-gray-400">
                        <Loader2 className="size-5 animate-spin inline mr-2 text-purple-600" />
                        Loading delivery history...
                      </td>
                    </tr>
                  ) : filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-12 text-center text-gray-400 text-sm">
                        No delivery records found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-emerald-800">{d.deliveryNo}</td>
                        <td className="py-2 px-3 text-gray-500">{d.deliveryDate}</td>
                        <td className="py-2 px-3 font-bold text-gray-900">{d.storeRef}</td>
                        <td className="py-2 px-3 font-medium">{d.colour}</td>
                        <td className="py-2 px-3 font-mono">{d.batchNo}</td>
                        <td className="py-2 px-3">{d.buyerName}</td>
                        <td className="py-2 px-3 text-gray-600 truncate max-w-[130px]" title={d.styleName}>
                          {d.styleName}
                        </td>
                        <td className="py-2 px-3 text-gray-600">{d.fabricsType}</td>
                        <td className="py-2 px-3 text-right font-extrabold text-gray-900">
                          {d.deliveryQuantity} Kg
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-700">
                          {d.deliveryRoll} Rolls
                        </td>
                        <td className="py-2 px-3 font-medium text-gray-800">{d.deliveryLocation}</td>
                        <td className="py-2 px-3 text-gray-500">{d.deliveredBy}</td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => setSelectedChallan(d)}
                            title="Print Delivery Challan"
                            className="p-1 rounded text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                          >
                            <Printer className="size-4" />
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
      )}

      {/* Deliver to Cutting Modal */}
      {isModalOpen && selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-gray-300">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Issue Fabric to Cutting</h3>
                <p className="text-xs text-gray-500">Create new delivery challan from warehouse stock</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Store Ref / Buyer:</span>
                <span className="font-bold text-gray-800">
                  {selectedStock.storeRef} • {selectedStock.buyerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Batch / Fabric:</span>
                <span className="font-semibold text-gray-800">
                  {selectedStock.batchNo} ({selectedStock.fabricsType} - {selectedStock.colour})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Physical Stock in Hand:</span>
                <span className="font-bold text-gray-800">
                  {getRemainingStock(selectedStock).remKg} Kg ({getRemainingStock(selectedStock).remRoll} Rolls)
                </span>
              </div>
              {getRemainingStock(selectedStock).pendingKg > 0 && (
                <div className="flex justify-between text-amber-700 font-semibold pt-0.5">
                  <span>Order Transfer Hold:</span>
                  <span>{getRemainingStock(selectedStock).pendingKg} Kg</span>
                </div>
              )}
              <div className="flex justify-between text-emerald-800 font-bold border-t border-gray-200 pt-1">
                <span>Deliverable Stock (Max):</span>
                <span>{getRemainingStock(selectedStock).deliverableKg} Kg</span>
              </div>
            </div>

            {getRemainingStock(selectedStock).pendingKg > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs space-y-1 text-amber-950">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                  <span>Pending Order Transfer Alert (Hold)</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  এই স্টকের <strong>{getRemainingStock(selectedStock).pendingKg} KG</strong> বর্তমানে Order Transfer-এ <strong>Pending / Hold</strong> অবস্থায় রয়েছে।
                  <br />
                  <strong>নিয়ম:</strong> Pending অবস্থায় থাকা Quantity থেকে সরাসরি Delivery দেওয়া যাবে না। সর্বোচ্চ সরাসরি ডেলিভারি দেওয়া যাবে <strong>{getRemainingStock(selectedStock).deliverableKg} KG</strong>।
                  <br />
                  Pending Order ডেলিভারি দিতে হলে প্রথমে <strong>Order Transfer</strong> অপশন থেকে <strong>Release / Confirm</strong> করতে হবে।
                </p>
              </div>
            )}

            <form onSubmit={handleCreateDelivery} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="delivery-qty-input" className="block text-xs font-semibold text-gray-700 mb-1">
                    Delivery Qty (Kg) *
                  </label>
                  <input
                    id="delivery-qty-input"
                    type="number"
                    value={deliveryForm.deliveryQuantity}
                    onChange={(e) =>
                      setDeliveryForm({ ...deliveryForm, deliveryQuantity: e.target.value })
                    }
                    required
                    className="w-full text-xs font-bold px-2.5 py-2 rounded border border-gray-300 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="delivery-roll-input" className="block text-xs font-semibold text-gray-700 mb-1">
                    Delivery Rolls *
                  </label>
                  <input
                    id="delivery-roll-input"
                    type="number"
                    value={deliveryForm.deliveryRoll}
                    onChange={(e) =>
                      setDeliveryForm({ ...deliveryForm, deliveryRoll: e.target.value })
                    }
                    required
                    className="w-full text-xs font-bold px-2.5 py-2 rounded border border-gray-300 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="delivery-location-select" className="block text-xs font-semibold text-gray-700 mb-1">
                  Cutting Person / Unit *
                </label>
                <select
                  id="delivery-location-select"
                  value={deliveryForm.deliveryLocation}
                  onChange={(e) =>
                    setDeliveryForm({ ...deliveryForm, deliveryLocation: e.target.value })
                  }
                  className="w-full text-xs px-2.5 py-2 rounded border border-gray-300 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  {dropdowns?.personOfCutting?.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="delivery-date-input" className="block text-xs font-semibold text-gray-700 mb-1">
                    Delivery Date
                  </label>
                  <input
                    id="delivery-date-input"
                    type="date"
                    value={deliveryForm.deliveryDate}
                    onChange={(e) =>
                      setDeliveryForm({ ...deliveryForm, deliveryDate: e.target.value })
                    }
                    className="w-full text-xs px-2.5 py-2 rounded border border-gray-300 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="delivery-by-input" className="block text-xs font-semibold text-gray-700 mb-1">
                    Delivered By
                  </label>
                  <input
                    id="delivery-by-input"
                    type="text"
                    value={deliveryForm.deliveredBy}
                    onChange={(e) =>
                      setDeliveryForm({ ...deliveryForm, deliveredBy: e.target.value })
                    }
                    className="w-full text-xs px-2.5 py-2 rounded border border-gray-300 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="delivery-remarks-input" className="block text-xs font-semibold text-gray-700 mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  id="delivery-remarks-input"
                  rows={2}
                  value={deliveryForm.deliveryRemarks}
                  onChange={(e) =>
                    setDeliveryForm({ ...deliveryForm, deliveryRemarks: e.target.value })
                  }
                  className="w-full text-xs px-2.5 py-2 rounded border border-gray-300 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="border-t pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirm & Issue Challan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Challan Modal */}
      {selectedChallan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 border border-gray-300">
            <div className="text-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">
                GMS COMPOSITE KNITTING IND. LTD.
              </h3>
              <p className="text-xs text-gray-500">Finish Fabric Warehouse Delivery Challan & Gate Pass</p>
              <div className="mt-2 inline-block font-mono text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded">
                CHALLAN NO: {selectedChallan.deliveryNo}
              </div>
              <div className="mt-2 flex justify-center">
                <Barcode
                  value={selectedChallan.deliveryNo}
                  format="CODE128"
                  width={1.6}
                  height={38}
                  fontSize={11}
                  margin={1}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-lg">
              <div>
                <span className="text-gray-400 block text-[10px]">DELIVERY DATE</span>
                <span className="font-bold text-gray-800">{selectedChallan.deliveryDate}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">STORE REF</span>
                <span className="font-bold text-gray-800">{selectedChallan.storeRef}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">BUYER / STYLE</span>
                <span className="font-semibold text-gray-800">
                  {selectedChallan.buyerName} ({selectedChallan.styleName})
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">BATCH NO</span>
                <span className="font-mono font-bold text-gray-800">{selectedChallan.batchNo}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">DELIVERED QUANTITY</span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  {selectedChallan.deliveryQuantity} Kg
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">ROLL COUNT</span>
                <span className="font-bold text-gray-800">{selectedChallan.deliveryRoll} Rolls</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">DELIVERY DESTINATION</span>
                <span className="font-medium text-gray-800">{selectedChallan.deliveryLocation}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">DISPATCHED BY</span>
                <span className="font-medium text-gray-800">{selectedChallan.deliveredBy}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3 text-xs text-gray-500">
              <span>Authorized Store Signature: ______________</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium cursor-pointer"
                >
                  Print Gate Pass
                </button>
                <button
                  onClick={() => setSelectedChallan(null)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universal Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        onScanSuccess={(scanned) => {
          setIsBarcodeModalOpen(false);
          handleBarcodeScan(scanned);
        }}
        title="Delivery Barcode Scanner"
        subtitle="Scan fabric roll sticker, batch code, or store ref to dispatch"
      />
    </div>
  );
};
