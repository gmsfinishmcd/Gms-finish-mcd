import React, { useEffect, useState } from 'react';
import { X, Printer, CheckSquare, Square, Layers, Check, Download } from 'lucide-react';
import QRCode from 'qrcode';
import type { RackData } from '../types.js';

interface RackBatchPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  racks: (RackData & { rackNo?: string; location?: string; totalBalanceQty?: number; totalBalanceRolls?: number })[];
  selectedRackNames: string[];
  onToggleRack: (rackName: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

interface RackQrItem {
  rack: RackData & { rackNo?: string; location?: string; totalBalanceQty?: number; totalBalanceRolls?: number };
  qrDataUrl: string;
  directUrl: string;
}

export const RackBatchPrintModal: React.FC<RackBatchPrintModalProps> = ({
  isOpen,
  onClose,
  racks,
  selectedRackNames,
  onToggleRack,
  onSelectAll,
  onDeselectAll,
}) => {
  const [qrItems, setQrItems] = useState<RackQrItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [labelSize, setLabelSize] = useState<'standard' | 'compact' | 'large'>('standard');

  // Filter selected racks
  const selectedRacks = racks.filter((r) => selectedRackNames.includes(r.name));

  useEffect(() => {
    if (!isOpen || selectedRacks.length === 0) {
      setQrItems([]);
      return;
    }

    setLoading(true);
    const generateAllQrs = async () => {
      const items: RackQrItem[] = [];
      const origin = typeof window !== 'undefined' ? window.location.origin : '';

      for (const rack of selectedRacks) {
        const directUrl = `${origin}/?tab=rack-qr&rack=${encodeURIComponent(rack.name)}`;
        try {
          const qrUrl = await QRCode.toDataURL(directUrl, {
            width: labelSize === 'large' ? 320 : labelSize === 'compact' ? 180 : 240,
            margin: 1,
            color: {
              dark: '#0f172a', // slate-900
              light: '#ffffff',
            },
            errorCorrectionLevel: 'M',
          });
          items.push({
            rack,
            qrDataUrl: qrUrl,
            directUrl,
          });
        } catch (err) {
          console.error(`Failed generating QR for rack ${rack.name}:`, err);
        }
      }
      setQrItems(items);
      setLoading(false);
    };

    generateAllQrs();
  }, [isOpen, selectedRackNames, labelSize, racks]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      {/* Container - hide non-print parts when printing */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 print:shadow-none print:border-none print:max-w-none print:max-h-none print:m-0 print:p-0">
        {/* Header - Not printed */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Printer className="size-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>Multi-Rack QR Label Batch Print</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full">
                  {selectedRacks.length} Selected
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Batch print laminated bay tags with clear Rack Number, Location and Direct Mobile QR code
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={selectedRacks.length === 0 || loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Printer className="size-4" />
              <span>Print {selectedRacks.length} Labels</span>
            </button>
            <button
              onClick={onClose}
              className="size-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Selection & Settings Toolbar - Not printed */}
        <div className="p-3 sm:px-5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg font-semibold text-gray-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <CheckSquare className="size-3.5 text-emerald-600" />
              <span>Select All ({racks.length})</span>
            </button>
            <button
              onClick={onDeselectAll}
              className="px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg font-semibold text-gray-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Square className="size-3.5 text-gray-400" />
              <span>Clear Selection</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-500 font-medium">Label Layout:</span>
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-gray-200">
              <button
                onClick={() => setLabelSize('compact')}
                className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                  labelSize === 'compact' ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                3 per row (A4)
              </button>
              <button
                onClick={() => setLabelSize('standard')}
                className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                  labelSize === 'standard' ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                2 per row (Standard Bay)
              </button>
              <button
                onClick={() => setLabelSize('large')}
                className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                  labelSize === 'large' ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                1 per row (Large Placard)
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Printable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-gray-100 print:bg-white print:p-0 print:overflow-visible">
          {loading ? (
            <div className="py-20 text-center text-gray-500">
              <div className="animate-spin size-8 border-3 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-xs font-semibold">Generating high-resolution QR codes...</p>
            </div>
          ) : selectedRacks.length === 0 ? (
            <div className="py-20 text-center text-gray-500">
              <p className="text-sm font-semibold">No racks selected for printing.</p>
              <p className="text-xs text-gray-400 mt-1">Please select at least one rack location above.</p>
              <button
                onClick={onSelectAll}
                className="mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Select All Racks
              </button>
            </div>
          ) : (
            <div
              className={`grid gap-4 sm:gap-6 print:gap-4 print:p-2 ${
                labelSize === 'compact'
                  ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-3'
                  : labelSize === 'large'
                  ? 'grid-cols-1 print:grid-cols-1'
                  : 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2'
              }`}
            >
              {qrItems.map(({ rack, qrDataUrl }) => {
                const rackNo = rack.rackNo || rack.name.split('/')[0]?.replace('Rack:', '').trim() || rack.name;
                const locStr = rack.location || rack.name.split('/')[1]?.replace('Location:', '').trim() || rack.name;

                return (
                  <div
                    key={rack.name}
                    className="bg-white rounded-xl border-2 border-slate-900 p-4 sm:p-5 flex flex-col items-center justify-between text-center shadow-xs page-break-inside-avoid relative print:border-2 print:border-black print:shadow-none print:break-inside-avoid"
                    style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                  >
                    {/* Warehouse Header */}
                    <div className="w-full pb-2 mb-2 border-b-2 border-slate-900 text-center">
                      <div className="text-[9px] sm:text-[10px] uppercase font-black tracking-wider text-slate-800">
                        GMS COMPOSITE KNITTING IND. LTD.
                      </div>
                      <div className="text-[8px] sm:text-[9px] uppercase font-bold text-slate-600">
                        MCD FINISH FABRIC WAREHOUSE
                      </div>
                    </div>

                    {/* Zone Badge */}
                    <div className="mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-300">
                        {rack.zone || 'Storage Zone'}
                      </span>
                    </div>

                    {/* QR Code */}
                    <div className="p-2 bg-white rounded-lg border border-slate-300 mb-2">
                      <img
                        src={qrDataUrl}
                        alt={`QR for ${rack.name}`}
                        className={`${
                          labelSize === 'large' ? 'size-44 sm:size-52' : labelSize === 'compact' ? 'size-28 sm:size-32' : 'size-36 sm:size-40'
                        } mx-auto object-contain`}
                      />
                    </div>

                    {/* Clear Bold Rack Number and Location (Requirement #1) */}
                    <div className="w-full pt-2 border-t-2 border-slate-900 mt-1 space-y-0.5">
                      <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-950 uppercase">
                        Rack: {rackNo}
                      </div>
                      <div className="text-base sm:text-lg font-extrabold font-mono text-emerald-800 uppercase">
                        Location: {locStr}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        Bay ID: {rack.rackId}
                      </div>
                    </div>

                    {/* Instruction & Gun Barcode */}
                    <div className="w-full mt-2 pt-1.5 border-t border-dashed border-slate-300 text-[8px] sm:text-[9px] text-slate-600 font-medium">
                      <span>Scan with Mobile Camera or Barcode Gun to View Live Stock & Balance</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer - Print tip */}
        <div className="p-3 px-5 bg-white border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 shrink-0 print:hidden">
          <span>💡 Tip: Set printer margins to "Minimum" or "None" and background graphics to "On".</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
