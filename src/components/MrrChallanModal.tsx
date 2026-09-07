import React from 'react';
import { X, Printer, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import type { FabricRecord } from '../types.js';

interface MrrChallanModalProps {
  record: FabricRecord | null;
  onClose: () => void;
}

export const MrrChallanModal: React.FC<MrrChallanModalProps> = ({ record, onClose }) => {
  if (!record) return null;

  const avgRollWeight =
    record.receivedRoll > 0
      ? (record.receivedQuantity / record.receivedRoll).toFixed(2)
      : '0.00';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-gray-300 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="bg-gray-900 text-white px-5 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-emerald-400" />
            <span className="text-xs font-bold tracking-wider uppercase">
              Material Received Report (MRR) - Gate & Inspection Challan
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition-colors cursor-pointer"
            >
              <Printer className="size-3.5" />
              <span>Print Challan</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Challan Body (Printable) */}
        <div className="p-6 md:p-8 space-y-5 overflow-y-auto bg-white text-gray-900 font-sans text-xs">
          {/* Company & Document Header */}
          <div className="border-b-2 border-gray-900 pb-4 text-center relative">
            <div className="text-lg md:text-xl font-black tracking-tight text-gray-900 uppercase">
              GMS Composite Knitting Industries Ltd.
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              Sardaganj, Kashimpur, Gazipur, Bangladesh • Central Finish Fabric Warehouse (MCD)
            </div>
            <div className="mt-2 inline-block px-4 py-1 bg-gray-100 border border-gray-400 rounded text-xs font-black tracking-wider uppercase">
              MATERIAL RECEIVE REPORT (MRR) / FINISH FABRIC INWARD CHALLAN
            </div>

            <div className="absolute right-0 top-0 text-right font-mono hidden sm:block">
              <span className="text-[10px] text-gray-500 block uppercase">Report No</span>
              <span className="text-sm font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                {record.mrrNo}
              </span>
            </div>
          </div>

          {/* Quick Header Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-lg border border-gray-200">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase block">MRR Date</span>
              <span className="font-bold text-gray-900">{record.receivedDate}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Receive Time</span>
              <span className="font-semibold text-gray-800">{record.rcvTime || '10:30 AM'}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Warehouse Unit</span>
              <span className="font-semibold text-gray-800 truncate block">
                {record.warehouseName}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Rack Location</span>
              <span className="font-mono font-bold text-emerald-800">{record.location}</span>
            </div>
          </div>

          {/* Order & Specification Table */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-3 py-1.5 font-bold text-[11px] text-gray-700 uppercase border-b border-gray-300 tracking-wider">
              1. Booking & Fabric Specification
            </div>
            <table className="w-full text-left text-xs divide-y divide-gray-200">
              <tbody>
                <tr className="divide-x divide-gray-200">
                  <td className="py-2 px-3 bg-gray-50 font-semibold w-1/4">Store Ref / Order No:</td>
                  <td className="py-2 px-3 font-bold text-gray-900 w-1/4">{record.storeRef}</td>
                  <td className="py-2 px-3 bg-gray-50 font-semibold w-1/4">Buyer Name:</td>
                  <td className="py-2 px-3 font-bold text-gray-900 w-1/4">{record.buyerName}</td>
                </tr>
                <tr className="divide-x divide-gray-200">
                  <td className="py-2 px-3 bg-gray-50 font-semibold">Style Name:</td>
                  <td className="py-2 px-3 text-gray-900">{record.styleName}</td>
                  <td className="py-2 px-3 bg-gray-50 font-semibold">Fabric Type:</td>
                  <td className="py-2 px-3 text-gray-900 font-medium">{record.fabricsType}</td>
                </tr>
                <tr className="divide-x divide-gray-200">
                  <td className="py-2 px-3 bg-gray-50 font-semibold">Colour / Shade:</td>
                  <td className="py-2 px-3 font-semibold text-gray-900">{record.colour}</td>
                  <td className="py-2 px-3 bg-gray-50 font-semibold">GSM / Dia:</td>
                  <td className="py-2 px-3 text-gray-900 font-mono">
                    {record.gsm} GSM {record.dia ? `• ${record.dia}` : ''}
                  </td>
                </tr>
                <tr className="divide-x divide-gray-200">
                  <td className="py-2 px-3 bg-gray-50 font-semibold">Composition:</td>
                  <td className="py-2 px-3 text-gray-800">{record.composition}</td>
                  <td className="py-2 px-3 bg-gray-50 font-semibold">Certificate / Standard:</td>
                  <td className="py-2 px-3 text-gray-800">{record.certificateName}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Quantities & Process Loss Table */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-3 py-1.5 font-bold text-[11px] text-gray-700 uppercase border-b border-gray-300 tracking-wider">
              2. Batch Delivery & Weight Measurement
            </div>
            <table className="w-full text-left text-xs divide-y divide-gray-200">
              <thead className="bg-gray-50 text-[10px] text-gray-600 font-bold uppercase tracking-wider">
                <tr className="divide-x divide-gray-200">
                  <th className="py-2 px-3">Batch / Lot No</th>
                  <th className="py-2 px-3 text-right">Booking Qty (Kg)</th>
                  <th className="py-2 px-3 text-right">Grey Qty (Kg)</th>
                  <th className="py-2 px-3 text-right">Received Qty (Kg)</th>
                  <th className="py-2 px-3 text-right">Rolls (Pcs)</th>
                  <th className="py-2 px-3 text-right">Avg Roll Wt (Kg)</th>
                  <th className="py-2 px-3 text-right">Process Loss (P/L%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="divide-x divide-gray-200 font-medium">
                  <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{record.batchNo}</td>
                  <td className="py-2.5 px-3 text-right">{record.bookingQty}</td>
                  <td className="py-2.5 px-3 text-right">{record.greyQty}</td>
                  <td className="py-2.5 px-3 text-right font-black text-emerald-800 text-sm">
                    {record.receivedQuantity}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                    {record.receivedRoll}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">{avgRollWeight}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                    {record.plPercent}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Quality, Dyeing Status & Cutting Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border border-gray-300 p-3 rounded-lg space-y-1.5">
              <div className="font-bold text-[11px] text-gray-700 uppercase border-b pb-1">
                Quality Inspection Status
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-gray-600">QC Approval:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    record.approvalOk === 'OK'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {record.approvalOk}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Dyeing Finish Status:</span>
                <span className="font-bold text-gray-900">{record.dyeingStatus}</span>
              </div>
              {record.collarCuffInPcs && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Collar & Cuff:</span>
                  <span className="font-semibold text-gray-900">{record.collarCuffInPcs} Pcs</span>
                </div>
              )}
            </div>

            <div className="border border-gray-300 p-3 rounded-lg space-y-1.5">
              <div className="font-bold text-[11px] text-gray-700 uppercase border-b pb-1">
                Cutting Floor & Logistics
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-gray-600">Person of Cutting:</span>
                <span className="font-bold text-gray-900">{record.personOfCutting}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Target Shipment:</span>
                <span className="font-medium text-gray-900">{record.shipment || 'N/A'}</span>
              </div>
              <div className="text-xs text-gray-600">
                <span>Inspection Notes: </span>
                <span className="italic text-gray-800">
                  {record.remarks || 'Fabric inspected and stacked in designated warehouse rack.'}
                </span>
              </div>
            </div>
          </div>

          {/* Authorized Signature Blocks */}
          <div className="pt-10 grid grid-cols-4 gap-4 text-center text-[10px] text-gray-600 font-semibold border-t border-gray-200">
            <div>
              <div className="border-t border-gray-400 pt-1.5">Received By (Gate Officer)</div>
            </div>
            <div>
              <div className="border-t border-gray-400 pt-1.5">QC Inspector / Lab Officer</div>
            </div>
            <div>
              <div className="border-t border-gray-400 pt-1.5">Warehouse Store In-Charge</div>
            </div>
            <div>
              <div className="border-t border-gray-400 pt-1.5">Cutting Receiver</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between print:hidden">
          <span className="text-xs text-gray-500">
            Authorized Finish Fabric Document • GMS Composite Knitting Ind. Ltd.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="size-4" />
              <span>Print Challan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
