import React, { useState, useEffect, useCallback } from 'react';
import {
  Save,
  Pencil,
  RotateCcw,
  Plus,
  Search,
  Trash2,
  Printer,
  QrCode,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download
} from 'lucide-react';
import type { FabricRecord } from '../types.js';
import { Combobox } from '../components/Combobox.js';
import { RollSheetModal } from '../components/RollSheetModal.js';
import { RollBarcodeModal } from '../components/RollBarcodeModal.js';
import { MrrChallanModal } from '../components/MrrChallanModal.js';

interface BookingStatusMapItem {
  storeRef: string;
  bookingQty: number;
  receivedQty: number;
  balance: number;
  status: string;
  rolls: number;
}

// Default initial dropdown options
const DEFAULT_COMBO_OPTIONS: Record<string, string[]> = {
  warehouseName: [
    'Central MCD Finish Warehouse - Dhaka',
    'North Garments MCD Store Unit-1',
    'South MCD Fabric Hub Gazipur',
    'GMS Composite Finish MCD Store',
    'Dyeing Floor 1 Finish Staging Area'
  ],
  buyerName: [
    'ZARA (Inditex)',
    'H&M Group',
    'Next Retail UK',
    'M&S (Marks & Spencer)',
    'Puma SE',
    'Target USA',
    'C&A Europe'
  ],
  styleName: [
    'Autumn Crew Neck Tee (ST-8921)',
    'Summer Ribbed Polo (ST-9042)',
    'Winter Terry Fleece Hoodie (ST-7714)',
    'Casual Jersey V-Neck (ST-6210)',
    'Active Stretch Jogger (ST-5541)'
  ],
  storeRef: ['SR-2489', 'SR-2501', 'SR-2514', 'SR-2530', 'SR-2545'],
  fabricsType: [
    'Single Jersey',
    '1x1 Cotton Rib',
    '2x2 Lycra Rib',
    'CVC French Terry',
    'Interlock',
    'Pique Polo',
    'Fleece Brushed',
    'Drop Needle'
  ],
  certificateName: [
    'BCI (Better Cotton Initiative)',
    'OEKO-TEX Standard 100',
    'GOTS Certified Organic',
    'GRS (Global Recycled Standard)',
    'FSC Certified',
    'None'
  ],
  colour: [
    'Jet Black',
    'Navy Blazer',
    'Melange Grey Heather',
    'Optical White',
    'Sage Olive Green',
    'Crimson Wine Red',
    'Anthracite Charcoal',
    'Baby Pink',
    'Royal Blue'
  ],
  approvalOk: ['Yes', 'No', 'OK', 'Pending', 'Re-Check'],
  dyeingStatus: ['Completed', 'Pending', 'In Progress', 'On Hold', 'Rejected'],
  location: [
    'Rack A-01',
    'Rack A-02',
    'Rack A-03',
    'Rack B-01',
    'Rack B-02',
    'Rack B-03',
    'Rack C-01',
    'Rack C-02',
    'Rack C-03',
    'Quarantine Area'
  ],
  composition: [
    '100% Combed Cotton',
    '95% Cotton 5% Elastane',
    '60% Cotton 40% Polyester (CVC)',
    '80% Cotton 20% Polyester',
    '100% Organic Cotton',
    '90% Cotton 10% Viscose'
  ],
  personOfCutting: [
    'Md. Rafiqul Islam (Cutting Floor 1)',
    'Kamrul Hassan (Master Cutter Unit 2)',
    'Abdul Matin (Cutting Shift A)',
    'Shafiqul Alam (In-Charge Shift B)',
    'Zillur Rahman (Spreader Shift 1)'
  ],
  monthName: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]
};

