import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  ArrowRight,
  ArrowLeft,
  Save,
  History,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Truck,
  RotateCcw,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';
import type { OrderTransferRecord } from '../types.js';

interface MatchingOrder {
  id: string;
  mrrNo: string;
  storeRef: string;
  buyerName: string;
  styleName: string;
  colour: string;
  batchNo: string;
  fabricsType: string;
  gsm: string;
  composition: string;
  location: string;
  receivedQuantity: number;
  receivedRoll: number;
  totalDeliveredQty: number;
  stockInHand: number;
  rollInHand: number;
  row?: string;
  pendingTransferQty?: number;
  pendingTransferRoll?: number;
  deliverableStock?: number;
}

interface TransferHistoryItem {
  id: string;
  transferNo?: string;
  sourceRecordId?: string;
  sourceMrrNo?: string;
  sourceStoreRef?: string;
  sourceBatchNo?: string;
  targetOrderNo: string;
  transferQty: number;
  transferRoll: number;
  pendingQty?: number;
  pendingRoll?: number;
  transferDate: string;
  deliveryNo: string;
  remarks: string;
  transferType?: 'DIRECT_DELIVERY' | 'HOLD_PENDING';
  status?: 'DELIVERED' | 'PENDING' | 'RELEASED';
  releasedAt?: string;
  releasedBy?: string;
  createdAt?: string;
}

