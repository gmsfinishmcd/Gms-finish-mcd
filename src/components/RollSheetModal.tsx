import React, { useState } from 'react';
import { X, Calculator, Plus, Trash2, Check, FileSpreadsheet } from 'lucide-react';

interface RollSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (totalWeight: number, rollCount: number, rawRolls: string) => void;
  initialRolls?: string;
}

export const RollSheetModal: React.FC<RollSheetModalProps> = ({
  isOpen,
  onClose,
  onApply,
  initialRolls = ''
}) => {
  const [pasteInput, setPasteInput] = useState<string>(initialRolls);
  const [rollsList, setRollsList] = useState<number[]>(() => {
    if (!initialRolls) return [];
    return initialRolls
      .split(/[\s,\n]+/)
      .map((v) => parseFloat(v))
      .filter((v) => !isNaN(v) && v > 0);
  });
  const [singleWeight, setSingleWeight] = useState<string>('');

  if (!isOpen) return null;

  const handleParsePaste = () => {
    const parsed = pasteInput
      .split(/[\s,\n]+/)
      .map((v) => parseFloat(v))
      .filter((v) => !isNaN(v) && v > 0);
    setRollsList(parsed);
  };

  const handleAddSingle = () => {
    const val = parseFloat(singleWeight);
    if (!isNaN(val) && val > 0) {
      setRollsList((prev) => [...prev, val]);
      setSingleWeight('');
    }
  };

  const handleRemoveRoll = (index: number) => {
    setRollsList((prev) => prev.filter((_, i) => i !== index));
  };

  const totalWeight = rollsList.reduce((acc, curr) => acc + curr, 0);
  const rollCount = rollsList.length;
  const avgWeight = rollCount > 0 ? (totalWeight / rollCount).toFixed(2) : '0.00';

  const handleConfirm = () => {
    onApply(
      parseFloat(totalWeight.toFixed(2)),
      rollCount,
      rollsList.join(', ')
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gray-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="size-4 text-emerald-400" />
            <h3 className="text-sm font-bold tracking-wide">
              Finish Fabric Roll Weight Sheet & Packing List
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <p className="text-xs text-gray-600 leading-relaxed">
            Enter or paste individual roll weights (in Kg) from the dyeing delivery challan.
            The system will automatically compute the <b>Exact Total Finish Received (Kg)</b>,{' '}
            <b>Total Roll Count</b>, and <b>Average Weight per Roll</b>.
          </p>

          {/* Paste or Quick Text Box */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Bulk Paste Roll Weights (comma, space, or line separated):
            </label>
            <textarea
              rows={3}
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
              placeholder="e.g. 24.5, 25.2, 24.8, 26.0, 23.9, 25.4, 24.7"
              className="w-full text-xs font-mono p-2.5 rounded-lg border border-gray-300 focus:ring-1 focus:ring-emerald-500 outline-none resize-none bg-gray-50 focus:bg-white"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleParsePaste}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded border border-gray-300 transition-colors cursor-pointer"
              >
                <Calculator className="size-3.5 text-emerald-600" />
                <span>Parse & Calculate Weights</span>
              </button>
            </div>
          </div>

          {/* Add Single Roll Input */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
            <input
              type="number"
              step="0.01"
              value={singleWeight}
              onChange={(e) => setSingleWeight(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSingle();
                }
              }}
              placeholder="Add roll weight (Kg)..."
              className="flex-1 text-xs px-3 py-1.5 rounded border border-gray-300 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
            <button
              type="button"
              onClick={handleAddSingle}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Add Roll</span>
            </button>
          </div>

          {/* Summary Box */}
          <div className="grid grid-cols-3 gap-3 bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-lg text-center">
            <div>
              <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                Total Rolls
              </div>
              <div className="text-lg font-black text-emerald-950 mt-0.5">{rollCount}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                Total Received (Kg)
              </div>
              <div className="text-lg font-black text-emerald-700 mt-0.5">
                {totalWeight.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                Avg Roll Wt (Kg)
              </div>
              <div className="text-lg font-black text-gray-800 mt-0.5">{avgWeight}</div>
            </div>
          </div>

          {/* Rolls Grid */}
          {rollsList.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600">
                <span>Roll Breakdown ({rollsList.length} items):</span>
                <button
                  type="button"
                  onClick={() => setRollsList([])}
                  className="text-red-500 hover:text-red-700 text-[10px] font-bold"
                >
                  Clear All
                </button>
              </div>
              <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50 grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {rollsList.map((wt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white px-2 py-1 rounded border border-gray-200 text-[11px] font-mono group"
                  >
                    <span className="text-gray-500 text-[9px]">#{idx + 1}</span>
                    <span className="font-bold text-gray-800">{wt.toFixed(1)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRoll(idx)}
                      className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                    >
                      <Trash2 className="size-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={rollCount === 0}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded shadow-xs transition-colors cursor-pointer"
          >
            <Check className="size-4" />
            <span>Apply to Received Form</span>
          </button>
        </div>
      </div>
    </div>
  );
};