// Default empty form state
const EMPTY_FORM: Record<string, any> = {
  id: '',
  mrrNo: '',
  warehouseName: 'Central MCD Finish Warehouse - Dhaka',
  buyerName: '',
  styleName: '',
  storeRef: '',
  fabricsType: '',
  gsm: '',
  certificateName: '',
  composition: '',
  receivedDate: new Date().toISOString().split('T')[0],
  colour: '',
  batchNo: '',
  bookingQty: '',
  greyQty: '',
  receivedQuantity: '',
  receivedRoll: '',
  plPercent: '',
  approvalOk: 'Yes',
  location: '',
  collarCuffInPcs: '',
  remarks: '',
  dyeingStatus: 'Completed',
  rcvTime: '',
  dlvdTime: '',
  personOfCutting: '',
  reasonBackToDyeing: '',
  monthName: 'September',
  shipment: ''
};

// Generate MRR Number like original app
const generateMrrNo = () => {
  const d = new Date();
  const dateStr =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');
  const seq = String(Math.floor(100 + Math.random() * 900));
  return `MRR-${dateStr}-${seq}`;
};

// Exactly the 4 sections matching original software
const SECTIONS = [
  {
    label: 'Warehouse Info',
    fields: [
      { key: 'mrrNo', label: 'MRR No', readonly: true },
      { key: 'warehouseName', label: 'Warehouse Name', combo: true },
      { key: 'buyerName', label: 'Buyer Name', combo: true },
      { key: 'styleName', label: 'Style Name', combo: true },
      { key: 'storeRef', label: 'Store Ref', combo: true },
      { key: 'fabricsType', label: 'Fabrics Type', combo: true },
      { key: 'gsm', label: 'GSM' },
      { key: 'certificateName', label: 'Certificate Name', combo: true }
    ]
  },
  {
    label: 'Receiving Details',
    fields: [
      { key: 'receivedDate', label: 'Received Date', type: 'date' },
      { key: 'colour', label: 'Colour', combo: true },
      { key: 'batchNo', label: 'Batch No' },
      { key: 'bookingQty', label: 'Booking Qty' },
      { key: 'greyQty', label: 'Grey Qty' },
      { key: 'receivedQuantity', label: 'Received Qty' },
      { key: 'receivedRoll', label: 'Received Roll' },
      { key: 'plPercent', label: 'PL %', readonly: true }
    ]
  },
  {
    label: 'Status & Location',
    fields: [
      { key: 'approvalOk', label: 'Approval OK', combo: true },
      { key: 'dyeingStatus', label: 'Dyeing Status', combo: true },
      { key: 'location', label: 'Rack Location', combo: true },
      { key: 'collarCuffInPcs', label: 'Collar & Cuff (PCS)' },
      { key: 'composition', label: 'Composition', combo: true }
    ]
  },
  {
    label: 'Tracking & Others',
    fields: [
      { key: 'personOfCutting', label: 'Person of Cutting', combo: true },
      { key: 'monthName', label: "Month's Name", combo: true },
      { key: 'shipment', label: 'Shipment', type: 'date' },
      { key: 'remarks', label: 'Remarks' }
    ]
  }
];

