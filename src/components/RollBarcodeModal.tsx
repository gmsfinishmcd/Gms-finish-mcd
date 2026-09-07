import React, { useState, useMemo } from 'react';
import { X, Printer, QrCode, Barcode as BarcodeIcon, Layers, CheckCircle2, ChevronRight, Sliders } from 'lucide-react';
import type { FabricRecord } from '../types.js';
import { Barcode } from './Barcode.js';
import { generateRollBarcode } from '../lib/barcodeUtils.js';

interface RollBarcodeModalProps {
  record: FabricRecord | null;
  onClose: () => void;
}

export const RollBarcodeModal: React.FC<RollBarcodeModalProps> = ({ record, onClose }) => {
  const [printMode, setPrintMode] = useState<'single' | 'all-rolls'>('all-rolls');
  const [labelSize, setLabelSize] = useState<'4x2' | '3x2' | 'compact'>('4x2');
  const [rollStart, setRollStart] = useState<number>(1);
  const totalRolls = record ? Number(record.receivedRoll) || 1 : 1;
  const [rollEnd, setRollEnd] = useState<number>(totalRolls);

  // Generate roll items
  const rollItems = useMemo(() => {
    if (!record) return [];

    if (printMode === 'single') {
      const singleCode = generateRollBarcode(record.storeRef, record.batchNo, 1);
      return [
        {
          rollNumber: 1,
          total: totalRolls,
          barcode: singleCode,
          weightEst: (Number(record.receivedQuantity) / totalRolls).toFixed(1),
        },
      ];
    }

    const list = [];
    const start = Math.max(1, rollStart);
    const end = Math.min(totalRolls, Math.max(start, rollEnd));

    for (let i = start; i <= end; i++) {
      const code = generateRollBarcode(record.storeRef, record.batchNo, i);
      list.push({
        rollNumber: i,
        total: totalRolls,
        barcode: code,
        weightEst: (Number(record.receivedQuantity) / totalRolls).toFixed(1),
      });
    }
    return list;
  }, [record, printMode, rollStart, rollEnd, totalRolls]);

  if (!record) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <BarcodeIcon className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-2">
                <span>Roll Barcode Tag Generator</span>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full">
                  CODE 128
                </span>
              </h3>
              <p className="text-[11px] text-gray-300 font-mono">
                SR: {record.storeRef} • Batch: {record.batchNo} • Total: {record.receivedRoll} Rolls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="bg-slate-50 p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-700">Print Mode:</span>
            <div className="inline-flex rounded-lg bg-gray-200 p-0.5">
              <button
                type="button"
                onClick={() => setPrintMode('all-rolls')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  printMode === 'all-rolls'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Rolls ({totalRolls} tags)
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('single')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  printMode === 'single'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Batch Summary (1 tag)
              </button>
            </div>
          </div>

          {/* Roll Range (if all rolls) */}
          {printMode === 'all-rolls' && totalRolls > 1 && (
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-gray-500 font-sans font-medium">Roll Range:</span>
              <input
                type="number"
                min={1}
                max={totalRolls}
                value={rollStart}
                onChange={(e) => setRollStart(Number(e.target.value))}
                className="w-14 px-1.5 py-0.5 text-center bg-white border border-gray-300 rounded font-bold"
              />
              <span className="text-gray-400">to</span>
              <input
                type="number"
                min={rollStart}
                max={totalRolls}
                value={rollEnd}
                onChange={(e) => setRollEnd(Number(e.target.value))}
                className="w-14 px-1.5 py-0.5 text-center bg-white border border-gray-300 rounded font-bold"
              />
            </div>
          )}

          {/* Label Size */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-medium">Size:</span>
            <select
              value={labelSize}
              onChange={(e) => setLabelSize(e.target.value as any)}
              className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-bold text-gray-800 cursor-pointer"
            >
              <option value="4x2">Standard Thermal 4" x 2" (100x50mm)</option>
              <option value="3x2">Medium 3" x 2" (75x50mm)</option>
              <option value="compact">Compact 2.5" x 1.5" (60x40mm)</option>
            </select>
          </div>
        </div>

        {/* Printable Tags Preview Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-100 flex flex-col items-center gap-4">
          <div id="printable-roll-tag-container" className="w-full space-y-4 max-w-md">
            {rollItems.map((item) => (
              <div
                key={item.barcode}
                className="printable-barcode-tag bg-white border-2 border-black p-4 rounded-xl shadow-md font-sans text-black space-y-2 relative"
              >
                {/* Header */}
                <div className="flex items-start justify-between border-b-2 border-black pb-1.5">
                  <div>
                    <div className="text-[12px] font-black tracking-tight uppercase leading-tight">
                      GMS COMPOSITE KNITTING IND. LTD.
                    </div>
                    <div className="text-[10px] font-extrabold text-emerald-800 tracking-wider">
                      MCD FINISH FABRIC WAREHOUSE
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-black text-white font-mono font-black text-xs px-2 py-0.5 rounded">
                      ROLL {item.rollNumber} / {item.total}
                    </span>
                  </div>
                </div>

                {/* Real Industrial Code 128 Barcode */}
                <div className="flex flex-col items-center justify-center py-1">
                  <Barcode
                    value={item.barcode}
                    format="CODE128"
                    width={1.7}
                    height={44}
                    fontSize={12}
                    margin={2}
                    className="w-full flex justify-center"
                  />
                </div>

                {/* Data Grid */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] border-t-2 border-black pt-1.5">
                  <div>
                    <span className="text-gray-500 font-bold block text-[9px] uppercase">STORE REF / PO</span>
                    <span className="font-black text-sm tracking-tight">{record.storeRef}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-bold block text-[9px] uppercase">BATCH NO</span>
                    <span className="font-mono font-black text-sm bg-gray-100 px-1 py-0.2 rounded inline-block">
                      {record.batchNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-bold block text-[9px] uppercase">BUYER</span>
                    <span className="font-bold truncate block">{record.buyerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-bold block text-[9px] uppercase">STYLE</span>
                    <span className="font-bold truncate block">{record.styleName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-bold block text-[9px] uppercase">FABRIC TYPE</span>
                    <span className="font-semibold">{record.fabricsType}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-bold block text-[9px] uppercase">COLOUR / GSM</span>
                    <span className="font-bold">
                      {record.colour} ({record.gsm} GSM)
                    </span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-300 p-1 rounded">
                    <span className="text-emerald-800 font-bold block text-[9px] uppercase">EST. ROLL WEIGHT</span>
                    <span className="font-black text-emerald-950 text-xs font-mono">
                      ~{item.weightEst} Kg
                    </span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-300 p-1 rounded">
                    <span className="text-emerald-800 font-bold block text-[9px] uppercase">BAY LOCATION</span>
                    <span className="font-mono font-black text-emerald-950 text-xs">
                      {record.location}
                    </span>
                  </div>
                </div>

                {/* Footer / Quality Stamp */}
                <div className="flex items-center justify-between border-t border-gray-300 pt-1.5 text-[10px]">
                  <span className="font-bold">
                    QC: <span className="font-black text-black underline">{record.approvalOk || 'OK'}</span>
                    {' • '}
                    Dyeing: <span className="font-semibold">{record.dyeingStatus || 'OK'}</span>
                  </span>
                  <span className="font-mono text-gray-500 text-[9px]">
                    MRR: {record.mrrNo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white px-5 py-3.5 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-600">
            Printing <b>{rollItems.length}</b> thermal barcode label{rollItems.length > 1 ? 's' : ''} (Code 128)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl border border-gray-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="size-4" />
              <span>Print {rollItems.length} Barcode Sticker{rollItems.length > 1 ? 's' : ''}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