export const OrderTransferView: React.FC = () => {
  // Main view navigation tabs
  const [activeTab, setActiveTab] = useState<'entry' | 'pending' | 'history'>('entry');

  // Search & matching orders
  const [searchBy, setSearchBy] = useState<'mrrNo' | 'storeRef'>('mrrNo');
  const [query, setQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [matchingOrders, setMatchingOrders] = useState<MatchingOrder[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Selected source order
  const [selectedOrder, setSelectedOrder] = useState<MatchingOrder | null>(null);

  // Transfer form fields
  const [transferQty, setTransferQty] = useState<string>('');
  const [transferRoll, setTransferRoll] = useState<string>('');
  const [targetOrderNo, setTargetOrderNo] = useState<string>('');
  const [transferDate, setTransferDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [remarks, setRemarks] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState<boolean>(false);

  // Confirmation Popup State
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [selectedTransferType, setSelectedTransferType] = useState<'DIRECT_DELIVERY' | 'HOLD_PENDING'>('DIRECT_DELIVERY');

  // History for selected source order
  const [history, setHistory] = useState<TransferHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Pending Transfers tab state
  const [pendingList, setPendingList] = useState<TransferHistoryItem[]>([]);
  const [loadingPending, setLoadingPending] = useState<boolean>(false);
  const [hasLoadedPending, setHasLoadedPending] = useState<boolean>(false);
  const [pendingSearchQuery, setPendingSearchQuery] = useState<string>('');
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Release Modal State
  const [releaseModalItem, setReleaseModalItem] = useState<TransferHistoryItem | null>(null);
  const [isReleasing, setIsReleasing] = useState<boolean>(false);

  // All History tab state
  const [allHistoryList, setAllHistoryList] = useState<TransferHistoryItem[]>([]);
  const [loadingAllHistory, setLoadingAllHistory] = useState<boolean>(false);
  const [hasLoadedAllHistory, setHasLoadedAllHistory] = useState<boolean>(false);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');

  // Toast / notification
  const [toast, setToast] = useState<{ title: string; desc: string; type: 'success' | 'destructive' } | null>(
    null
  );

  const showToast = (title: string, desc: string, type: 'success' | 'destructive' = 'success') => {
    setToast({ title, desc, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Fetch pending count initially
  const fetchPendingCount = async () => {
    try {
      const res = await fetch('/api/order-transfer?mode=pending');
      if (res.ok) {
        const json = await res.json();
        const items = json.data || [];
        setPendingCount(items.length);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchPendingCount();
  }, []);

  // Search matching orders
  const handleSearch = async () => {
    if (!query.trim()) {
      showToast(
        'Input Required',
        searchBy === 'mrrNo' ? 'Please enter an MRR No.' : 'Please enter a Store Ref.',
        'destructive'
      );
      return;
    }

    setIsSearching(true);
    setSelectedOrder(null);
    setHistory([]);

    try {
      const modeParam = searchBy === 'mrrNo' ? 'mrrNo' : 'storeRef';
      const res = await fetch(
        `/api/order-transfer?mode=search&${modeParam}=${encodeURIComponent(query.trim())}`
      );

      if (res.ok) {
        const json = await res.json();
        const results: MatchingOrder[] = json.data || [];
        setMatchingOrders(results);
        setHasSearched(true);
        if (results.length === 0) {
          showToast(
            'No Results',
            searchBy === 'mrrNo'
              ? 'No orders found matching this MRR No.'
              : 'No orders found matching this Store Ref.',
            'destructive'
          );
        }
      } else {
        showToast('Error', 'Failed to search orders.', 'destructive');
      }
    } catch (err) {
      console.error('Order transfer search error:', err);
      showToast('Error', 'Network error.', 'destructive');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setMatchingOrders([]);
    setHasSearched(false);
    setSelectedOrder(null);
  };

  // Select source order and load history
  const handleSelectOrder = async (order: MatchingOrder) => {
    setSelectedOrder(order);
    setTransferQty('');
    setTransferRoll('');
    setTargetOrderNo('');
    setTransferDate(new Date().toISOString().slice(0, 10));
    setRemarks('');
    setLoadingHistory(true);

    try {
      const res = await fetch(
        `/api/order-transfer?mode=history&sourceRecordId=${encodeURIComponent(order.id)}`
      );
      if (res.ok) {
        const json = await res.json();
        setHistory(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load transfer history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Pre-validate and show Confirmation Popup
  const handleInitiateTransfer = () => {
    if (!selectedOrder) return;

    const qty = parseFloat(transferQty) || 0;
    const roll = parseFloat(transferRoll) || 0;
    const availableStock = parseFloat(String(selectedOrder.stockInHand)) || 0;
    const availableRoll = parseFloat(String(selectedOrder.rollInHand)) || 0;

    if (qty <= 0) {
      showToast('Invalid Quantity', 'Transfer quantity must be greater than 0.', 'destructive');
      return;
    }

    if (qty > availableStock) {
      showToast(
        'Insufficient Stock',
        `Available stock is ${availableStock.toFixed(2)} KG. Cannot transfer ${qty} KG.`,
        'destructive'
      );
      return;
    }

    if (roll > availableRoll && availableRoll > 0) {
      showToast(
        'Insufficient Roll',
        `Available roll is ${availableRoll}. Cannot transfer ${roll} roll.`,
        'destructive'
      );
      return;
    }

    if (!targetOrderNo.trim()) {
      showToast('Target Required', 'Please enter a Target Order Number.', 'destructive');
      return;
    }

    // Open Confirmation Popup
    setSelectedTransferType('DIRECT_DELIVERY');
    setShowConfirmModal(true);
  };

  // Execute transfer after confirming popup option
  const handleConfirmTransfer = async () => {
    if (!selectedOrder) return;

    const qty = parseFloat(transferQty) || 0;
    const roll = parseFloat(transferRoll) || 0;
    const availableStock = parseFloat(String(selectedOrder.stockInHand)) || 0;

    setIsTransferring(true);
    setShowConfirmModal(false);

    try {
      const res = await fetch('/api/order-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceRecordId: selectedOrder.id,
          transferQty: qty,
          transferRoll: roll,
          targetOrderNo: targetOrderNo.trim(),
          transferDate: transferDate || new Date().toISOString().slice(0, 10),
          remarks: remarks.trim(),
          transferType: selectedTransferType
        })
      });

      if (res.ok) {
        const json = await res.json();
        const isHold = selectedTransferType === 'HOLD_PENDING';

        if (isHold) {
          showToast(
            'Order Hold / Pending Saved!',
            `Order Transfer ${qty} KG সফলভাবে Hold / Pending হিসেবে সংরক্ষিত হয়েছে! Stock থেকে কোনো Quantity কাটা হয়নি (Deducted: 0 KG)।`,
            'success'
          );
        } else {
          const afterStock = json.sourceStockAfter?.qty ?? (availableStock - qty).toFixed(2);
          showToast(
            'Direct Delivery Successful!',
            `${qty} KG সফলভাবে ডেলিভারি হয়েছে! Stock থেকে কর্তন করা হয়েছে। বর্তমান স্টক: ${afterStock} KG।`,
            'success'
          );
        }

        // Refresh pending count
        fetchPendingCount();

        // Refresh source order data to reflect accurate stock & pending hold values
        const searchParam = searchBy === 'mrrNo' ? 'mrrNo' : 'storeRef';
        const searchVal = searchBy === 'mrrNo' ? selectedOrder.mrrNo : selectedOrder.storeRef;
        const refRes = await fetch(
          `/api/order-transfer?mode=search&${searchParam}=${encodeURIComponent(searchVal)}`
        );
        if (refRes.ok) {
          const refJson = await refRes.json();
          const updatedMatches: MatchingOrder[] = refJson.data || [];
          setMatchingOrders(updatedMatches);
          const found = updatedMatches.find((o) => o.id === selectedOrder.id);
          if (found) {
            setSelectedOrder(found);
          }
        }

        // Refresh transfer history
        const histRes = await fetch(
          `/api/order-transfer?mode=history&sourceRecordId=${encodeURIComponent(selectedOrder.id)}`
        );
        if (histRes.ok) {
          const histJson = await histRes.json();
          setHistory(histJson.data || []);
        }

        // Reset form inputs
        setTransferQty('');
        setTransferRoll('');
        setTargetOrderNo('');
        setRemarks('');
      } else {
        const errJson = await res.json();
        showToast('Transfer Failed', errJson.error || 'Unknown error.', 'destructive');
      }
    } catch (err) {
      console.error('Transfer execution error:', err);
      showToast('Error', 'Network error.', 'destructive');
    } finally {
      setIsTransferring(false);
    }
  };

  // Show Pending Transfers Tab Data (On-Demand Show Pattern)
  const handleShowPending = async () => {
    setLoadingPending(true);
    try {
      const res = await fetch('/api/order-transfer?mode=pending');
      if (res.ok) {
        const json = await res.json();
        setPendingList(json.data || []);
        setPendingCount((json.data || []).length);
        setHasLoadedPending(true);
      } else {
        showToast('Error', 'Failed to load pending transfers', 'destructive');
      }
    } catch (err) {
      console.error('Failed to load pending transfers:', err);
      showToast('Error', 'Network error', 'destructive');
    } finally {
      setLoadingPending(false);
    }
  };

  const handleClearPendingFilter = () => {
    setPendingSearchQuery('');
    setPendingList([]);
    setHasLoadedPending(false);
  };

  // Release / Confirm a Pending Order
  const handleExecuteRelease = async () => {
    if (!releaseModalItem) return;

    setIsReleasing(true);
    try {
      const res = await fetch(`/api/order-transfer/${encodeURIComponent(releaseModalItem.id)}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: releaseModalItem.id })
      });

      if (res.ok) {
        const json = await res.json();
        showToast(
          'Order Released & Confirmed!',
          json.message || `Pending Order Transfer ${releaseModalItem.transferNo} রিলিজ ও কনফার্ম করা হয়েছে এবং Stock থেকে কর্তন হয়েছে।`,
          'success'
        );

        // Close modal and refresh pending list
        setReleaseModalItem(null);
        handleShowPending();
        fetchPendingCount();

        // Refresh source order if selected
        if (selectedOrder) {
          handleSelectOrder(selectedOrder);
        }
      } else {
        const errJson = await res.json();
        showToast('Release Failed', errJson.error || 'Failed to release transfer.', 'destructive');
      }
    } catch (err) {
      console.error('Release execution error:', err);
      showToast('Error', 'Network error.', 'destructive');
    } finally {
      setIsReleasing(false);
    }
  };

  // Show All Transfer History (On-Demand Show Pattern)
  const handleShowAllHistory = async () => {
    setLoadingAllHistory(true);
    try {
      const res = await fetch('/api/order-transfer?mode=history');
      if (res.ok) {
        const json = await res.json();
        setAllHistoryList(json.data || []);
        setHasLoadedAllHistory(true);
      } else {
        showToast('Error', 'Failed to load transfer history', 'destructive');
      }
    } catch (err) {
      console.error('Failed to load transfer history:', err);
      showToast('Error', 'Network error', 'destructive');
    } finally {
      setLoadingAllHistory(false);
    }
  };

  const handleClearAllHistory = () => {
    setHistorySearchQuery('');
    setAllHistoryList([]);
    setHasLoadedAllHistory(false);
  };

  // Filtered lists
  const filteredPendingList = pendingList.filter((item) => {
    if (!pendingSearchQuery.trim()) return true;
    const q = pendingSearchQuery.toLowerCase();
    return (
      (item.transferNo && item.transferNo.toLowerCase().includes(q)) ||
      (item.sourceStoreRef && item.sourceStoreRef.toLowerCase().includes(q)) ||
      (item.sourceMrrNo && item.sourceMrrNo.toLowerCase().includes(q)) ||
      (item.targetOrderNo && item.targetOrderNo.toLowerCase().includes(q))
    );
  });

  const filteredAllHistoryList = allHistoryList.filter((item) => {
    if (!historySearchQuery.trim()) return true;
    const q = historySearchQuery.toLowerCase();
    return (
      (item.transferNo && item.transferNo.toLowerCase().includes(q)) ||
      (item.deliveryNo && item.deliveryNo.toLowerCase().includes(q)) ||
      (item.sourceStoreRef && item.sourceStoreRef.toLowerCase().includes(q)) ||
      (item.sourceMrrNo && item.sourceMrrNo.toLowerCase().includes(q)) ||
      (item.targetOrderNo && item.targetOrderNo.toLowerCase().includes(q))
    );
  });

  const totalTransferredQty = history.reduce((sum, item) => sum + (Number(item.transferQty) || 0), 0);
  const totalTransferredRoll = history.reduce((sum, item) => sum + (Number(item.transferRoll) || 0), 0);

  const totalPendingQty = pendingList.reduce((sum, item) => sum + (Number(item.pendingQty || item.transferQty) || 0), 0);
  const totalPendingRolls = pendingList.reduce((sum, item) => sum + (Number(item.pendingRoll || item.transferRoll) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top duration-200">
          <div
            className={`p-3.5 rounded-lg shadow-lg border flex items-start gap-2.5 ${
              toast.type === 'destructive'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            {toast.type === 'destructive' ? (
              <AlertCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <strong className="block font-semibold text-[13px]">{toast.title}</strong>
              <span>{toast.desc}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-gray-700 text-sm font-bold ml-1"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Top Header Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-2xs">
        <div className="max-w-[1920px] mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="bg-teal-600 text-white p-2 rounded-lg">
                <Package className="size-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">Fabric Order Transfer Management</h1>
                <p className="text-xs text-gray-500">Direct Delivery & Hold / Pending System</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('entry')}
                className={`h-9 px-4 rounded-md text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'entry'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ArrowRight className="size-3.5" />
                <span>TRANSFER ENTRY</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('pending');
                  if (!hasLoadedPending) handleShowPending();
                }}
                className={`h-9 px-4 rounded-md text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer relative ${
                  activeTab === 'pending'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Clock className="size-3.5" />
                <span>PENDING / HOLD ORDERS</span>
                {pendingCount > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === 'pending' ? 'bg-white text-amber-700' : 'bg-amber-600 text-white'
                    }`}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('history');
                  if (!hasLoadedAllHistory) handleShowAllHistory();
                }}
                className={`h-9 px-4 rounded-md text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <History className="size-3.5" />
                <span>ALL TRANSFER HISTORY</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1920px] mx-auto px-3 sm:px-4 py-4">
        {/* ========================================================================= */}
        {/* TAB 1: TRANSFER ENTRY */}
        {/* ========================================================================= */}
        {activeTab === 'entry' && (
          <>
            {/* VIEW 1A: SEARCH & MATCHING ORDERS (WHEN NO ORDER IS SELECTED) */}
            {!selectedOrder && (
              <>
                {/* Search Filter Box with SHOW pattern */}
                <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-4 mb-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Search className="size-4 text-teal-600" />
                        <label htmlFor="search-by-select" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                          Search By
                        </label>
                      </div>

                      <select
                        id="search-by-select"
                        value={searchBy}
                        onChange={(e) => {
                          setSearchBy(e.target.value as 'mrrNo' | 'storeRef');
                          setQuery('');
                        }}
                        className="h-9 text-sm border border-gray-300 rounded-md px-2.5 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      >
                        <option value="mrrNo">MRR No</option>
                        <option value="storeRef">Store Ref</option>
                      </select>

                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={searchBy === 'mrrNo' ? 'Enter MRR No (e.g. MRR-260901-001)...' : 'Enter Store Ref (e.g. SR-2489)...'}
                        className="w-64 sm:w-80 h-9 text-sm border border-gray-300 rounded-md px-3 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />

                      <button
                        type="button"
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white gap-1.5 h-9 px-4 rounded-md text-xs font-bold inline-flex items-center transition-colors cursor-pointer shadow-2xs"
                      >
                        {isSearching ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Search className="size-3.5" />
                        )}
                        <span>SHOW</span>
                      </button>

                      {hasSearched && (
                        <button
                          type="button"
                          onClick={handleClearSearch}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 gap-1.5 h-9 px-3 rounded-md text-xs font-semibold inline-flex items-center transition-colors cursor-pointer"
                        >
                          <RotateCcw className="size-3.5 text-gray-500" />
                          <span>CLEAR</span>
                        </button>
                      )}
                    </div>

                    {/* Pending Banner Link */}
                    {pendingCount > 0 && (
                      <div
                        onClick={() => {
                          setActiveTab('pending');
                          if (!hasLoadedPending) handleShowPending();
                        }}
                        className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md px-3 py-1.5 text-xs flex items-center gap-2 cursor-pointer hover:bg-amber-100 transition-colors"
                      >
                        <AlertTriangle className="size-3.5 text-amber-600 shrink-0" />
                        <span>
                          <strong>{pendingCount}</strong> Order{pendingCount !== 1 ? 's' : ''} currently on <strong>Hold / Pending</strong>.
                        </span>
                        <ArrowRight className="size-3 text-amber-700" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Matching Orders Table Card */}
                <div className="bg-white rounded-lg shadow-xs border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="size-4 text-teal-600" />
                      <span className="text-sm font-semibold text-gray-700">Available Stock for Transfer</span>
                      {hasSearched && (
                        <span className="text-xs text-gray-400">
                          ({matchingOrders.length} item{matchingOrders.length !== 1 ? 's' : ''} found)
                        </span>
                      )}
                    </div>
                  </div>

                  {hasSearched ? (
                    isSearching ? (
                      <div className="flex items-center justify-center py-12 text-gray-400">
                        <Loader2 className="size-5 animate-spin mr-2 text-teal-600" />
                        <span className="text-sm">Searching matching orders...</span>
                      </div>
                    ) : matchingOrders.length === 0 ? (
                      <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                        No orders found matching this {searchBy === 'mrrNo' ? 'MRR No' : 'Store Ref'}.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left text-gray-700">
                          <thead className="bg-gray-50 border-b border-gray-200 text-gray-800">
                            <tr>
                              <th className="h-9 px-3 text-xs font-semibold">MRR No</th>
                              <th className="h-9 px-3 text-xs font-semibold">Store Ref</th>
                              <th className="h-9 px-3 text-xs font-semibold">Buyer</th>
                              <th className="h-9 px-3 text-xs font-semibold">Style</th>
                              <th className="h-9 px-3 text-xs font-semibold">Colour</th>
                              <th className="h-9 px-3 text-xs font-semibold">Batch No</th>
                              <th className="h-9 px-3 text-xs font-semibold">Fabrics Type</th>
                              <th className="h-9 px-3 text-xs font-semibold text-right">Received KG</th>
                              <th className="h-9 px-3 text-xs font-semibold text-right text-gray-900">Available Stock</th>
                              <th className="h-9 px-3 text-xs font-semibold text-center text-amber-700">Pending Hold</th>
                              <th className="h-9 px-3 text-xs font-semibold text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {matchingOrders.map((order) => (
                              <tr
                                key={order.id}
                                className="hover:bg-teal-50/40 transition-colors"
                              >
                                <td className="px-3 py-2.5 text-xs font-semibold text-teal-700">
                                  {order.mrrNo}
                                </td>
                                <td className="px-3 py-2.5 text-xs font-medium text-gray-800">
                                  {order.storeRef}
                                </td>
                                <td className="px-3 py-2.5 text-xs text-gray-700">
                                  {order.buyerName}
                                </td>
                                <td className="px-3 py-2.5 text-xs text-gray-700">
                                  {order.styleName}
                                </td>
                                <td className="px-3 py-2.5 text-xs text-gray-700">
                                  {order.colour}
                                </td>
                                <td className="px-3 py-2.5 text-xs text-gray-700">
                                  {order.batchNo}
                                </td>
                                <td className="px-3 py-2.5 text-xs text-gray-700">
                                  {order.fabricsType}
                                </td>
                                <td className="px-3 py-2.5 text-xs text-right font-medium text-gray-800">
                                  {order.receivedQuantity}
                                </td>
                                <td className="px-3 py-2.5 text-xs text-right font-bold text-green-700">
                                  {order.stockInHand} KG
                                </td>
                                <td className="px-3 py-2.5 text-xs text-center">
                                  {(order.pendingTransferQty || 0) > 0 ? (
                                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold text-[11px]">
                                      <Clock className="size-3 text-amber-600" />
                                      {order.pendingTransferQty} KG
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 font-mono">-</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectOrder(order)}
                                    className="bg-teal-600 hover:bg-teal-700 text-white gap-1 h-7 text-[11px] px-2.5 rounded font-semibold inline-flex items-center transition-colors cursor-pointer"
                                  >
                                    <ArrowRight className="size-3" />
                                    <span>Select</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center py-14 text-gray-400 text-sm">
                      <Search className="size-8 text-gray-300 mb-2" />
                      <span>
                        Enter an MRR No or Store Ref above and click <strong className="mx-1 text-gray-700">SHOW</strong> to search stock.
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* VIEW 1B: SELECTED SOURCE ORDER & TRANSFER FORM */}
            {selectedOrder && (
              <>
                {/* Source Order Details Card */}
                <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="size-5 text-teal-600" />
                      <span className="text-base font-bold text-gray-800">Source Order Stock Details</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrder(null);
                        setHistory([]);
                        setTransferQty('');
                        setTransferRoll('');
                        setTargetOrderNo('');
                        setRemarks('');
                      }}
                      className="gap-1.5 h-8 px-3 rounded-md border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold inline-flex items-center transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="size-3.5" />
                      <span>Back to Search</span>
                    </button>
                  </div>

                  {/* Grid of Source Order attributes */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-3 p-3.5 bg-teal-50/40 rounded-lg border border-teal-200/50">
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">MRR No</div>
                      <div className="text-sm font-bold text-teal-700">{selectedOrder.mrrNo}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Store Ref</div>
                      <div className="text-sm font-medium text-gray-800">{selectedOrder.storeRef}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Buyer</div>
                      <div className="text-sm font-medium text-gray-800">{selectedOrder.buyerName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Style</div>
                      <div className="text-sm font-medium text-gray-800">{selectedOrder.styleName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Colour</div>
                      <div className="text-sm font-medium text-gray-800">{selectedOrder.colour}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Batch No</div>
                      <div className="text-sm font-medium text-gray-800">{selectedOrder.batchNo}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Fabrics Type</div>
                      <div className="text-sm font-medium text-gray-800">{selectedOrder.fabricsType}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">GSM</div>
                      <div className="text-sm font-medium text-gray-800">{selectedOrder.gsm}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Received KG</div>
                      <div className="text-sm font-bold text-gray-800">{selectedOrder.receivedQuantity} KG</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Physical Stock</div>
                      <div className="text-lg font-bold text-green-700">{selectedOrder.stockInHand} KG</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold text-amber-700">Pending Hold</div>
                      <div className="text-lg font-bold text-amber-700">
                        {selectedOrder.pendingTransferQty || 0} KG
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Location</div>
                      <div className="text-sm font-medium text-gray-800">{selectedOrder.location || '-'}</div>
                    </div>
                  </div>

                  {(selectedOrder.pendingTransferQty || 0) > 0 && (
                    <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 flex items-center gap-2">
                      <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                      <div>
                        <strong>সতর্কতা:</strong> এই স্টকে <strong>{selectedOrder.pendingTransferQty} KG</strong> বর্তমানে <strong>Hold / Pending</strong> অবস্থায় আছে। Pending অবস্থায় থাকা স্টক ব্যালেন্স থেকে কাটা হয় না, তবে সরাসরি ডেলিভারি করার আগে Release/Confirm করতে হবে।
                      </div>
                    </div>
                  )}
                </div>

                {/* 2-Column Section: Transfer Details Form & History */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left Column: Transfer Details Form */}
                  <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <ArrowRight className="size-5 text-emerald-600" />
                      <span className="text-base font-bold text-gray-800">Order Transfer Details</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label htmlFor="transfer-qty-input" className="text-sm font-medium text-gray-700 block mb-1">
                          Transfer Quantity (KG) <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="transfer-qty-input"
                          type="number"
                          step="0.01"
                          value={transferQty}
                          onChange={(e) => setTransferQty(e.target.value)}
                          placeholder="Enter KG to transfer"
                          className="w-full h-9 text-sm border border-gray-300 rounded-md px-3 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                          <span>Available in Stock: <strong>{selectedOrder.stockInHand} KG</strong></span>
                          <span>Max transfer allowed: <strong>{selectedOrder.stockInHand} KG</strong></span>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="transfer-roll-input" className="text-sm font-medium text-gray-700 block mb-1">
                          Transfer Roll
                        </label>
                        <input
                          id="transfer-roll-input"
                          type="number"
                          value={transferRoll}
                          onChange={(e) => setTransferRoll(e.target.value)}
                          placeholder="Enter roll count"
                          className="w-full h-9 text-sm border border-gray-300 rounded-md px-3 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="target-order-input" className="text-sm font-medium text-gray-700 block mb-1">
                          Target Order Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="target-order-input"
                          type="text"
                          value={targetOrderNo}
                          onChange={(e) => setTargetOrderNo(e.target.value)}
                          placeholder="e.g. ORD-9012, SR-2580..."
                          className="w-full h-9 text-sm border border-gray-300 rounded-md px-3 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="transfer-date-input" className="text-sm font-medium text-gray-700 block mb-1">
                          Transfer Date
                        </label>
                        <input
                          id="transfer-date-input"
                          type="date"
                          value={transferDate}
                          onChange={(e) => setTransferDate(e.target.value)}
                          className="w-full h-9 text-sm border border-gray-300 rounded-md px-3 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="transfer-remarks-input" className="text-sm font-medium text-gray-700 block mb-1">
                          Remarks / Reason
                        </label>
                        <input
                          id="transfer-remarks-input"
                          type="text"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Reason for transfer (optional)"
                          className="w-full h-9 text-sm border border-gray-300 rounded-md px-3 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>

                      {/* Transfer Preview */}
                      {transferQty && targetOrderNo && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs">
                          <div className="font-semibold text-emerald-800 mb-1 flex items-center gap-1.5">
                            <Info className="size-3.5" />
                            <span>Transfer Summary Preview</span>
                          </div>
                          <div className="text-gray-700">
                            <strong>{transferQty} KG</strong> from{' '}
                            <strong className="text-teal-700">{selectedOrder.mrrNo} ({selectedOrder.storeRef})</strong> →{' '}
                            <strong className="text-orange-600">{targetOrderNo}</strong>
                          </div>
                        </div>
                      )}

                      {/* SAVE TRANSFER BUTTON (Triggers confirmation popup) */}
                      <button
                        type="button"
                        onClick={handleInitiateTransfer}
                        disabled={isTransferring}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white gap-1.5 h-10 rounded-md font-bold text-sm inline-flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                      >
                        {isTransferring ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Save className="size-4" />
                        )}
                        <span>SAVE TRANSFER</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Order Transfer History for this specific order */}
                  <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <History className="size-5 text-purple-600" />
                      <span className="text-base font-bold text-gray-800">Transfers from this Order</span>
                      {loadingHistory && <Loader2 className="size-4 animate-spin text-gray-400" />}
                    </div>

                    {history.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 text-sm">
                        No previous transfers recorded for this source order.
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                        {history.map((item) => {
                          const isHold = item.status === 'PENDING' || item.transferType === 'HOLD_PENDING';
                          const isReleased = item.status === 'RELEASED';

                          return (
                            <div
                              key={item.id}
                              className={`border rounded-lg p-3 text-xs space-y-1.5 ${
                                isHold
                                  ? 'bg-amber-50/60 border-amber-200'
                                  : isReleased
                                  ? 'bg-blue-50/60 border-blue-200'
                                  : 'bg-emerald-50/60 border-emerald-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-900 text-sm">
                                  {item.transferQty} KG → {item.targetOrderNo}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isHold
                                      ? 'bg-amber-200 text-amber-900'
                                      : isReleased
                                      ? 'bg-blue-200 text-blue-900'
                                      : 'bg-emerald-200 text-emerald-900'
                                  }`}
                                >
                                  {isHold ? 'HOLD / PENDING' : isReleased ? 'RELEASED' : 'DIRECT DELIVERY'}
                                </span>
                              </div>
                              <div className="text-gray-600 space-y-0.5">
                                <div className="flex justify-between">
                                  <span>Transfer / Deliv No: <strong>{item.deliveryNo || item.transferNo}</strong></span>
                                  <span>{item.transferDate ? new Date(item.transferDate).toLocaleDateString() : '-'}</span>
                                </div>
                                <div className="text-[11px]">
                                  Roll: <strong>{item.transferRoll}</strong> | Remarks: {item.remarks || '-'}
                                </div>
                                {isHold && (
                                  <div className="text-amber-800 font-semibold text-[11px] pt-0.5">
                                    ⚠️ Stock Deducted: 0 KG (Pending Hold)
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        <div className="bg-gray-100 rounded-lg p-3 text-xs font-semibold text-gray-700 flex justify-between">
                          <span>Total Transferred / Held:</span>
                          <span>{totalTransferredQty.toFixed(2)} KG / {totalTransferredRoll} Rolls</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PENDING / HOLD TRANSFERS */}
        {/* ========================================================================= */}
        {activeTab === 'pending' && (
          <div>
            {/* Informational Policy Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 mb-4 text-xs text-amber-900 flex items-start gap-3">
              <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-amber-950 mb-0.5">
                  Pending Order Transfer System & Policy (Hold Rules)
                </strong>
                <p className="leading-relaxed">
                  • <strong>Hold / Pending</strong> অবস্থায় থাকা কোনো অর্ডারের Quantity মূল স্টক ব্যালেন্স থেকে Minus হয় না।
                  <br />
                  • পরবর্তীতে ডেলিভারি দেওয়ার সময় সিস্টেম দেখাবে কত Quantity Pending আছে, তবে Pending Quantity থেকে সরাসরি ডেলিভারি দেওয়া যাবে না।
                  <br />
                  • ডেলিভারি দিতে হলে প্রথমে নিচের তালিকা থেকে সংশ্লিষ্ট Pending Order <strong>Release/Confirm</strong> করতে হবে। Release/Confirm করার পর সেই Quantity Stock থেকে কাটা হবে এবং Delivery-এর জন্য কার্যকর হবে।
                </p>
              </div>
            </div>

            {/* Filter Card with SHOW pattern */}
            <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-4 mb-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                    <Search className="size-3.5 text-amber-600" />
                    <span>Search Pending:</span>
                  </div>

                  <input
                    type="text"
                    value={pendingSearchQuery}
                    onChange={(e) => setPendingSearchQuery(e.target.value)}
                    placeholder="Search by Store Ref, MRR, Target Order..."
                    className="w-64 sm:w-80 h-9 text-xs border border-gray-300 rounded-md px-3 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleShowPending()}
                  />

                  <button
                    type="button"
                    onClick={handleShowPending}
                    disabled={loadingPending}
                    className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white gap-1.5 h-9 px-4 rounded-md text-xs font-bold inline-flex items-center transition-colors cursor-pointer shadow-2xs"
                  >
                    {loadingPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Search className="size-3.5" />
                    )}
                    <span>SHOW</span>
                  </button>

                  {hasLoadedPending && (
                    <button
                      type="button"
                      onClick={handleClearPendingFilter}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 gap-1.5 h-9 px-3 rounded-md text-xs font-semibold inline-flex items-center transition-colors cursor-pointer"
                    >
                      <RotateCcw className="size-3.5 text-gray-500" />
                      <span>CLEAR</span>
                    </button>
                  )}
                </div>

                {hasLoadedPending && pendingList.length > 0 && (
                  <div className="flex items-center gap-3 text-xs">
                    <div className="bg-amber-100 text-amber-900 px-3 py-1.5 rounded-md font-bold">
                      Total Pending Qty: {totalPendingQty.toFixed(2)} KG ({totalPendingRolls} Rolls)
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pending Orders Table */}
            <div className="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-amber-50/40">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-amber-600" />
                  <span className="text-sm font-bold text-gray-800">Currently Held / Pending Transfers</span>
                  {hasLoadedPending && (
                    <span className="text-xs text-amber-700 font-semibold">
                      ({filteredPendingList.length} Order{filteredPendingList.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </div>
              </div>

              {hasLoadedPending ? (
                loadingPending ? (
                  <div className="flex items-center justify-center py-12 text-gray-400">
                    <Loader2 className="size-5 animate-spin mr-2 text-amber-600" />
                    <span className="text-sm">Loading pending orders...</span>
                  </div>
                ) : filteredPendingList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-gray-400 text-sm">
                    <CheckCircle2 className="size-8 text-emerald-500 mb-2" />
                    <span className="font-medium text-gray-700">No Pending Orders on Hold!</span>
                    <span className="text-xs text-gray-400 mt-1">All transfers are delivered or released.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-gray-700">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-800">
                        <tr>
                          <th className="h-9 px-3 text-xs font-semibold">Transfer No</th>
                          <th className="h-9 px-3 text-xs font-semibold">Source MRR</th>
                          <th className="h-9 px-3 text-xs font-semibold">Source Store Ref</th>
                          <th className="h-9 px-3 text-xs font-semibold">Target Order No</th>
                          <th className="h-9 px-3 text-xs font-semibold text-right text-amber-800">Pending Qty (KG)</th>
                          <th className="h-9 px-3 text-xs font-semibold text-center">Pending Rolls</th>
                          <th className="h-9 px-3 text-xs font-semibold">Transfer Date</th>
                          <th className="h-9 px-3 text-xs font-semibold">Remarks</th>
                          <th className="h-9 px-3 text-xs font-semibold text-center">Status</th>
                          <th className="h-9 px-3 text-xs font-semibold text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredPendingList.map((item) => (
                          <tr key={item.id} className="hover:bg-amber-50/40 transition-colors">
                            <td className="px-3 py-3 text-xs font-mono font-bold text-amber-800">
                              {item.transferNo || item.deliveryNo}
                            </td>
                            <td className="px-3 py-3 text-xs font-medium text-gray-800">
                              {item.sourceMrrNo || '-'}
                            </td>
                            <td className="px-3 py-3 text-xs font-bold text-teal-700">
                              {item.sourceStoreRef || '-'}
                            </td>
                            <td className="px-3 py-3 text-xs font-bold text-purple-700">
                              {item.targetOrderNo}
                            </td>
                            <td className="px-3 py-3 text-xs text-right font-black text-amber-700 text-sm">
                              {item.pendingQty || item.transferQty} KG
                            </td>
                            <td className="px-3 py-3 text-xs text-center font-medium text-gray-800">
                              {item.pendingRoll || item.transferRoll || 0}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-600">
                              {item.transferDate ? new Date(item.transferDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-600 max-w-[200px] truncate" title={item.remarks}>
                              {item.remarks || '-'}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                HOLD / PENDING
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => setReleaseModalItem(item)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 h-7 text-[11px] px-2.5 rounded font-bold inline-flex items-center transition-colors cursor-pointer shadow-2xs"
                              >
                                <Check className="size-3" />
                                <span>Release / Confirm</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-14 text-gray-400 text-sm">
                  <Clock className="size-8 text-gray-300 mb-2" />
                  <span>
                    Click <strong className="mx-1 text-amber-700 font-bold">SHOW</strong> to view all active Pending & Hold Order Transfers.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ALL TRANSFER HISTORY */}
        {/* ========================================================================= */}
        {activeTab === 'history' && (
          <div>
            {/* Filter Card with SHOW pattern */}
            <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-4 mb-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                    <Search className="size-3.5 text-purple-600" />
                    <span>Search History:</span>
                  </div>

                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="Search by Transfer No, Challan, Store Ref, Target..."
                    className="w-64 sm:w-80 h-9 text-xs border border-gray-300 rounded-md px-3 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleShowAllHistory()}
                  />

                  <button
                    type="button"
                    onClick={handleShowAllHistory}
                    disabled={loadingAllHistory}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white gap-1.5 h-9 px-4 rounded-md text-xs font-bold inline-flex items-center transition-colors cursor-pointer shadow-2xs"
                  >
                    {loadingAllHistory ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Search className="size-3.5" />
                    )}
                    <span>SHOW</span>
                  </button>

                  {hasLoadedAllHistory && (
                    <button
                      type="button"
                      onClick={handleClearAllHistory}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 gap-1.5 h-9 px-3 rounded-md text-xs font-semibold inline-flex items-center transition-colors cursor-pointer"
                    >
                      <RotateCcw className="size-3.5 text-gray-500" />
                      <span>CLEAR</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-purple-50/40">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-purple-600" />
                  <span className="text-sm font-bold text-gray-800">Complete Order Transfer History</span>
                  {hasLoadedAllHistory && (
                    <span className="text-xs text-purple-700 font-semibold">
                      ({filteredAllHistoryList.length} Record{filteredAllHistoryList.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </div>
              </div>

              {hasLoadedAllHistory ? (
                loadingAllHistory ? (
                  <div className="flex items-center justify-center py-12 text-gray-400">
                    <Loader2 className="size-5 animate-spin mr-2 text-purple-600" />
                    <span className="text-sm">Loading transfer history...</span>
                  </div>
                ) : filteredAllHistoryList.length === 0 ? (
                  <div className="flex items-center justify-center py-14 text-gray-400 text-sm">
                    No transfer history records found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-gray-700">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-800">
                        <tr>
                          <th className="h-9 px-3 text-xs font-semibold">Transfer No</th>
                          <th className="h-9 px-3 text-xs font-semibold">Delivery / Ref No</th>
                          <th className="h-9 px-3 text-xs font-semibold">Source Store Ref</th>
                          <th className="h-9 px-3 text-xs font-semibold">Source MRR</th>
                          <th className="h-9 px-3 text-xs font-semibold">Target Order</th>
                          <th className="h-9 px-3 text-xs font-semibold text-right">Qty (KG)</th>
                          <th className="h-9 px-3 text-xs font-semibold text-center">Rolls</th>
                          <th className="h-9 px-3 text-xs font-semibold">Date</th>
                          <th className="h-9 px-3 text-xs font-semibold text-center">Transfer Mode</th>
                          <th className="h-9 px-3 text-xs font-semibold text-center">Status</th>
                          <th className="h-9 px-3 text-xs font-semibold">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredAllHistoryList.map((item) => {
                          const isHold = item.status === 'PENDING' || item.transferType === 'HOLD_PENDING';
                          const isReleased = item.status === 'RELEASED';

                          return (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-3 py-2.5 font-mono font-medium text-gray-900">
                                {item.transferNo || '-'}
                              </td>
                              <td className="px-3 py-2.5 font-mono text-purple-700 font-semibold">
                                {item.deliveryNo || '-'}
                              </td>
                              <td className="px-3 py-2.5 font-bold text-teal-700">
                                {item.sourceStoreRef || '-'}
                              </td>
                              <td className="px-3 py-2.5 text-gray-700">
                                {item.sourceMrrNo || '-'}
                              </td>
                              <td className="px-3 py-2.5 font-bold text-gray-800">
                                {item.targetOrderNo}
                              </td>
                              <td className="px-3 py-2.5 text-right font-bold text-gray-900">
                                {item.transferQty} KG
                              </td>
                              <td className="px-3 py-2.5 text-center font-medium text-gray-800">
                                {item.transferRoll || 0}
                              </td>
                              <td className="px-3 py-2.5 text-gray-600">
                                {item.transferDate ? new Date(item.transferDate).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                {isHold ? (
                                  <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                                    Hold / Pending
                                  </span>
                                ) : (
                                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                                    Direct Delivery
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isHold
                                      ? 'bg-amber-100 text-amber-800'
                                      : isReleased
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {isHold ? 'PENDING' : isReleased ? 'RELEASED' : 'DELIVERED'}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-gray-500 max-w-[180px] truncate" title={item.remarks}>
                                {item.remarks || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-14 text-gray-400 text-sm">
                  <History className="size-8 text-gray-300 mb-2" />
                  <span>
                    Click <strong className="mx-1 text-purple-700 font-bold">SHOW</strong> to view full order transfer history.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* CONFIRMATION POPUP MODAL (As explicitly requested by user) */}
      {/* ========================================================================= */}
      {showConfirmModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-700 to-emerald-700 text-white p-4">
              <div className="flex items-center gap-2">
                <Package className="size-5 text-emerald-200" />
                <h3 className="text-base font-bold">Order Transfer Confirmation</h3>
              </div>
              <p className="text-xs text-emerald-100 mt-1">
                {selectedOrder.mrrNo} ({selectedOrder.storeRef}) → {targetOrderNo} ({transferQty} KG)
              </p>
            </div>

            {/* Modal Body: Prompt & 2 Options */}
            <div className="p-5 space-y-4">
              <div className="text-center py-1">
                <p className="text-base font-bold text-gray-900 leading-snug">
                  “আপনি কি Direct Delivery দিতে চান, নাকি Order Hold করে রাখতে চান?”
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  নিচের যেকোনো একটি অপশন নির্বাচন করে নিশ্চিত করুন:
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Option 1: Direct Delivery */}
                <div
                  onClick={() => setSelectedTransferType('DIRECT_DELIVERY')}
                  className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTransferType === 'DIRECT_DELIVERY'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                      : 'border-gray-200 hover:border-emerald-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        selectedTransferType === 'DIRECT_DELIVERY'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Truck className="size-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-gray-900">
                          1. Direct Delivery
                        </span>
                        {selectedTransferType === 'DIRECT_DELIVERY' && (
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="size-3" /> Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        Order Transfer-এর Quantity সঙ্গে সঙ্গে সংশ্লিষ্ট Stock থেকে <strong>Minus হবে</strong> এবং <strong>Delivery হিসেবে গণনা হবে</strong>।
                      </p>
                      <div className="mt-2 text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 rounded px-2 py-1">
                        Stock Effect: {selectedOrder.stockInHand} KG - {transferQty} KG ={' '}
                        <strong>{(selectedOrder.stockInHand - (parseFloat(transferQty) || 0)).toFixed(2)} KG</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Option 2: Hold / Pending */}
                <div
                  onClick={() => setSelectedTransferType('HOLD_PENDING')}
                  className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTransferType === 'HOLD_PENDING'
                      ? 'border-amber-600 bg-amber-50/70 shadow-xs'
                      : 'border-gray-200 hover:border-amber-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        selectedTransferType === 'HOLD_PENDING'
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Clock className="size-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-gray-900">
                          2. Hold / Pending
                        </span>
                        {selectedTransferType === 'HOLD_PENDING' && (
                          <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="size-3" /> Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        Order Transfer Save হবে, কিন্তু <strong>Stock থেকে কোনো Quantity Minus হবে না</strong>। Order-টি <strong>Pending</strong> অবস্থায় থাকবে।
                      </p>
                      <div className="mt-2 text-[11px] font-semibold text-amber-800 bg-amber-100/70 rounded px-2 py-1">
                        Stock Effect: Available Stock = <strong>{selectedOrder.stockInHand} KG (Deducted = 0 KG)</strong>, Pending = <strong>{transferQty} KG</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-gray-50 border-t border-gray-200 p-3.5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                বাতিল (Cancel)
              </button>

              <button
                type="button"
                onClick={handleConfirmTransfer}
                disabled={isTransferring}
                className={`px-5 py-2 rounded-md text-xs font-bold text-white shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                  selectedTransferType === 'DIRECT_DELIVERY'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {isTransferring ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                <span>
                  {selectedTransferType === 'DIRECT_DELIVERY'
                    ? 'Confirm Direct Delivery'
                    : 'Confirm Hold / Pending'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RELEASE / CONFIRM PENDING MODAL */}
      {/* ========================================================================= */}
      {releaseModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-200" />
                <h3 className="text-base font-bold">Release & Confirm Pending Order</h3>
              </div>
              <p className="text-xs text-emerald-100 mt-1">
                Transfer No: {releaseModalItem.transferNo || releaseModalItem.deliveryNo}
              </p>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-gray-700">
              <p className="text-sm font-semibold text-gray-900 leading-snug">
                আপনি কি নিশ্চিত যে এই Pending Order Transfer-টি Release ও Confirm করতে চান?
              </p>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-1 text-xs text-emerald-950">
                <div className="flex justify-between">
                  <span>Source Store Ref:</span>
                  <strong>{releaseModalItem.sourceStoreRef}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Target Order No:</span>
                  <strong className="text-purple-700">{releaseModalItem.targetOrderNo}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Pending Quantity:</span>
                  <strong className="text-sm text-emerald-800">{releaseModalItem.pendingQty || releaseModalItem.transferQty} KG</strong>
                </div>
                <div className="flex justify-between">
                  <span>Pending Rolls:</span>
                  <strong>{releaseModalItem.pendingRoll || releaseModalItem.transferRoll || 0} Rolls</strong>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-900 flex items-start gap-2">
                <Info className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>নোট:</strong> Confirm করার পর এই <strong>{releaseModalItem.pendingQty || releaseModalItem.transferQty} KG</strong> সরাসরি সংশ্লিষ্ট Stock থেকে Minus হবে এবং Delivery চালানে পরিণত হবে।
                </span>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 p-3.5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setReleaseModalItem(null)}
                disabled={isReleasing}
                className="px-4 py-2 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                বাতিল
              </button>

              <button
                type="button"
                onClick={handleExecuteRelease}
                disabled={isReleasing}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                {isReleasing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                <span>হ্যাঁ, Release & Confirm করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTransferView;