export const FabricReceivedView: React.FC = () => {
  const [formData, setFormData] = useState<Record<string, any>>({
    ...EMPTY_FORM,
    mrrNo: generateMrrNo()
  });

  const [records, setRecords] = useState<FabricRecord[]>([]);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);
  const [comboOptions, setComboOptions] = useState<Record<string, string[]>>(DEFAULT_COMBO_OPTIONS);
  const [filterStoreRef, setFilterStoreRef] = useState<string>('');
  const [filterBatchNo, setFilterBatchNo] = useState<string>('');
  const [hasLoadedRecords, setHasLoadedRecords] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bookingMap, setBookingMap] = useState<Record<string, BookingStatusMapItem>>({});
  const [, setFilledStores] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<{ title: string; desc: string; type?: string } | null>(
    null
  );

  // Modals
  const [printRecord, setPrintRecord] = useState<FabricRecord | null>(null);
  const [barcodeRecord, setBarcodeRecord] = useState<FabricRecord | null>(null);
  const [rollSheetOpen, setRollSheetOpen] = useState<boolean>(false);

  const showToast = (title: string, desc: string, type: string = 'success') => {
    setToastMsg({ title, desc, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch booking status
  const fetchBookingStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/fabric-received/booking-status');
      if (res.ok) {
        const json = await res.json();
        setBookingMap(json.data || json || {});
        setFilledStores(json.filled || []);
      }
    } catch (err) {
      console.error('Booking status fetch error:', err);
    }
  }, []);

  // Fetch records with pagination and filters
  const fetchRecords = useCallback(
    async (targetPage: number = 1, sRef?: string, bNo?: string) => {
      try {
        let url = `/api/fabric-received?page=${targetPage}&limit=10`;
        const s = sRef !== undefined ? sRef : filterStoreRef;
        const b = bNo !== undefined ? bNo : filterBatchNo;
        if (s) url += `&storeRef=${encodeURIComponent(s)}`;
        if (b) url += `&batchNo=${encodeURIComponent(b)}`;

        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          setRecords(json.data || []);
          setTotal(json.total || 0);
          setPage(json.page || 1);
        }
      } catch (err) {
        console.error('Fetch records error:', err);
      }
    },
    [filterStoreRef, filterBatchNo]
  );

  // Fetch dropdown and combo options from database records and settings
  const fetchComboOptions = useCallback(async () => {
    try {
      const recRes = await fetch('/api/fabric-received?page=1&limit=1000');
      let recData: FabricRecord[] = [];
      if (recRes.ok) {
        const json = await recRes.json();
        recData = json.data || [];
      }

      const merged: Record<string, string[]> = { ...DEFAULT_COMBO_OPTIONS };

      // Collect unique values from existing records
      const fieldsToCollect = [
        'warehouseName',
        'buyerName',
        'styleName',
        'storeRef',
        'fabricsType',
        'certificateName',
        'colour',
        'location',
        'composition',
        'personOfCutting'
      ];

      fieldsToCollect.forEach((f) => {
        const fromRecs = Array.from(
          new Set(
            recData
              .map((r: any) => r[f])
              .filter(Boolean)
              .map((v) => String(v).trim())
          )
        );
        const existing = merged[f] || [];
        merged[f] = Array.from(new Set([...existing, ...fromRecs]));
      });

      // Also merge settings dropdown data if available
      try {
        const setRes = await fetch('/api/settings/dropdown-data');
        if (setRes.ok) {
          const setJson = await setRes.json();
          const sData = setJson.data || setJson;
          for (const [k, arr] of Object.entries(sData)) {
            if (Array.isArray(arr)) {
              const current = merged[k] || [];
              merged[k] = Array.from(new Set([...current, ...(arr as string[])]));
            }
          }
        }
      } catch {
        // ignore
      }

      setComboOptions(merged);
    } catch (err) {
      console.error('Fetch combo options error:', err);
    }
  }, []);

  useEffect(() => {
    fetchComboOptions();
    fetchBookingStatus();
  }, [fetchComboOptions, fetchBookingStatus]);

  // Exact P/L % calculation logic on field change
  const handleFieldChange = (key: string, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      const grey = parseFloat(next.greyQty);
      const rec = parseFloat(next.receivedQuantity);
      if (!isNaN(grey) && grey > 0 && !isNaN(rec)) {
        next.plPercent = (((grey - rec) / grey) * 100).toFixed(2);
      }
      return next;
    });
  };

  // Clear form to fresh new entry
  const handleClear = () => {
    setFormData({
      ...EMPTY_FORM,
      mrrNo: generateMrrNo()
    });
    setSelectedId(null);
  };

  // Save / Update logic matching original app
  const handleSave = async () => {
    if (!formData.receivedQuantity || Number(formData.receivedQuantity) <= 0) {
      alert('Please enter a valid Received Qty.');
      return;
    }

    setSaving(true);
    try {
      if (formData.id) {
        // Update existing record via PUT
        const payload = {
          ...formData,
          rcvTime: formData.rcvTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const res = await fetch('/api/fabric-received', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const updated = await res.json();
          showToast('Updated Successfully!', `MRR: ${updated.mrrNo}`);
          setFormData({ ...EMPTY_FORM, mrrNo: generateMrrNo() });
          setSelectedId(null);
          fetchRecords(1, filterStoreRef, filterBatchNo);
          fetchComboOptions();
          fetchBookingStatus();
        } else {
          const errText = await res.text();
          showToast('Update Failed', `Could not update. ${errText}`, 'error');
        }
      } else {
        // Create new record via POST
        const payload = { ...formData };
        delete payload.id;
        payload.rcvTime =
          payload.rcvTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const res = await fetch('/api/fabric-received', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const created = await res.json();
          showToast('Saved Successfully!', `MRR: ${created.mrrNo}`);
          // Set created id so it's ready for updates or next entry
          setFormData({
            ...EMPTY_FORM,
            mrrNo: generateMrrNo(),
            storeRef: created.storeRef,
            warehouseName: created.warehouseName,
            buyerName: created.buyerName,
            styleName: created.styleName,
            fabricsType: created.fabricsType,
            gsm: created.gsm,
            composition: created.composition,
            certificateName: created.certificateName,
            location: created.location
          });
          setSelectedId(null);
          setHasLoadedRecords(true);
          fetchRecords(1, filterStoreRef, filterBatchNo);
          fetchComboOptions();
          fetchBookingStatus();
        } else {
          const errText = await res.text();
          showToast('Failed', `Could not save. ${errText}`, 'error');
        }
      }
    } catch (err) {
      console.error('[Save] Error:', err);
      showToast('Error', 'Network error.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // New Batch (Same Store Ref) button logic
  const handleNewBatchSameStoreRef = async () => {
    if (!formData.storeRef) return;
    setSaving(true);
    try {
      const clonePayload = {
        ...formData,
        id: '',
        mrrNo: generateMrrNo(),
        batchNo: `B-${Math.floor(2000 + Math.random() * 8000)}`,
        rcvTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const res = await fetch('/api/fabric-received', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clonePayload)
      });

      if (res.ok) {
        const created = await res.json();
        showToast('New Batch Created!', `MRR: ${created.mrrNo}`);
        setFormData({
          ...formData,
          id: '',
          mrrNo: generateMrrNo(),
          batchNo: `B-${Math.floor(2000 + Math.random() * 8000)}`,
          receivedQuantity: '',
          receivedRoll: '',
          greyQty: '',
          plPercent: ''
        });
        setSelectedId(null);
        setHasLoadedRecords(true);
        fetchRecords(1, filterStoreRef, filterBatchNo);
        fetchComboOptions();
        fetchBookingStatus();
      } else {
        const errText = await res.text();
        showToast('Failed', `Could not create new batch. ${errText}`, 'error');
      }
    } catch (err) {
      console.error('[NewBatch] Error:', err);
      showToast('Error', 'Network error.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete record
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`/api/fabric-received/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Deleted', 'Record removed.');
        if (selectedId === id) handleClear();
        fetchRecords(page, filterStoreRef, filterBatchNo);
        fetchBookingStatus();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Filter Search
  const handleFilter = () => {
    setHasLoadedRecords(true);
    setPage(1);
    fetchRecords(1, filterStoreRef, filterBatchNo);
  };

  // Clear Filter
  const handleClearFilter = () => {
    setFilterStoreRef('');
    setFilterBatchNo('');
    setPage(1);
    setRecords([]);
    setTotal(0);
    setHasLoadedRecords(false);
  };

  // Apply Roll Sheet weights
  const handleApplyRollSheet = (totalWeight: number, rollCount: number, rawRolls: string) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        receivedQuantity: String(totalWeight),
        receivedRoll: String(rollCount),
        rollWeights: rawRolls
      };
      const grey = parseFloat(next.greyQty);
      if (!isNaN(grey) && grey > 0) {
        next.plPercent = (((grey - totalWeight) / grey) * 100).toFixed(2);
      }
      return next;
    });
    showToast('Applied Roll Sheet', `${rollCount} rolls totalling ${totalWeight} Kg calculated.`);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!hasLoadedRecords || records.length === 0) {
      showToast('No Data', 'Click Show first to load data.', 'error');
      return;
    }
    const headers = [
      'MRR No',
      'Warehouse',
      'Buyer',
      'Style',
      'Store Ref',
      'Fabric',
      'GSM',
      'Colour',
      'Batch',
      'Booking',
      'Received',
      'Roll',
      'Approval',
      'Dyeing',
      'Month',
      'Date'
    ];
    const rows = records.map((r) => [
      `"${r.mrrNo}"`,
      `"${r.warehouseName}"`,
      `"${r.buyerName}"`,
      `"${r.styleName}"`,
      `"${r.storeRef}"`,
      `"${r.fabricsType}"`,
      `"${r.gsm}"`,
      `"${r.colour}"`,
      `"${r.batchNo}"`,
      r.bookingQty,
      r.receivedQuantity,
      r.receivedRoll,
      `"${r.approvalOk}"`,
      `"${r.dyeingStatus}"`,
      `"${r.monthName}"`,
      `"${r.receivedDate}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `GMS_Fabric_Received_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(total / 10) || 1;

  return (
    <div className="max-w-[1920px] mx-auto px-3 py-3 space-y-3">
      {/* Toast message */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg border text-xs font-semibold flex items-center justify-between gap-3 ${
            toastMsg.type === 'error'
              ? 'bg-red-50 border-red-300 text-red-900'
              : 'bg-emerald-50 border-emerald-300 text-emerald-950'
          }`}
        >
          <div>
            <div className="font-bold">{toastMsg.title}</div>
            <div className="text-[11px] opacity-90">{toastMsg.desc}</div>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            className="text-gray-500 hover:text-gray-800 font-bold px-1 text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Navbar Section */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-800 text-white px-4 py-2.5 rounded-lg shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h1 className="text-sm font-bold tracking-wide uppercase">
            GMS FINISH FABRIC MCD - Fabric Received
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-colors cursor-pointer"
          >
            <Plus className="size-4" />
            <span>New Received</span>
          </button>

          <button
            type="button"
            onClick={() => setRollSheetOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="size-4" />
            <span>Roll Weight Sheet</span>
          </button>
        </div>
      </div>

      {/* Main Received Part Form - 4 Organized Sections in 8-Column Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-2.5 last:mb-0">
            {/* Section Header */}
            <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1.5 border-b border-gray-100 pb-1">
              {section.label}
            </div>

            {/* Grid with 8 columns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-3 gap-y-1.5">
              {section.fields.map((field, fieldIdx) => {
                const isLastAndOdd =
                  section.fields.length % 8 !== 0 && fieldIdx === section.fields.length - 1;
                const colSpanClass = isLastAndOdd ? 'col-span-2' : '';

                return (
                  <div key={field.key} className={colSpanClass}>
                    <label className="text-[11px] text-gray-500 font-medium mb-0.5 block leading-tight truncate">
                      {field.label}
                    </label>

                    {field.readonly ? (
                      <input
                        type="text"
                        value={formData[field.key] || ''}
                        readOnly
                        placeholder={field.label}
                        className="h-7 w-full text-xs bg-amber-50 border border-amber-200 text-amber-800 font-mono px-2 rounded focus:outline-none"
                      />
                    ) : field.combo ? (
                      <Combobox
                        options={comboOptions[field.key] || []}
                        value={formData[field.key] || ''}
                        onValueChange={(val) => handleFieldChange(field.key, val)}
                        placeholder={field.label}
                      />
                    ) : (
                      <input
                        type={field.type || 'text'}
                        value={formData[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.label}
                        className="h-7 w-full text-xs bg-gray-50 border border-gray-200 px-2 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 mt-2">
          {formData.id ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-8 px-3 rounded text-xs font-semibold flex items-center shadow-xs transition-colors cursor-pointer"
            >
              <Pencil className="size-4" />
              <span>{saving ? 'Updating...' : 'Update'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 px-3 rounded text-xs font-semibold flex items-center shadow-xs transition-colors cursor-pointer"
            >
              <Save className="size-4" />
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClear}
            className="border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 gap-1.5 h-8 px-3 rounded text-xs font-medium flex items-center transition-colors cursor-pointer"
          >
            <RotateCcw className="size-4" />
            <span>Clear</span>
          </button>

          {formData.storeRef && (
            <button
              type="button"
              onClick={handleNewBatchSameStoreRef}
              disabled={saving}
              className="border border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 gap-1.5 h-8 px-3 rounded text-xs font-semibold flex items-center transition-colors cursor-pointer"
            >
              <Plus className="size-4" />
              <span>New Batch (Same Store Ref)</span>
            </button>
          )}

          {formData.id && (
            <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200 font-medium">
              Editing: {formData.mrrNo}
            </span>
          )}

          {!formData.id && formData.storeRef && (
            <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 font-medium">
              New Batch Entry - Store Ref: {formData.storeRef}
            </span>
          )}

          {/* Quick Print Challan / Barcode shortcuts if editing */}
          {formData.id && (
            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPrintRecord(formData as FabricRecord)}
                className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded cursor-pointer"
              >
                <Printer className="size-3.5" />
                <span>Print MRR</span>
              </button>
              <button
                type="button"
                onClick={() => setBarcodeRecord(formData as FabricRecord)}
                className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded cursor-pointer"
              >
                <QrCode className="size-3.5" />
                <span>Roll Tag</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Filter & Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 mb-3 p-2.5 bg-gray-50 rounded-md border border-gray-200">
          <Search className="size-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-600">Filter:</span>
          <input
            type="text"
            value={filterStoreRef}
            onChange={(e) => setFilterStoreRef(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
            placeholder="Store Ref"
            className="h-7 text-xs w-36 sm:w-48 bg-white px-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <input
            type="text"
            value={filterBatchNo}
            onChange={(e) => setFilterBatchNo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
            placeholder="Batch No"
            className="h-7 text-xs w-36 sm:w-48 bg-white px-2 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={handleFilter}
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs px-3 rounded gap-1 inline-flex items-center font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Search className="size-3" />
            <span>Show</span>
          </button>
          <button
            type="button"
            onClick={handleClearFilter}
            className="h-7 text-xs px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer"
          >
            Clear Filter
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="h-7 text-xs px-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded inline-flex items-center gap-1 font-medium transition-colors cursor-pointer"
          >
            <Download className="size-3 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => fetchRecords(page, filterStoreRef, filterBatchNo)}
            className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded"
            title="Refresh"
          >
            <RefreshCw className="size-3.5" />
          </button>

          <div className="ml-auto text-xs text-gray-400 font-medium">
            Page {page} of {totalPages} · Total: {total}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-md border border-gray-200">
          <table className="w-full text-xs text-left text-gray-700">
            <thead className="bg-emerald-50 text-emerald-950 font-semibold border-b border-gray-200">
              <tr>
                <th className="h-8 px-2 text-[11px] font-semibold">#</th>
                <th className="h-8 px-2 text-[11px] font-semibold">MRR No</th>
                <th className="h-8 px-2 text-[11px] font-semibold">Warehouse</th>
                <th className="h-8 px-2 text-[11px] font-semibold">Buyer</th>
                <th className="h-8 px-2 text-[11px] font-semibold">Style</th>
                <th className="h-8 px-2 text-[11px] font-semibold">Store Ref</th>
                <th className="h-8 px-2 text-[11px] font-semibold">Fabric</th>
                <th className="h-8 px-2 text-[11px] font-semibold">GSM</th>
                <th className="h-8 px-2 text-[11px] font-semibold">Colour</th>
                <th className="h-8 px-2 text-[11px] font-semibold">Batch</th>
                <th className="h-8 px-2 text-[11px] font-semibold">Booking</th>
                <th className="h-8 px-2 text-[11px] font-semibold">Received</th>
                <th className="h-8 px-2 text-[11px] font-semibold">Roll</th>
                <th className="h-8 px-2 text-[11px] font-semibold">Approval</th>
                <th className="h-8 px-2 text-[11px] font-semibold">Dyeing</th>
                <th className="h-8 px-2 text-[11px] font-semibold">Month</th>
                <th className="h-8 px-2 text-[11px] font-semibold">Date</th>
                <th className="h-8 px-2 text-[11px] font-semibold">Booking Status</th>
                <th className="h-8 px-2 text-[11px] font-semibold">Dlv. Balance</th>
                <th className="h-8 px-2 text-[11px] font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!hasLoadedRecords ? (
                <tr>
                  <td colSpan={20} className="h-16 text-center text-gray-400">
                    Set filters and click <strong className="text-gray-700 font-bold mx-1">Show</strong> to load records.
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={20} className="h-16 text-center text-gray-400">
                    No records found matching filters.
                  </td>
                </tr>
              ) : (
                records.map((rec, index) => {
                  const isSelected = selectedId === rec.id;
                  const compKey = `${rec.storeRef}||${rec.fabricsType}||${rec.gsm}`;
                  const bInfo = bookingMap[compKey] || bookingMap[rec.storeRef];

                  return (
                    <tr
                      key={rec.id}
                      onClick={() => {
                        setFormData({
                          id: rec.id,
                          mrrNo: rec.mrrNo || '',
                          warehouseName: rec.warehouseName || '',
                          buyerName: rec.buyerName || '',
                          styleName: rec.styleName || '',
                          storeRef: rec.storeRef || '',
                          fabricsType: rec.fabricsType || '',
                          gsm: rec.gsm || '',
                          certificateName: rec.certificateName || '',
                          composition: rec.composition || '',
                          receivedDate: rec.receivedDate || '',
                          colour: rec.colour || '',
                          batchNo: rec.batchNo || '',
                          bookingQty: rec.bookingQty !== undefined ? String(rec.bookingQty) : '',
                          greyQty: rec.greyQty !== undefined ? String(rec.greyQty) : '',
                          receivedQuantity:
                            rec.receivedQuantity !== undefined ? String(rec.receivedQuantity) : '',
                          receivedRoll:
                            rec.receivedRoll !== undefined ? String(rec.receivedRoll) : '',
                          plPercent: rec.plPercent || '',
                          approvalOk: rec.approvalOk || '',
                          location: rec.location || '',
                          collarCuffInPcs: rec.collarCuffInPcs || '',
                          remarks: rec.remarks || '',
                          dyeingStatus: rec.dyeingStatus || '',
                          rcvTime: rec.rcvTime || '',
                          dlvdTime: rec.dlvdTime || '',
                          personOfCutting: rec.personOfCutting || '',
                          reasonBackToDyeing: rec.reasonBackToDyeing || '',
                          monthName: rec.monthName || '',
                          shipment: rec.shipment || ''
                        });
                        setSelectedId(rec.id);
                      }}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-50 border-l-2 border-l-emerald-500' : ''
                      }`}
                    >
                      <td className="px-2 py-1.5 font-medium text-gray-500">
                        {(page - 1) * 10 + index + 1}
                      </td>
                      <td className="px-2 py-1.5 font-mono text-emerald-700 font-medium">
                        {rec.mrrNo || '-'}
                      </td>
                      <td className="px-2 py-1.5 max-w-[90px] truncate" title={rec.warehouseName}>
                        {rec.warehouseName || '-'}
                      </td>
                      <td className="px-2 py-1.5 max-w-[80px] truncate" title={rec.buyerName}>
                        {rec.buyerName || '-'}
                      </td>
                      <td className="px-2 py-1.5 max-w-[80px] truncate" title={rec.styleName}>
                        {rec.styleName || '-'}
                      </td>
                      <td className="px-2 py-1.5 max-w-[80px] truncate font-medium">
                        {rec.storeRef || '-'}
                      </td>
                      <td className="px-2 py-1.5 max-w-[80px] truncate" title={rec.fabricsType}>
                        {rec.fabricsType || '-'}
                      </td>
                      <td className="px-2 py-1.5">{rec.gsm || '-'}</td>
                      <td className="px-2 py-1.5">{rec.colour || '-'}</td>
                      <td className="px-2 py-1.5 font-mono">{rec.batchNo || '-'}</td>
                      <td className="px-2 py-1.5">{rec.bookingQty || '-'}</td>
                      <td className="px-2 py-1.5 font-bold text-gray-900">
                        {rec.receivedQuantity || '-'}
                      </td>
                      <td className="px-2 py-1.5">{rec.receivedRoll || '-'}</td>
                      <td className="px-2 py-1.5">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            rec.approvalOk === 'Yes' || rec.approvalOk === 'OK'
                              ? 'bg-green-100 text-green-700'
                              : rec.approvalOk === 'No' || rec.approvalOk === 'REJECT'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {rec.approvalOk || '-'}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            rec.dyeingStatus === 'Completed' || rec.dyeingStatus === 'OK'
                              ? 'bg-green-100 text-green-700'
                              : rec.dyeingStatus === 'In Progress'
                              ? 'bg-yellow-100 text-yellow-700'
                              : rec.dyeingStatus === 'Rejected' || rec.dyeingStatus === 'HOLD'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {rec.dyeingStatus || '-'}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">{rec.monthName || '-'}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        {rec.receivedDate ||
                          (rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : '-')}
                      </td>
                      <td className="px-2 py-1.5">
                        {bInfo && bInfo.bookingQty ? (
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              bInfo.status === 'BOOKING FILLED'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {bInfo.status === 'BOOKING FILLED' ? 'FILLED' : 'PENDING'}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        {bInfo && bInfo.bookingQty ? (
                          bInfo.status === 'BOOKING FILLED' ? (
                            <span className="text-green-600 font-medium">0</span>
                          ) : (
                            <span className="text-red-600 font-medium">
                              {bInfo.balance.toFixed(2)}
                            </span>
                          )
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrintRecord(rec);
                            }}
                            title="Print MRR Challan"
                            className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded flex items-center justify-center"
                          >
                            <Printer className="size-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBarcodeRecord(rec);
                            }}
                            title="Print Roll Barcode Label"
                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded flex items-center justify-center"
                          >
                            <QrCode className="size-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDelete(rec.id, e)}
                            title="Delete"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded flex items-center justify-center"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => {
                const p = page - 1;
                setPage(p);
                fetchRecords(p, filterStoreRef, filterBatchNo);
              }}
              className="h-7 px-2 text-xs border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="text-xs text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => {
                const p = page + 1;
                setPage(p);
                fetchRecords(p, filterStoreRef, filterBatchNo);
              }}
              className="h-7 px-2 text-xs border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Official MRR Challan Modal */}
      <MrrChallanModal record={printRecord} onClose={() => setPrintRecord(null)} />

      {/* Roll Barcode Tag Modal */}
      <RollBarcodeModal record={barcodeRecord} onClose={() => setBarcodeRecord(null)} />

      {/* Roll Weight Sheet Calculator Modal */}
      <RollSheetModal
        isOpen={rollSheetOpen}
        onClose={() => setRollSheetOpen(false)}
        onApply={handleApplyRollSheet}
        initialRolls={formData.rollWeights || ''}
      />
    </div>
  );
};
