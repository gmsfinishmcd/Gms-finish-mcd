import type { BarcodeEntityType, BarcodeScanResult, FabricRecord, DeliveryRecord } from '../types.js';

export interface ParsedBarcode {
  rawCode: string;
  type: BarcodeEntityType;
  identifier: string;
  rollNo?: number;
  batchNo?: string;
  storeRef?: string;
  rackNo?: string;
  location?: string;
}

/**
 * Standardize and parse a scanned barcode string
 */
export function parseBarcode(rawText: string): ParsedBarcode {
  const code = (rawText || '').trim();

  // 1. Roll Barcode format e.g., "ROLL-SR1001-B1001-R05" or "GMS-SR1001-B1001-05"
  if (code.startsWith('ROLL-') || code.startsWith('GMS-') || (code.includes('-R') && code.includes('-B'))) {
    const parts = code.split('-');
    let storeRef = '';
    let batchNo = '';
    let rollNo: number | undefined;

    parts.forEach((p) => {
      if (p.startsWith('SR') || p.startsWith('PO')) storeRef = p;
      else if (p.startsWith('B')) batchNo = p;
      else if (p.startsWith('R') && !isNaN(Number(p.replace('R', '')))) {
        rollNo = Number(p.replace('R', ''));
      } else if (!isNaN(Number(p)) && p.length <= 3) {
        rollNo = Number(p);
      }
    });

    return {
      rawCode: code,
      type: 'ROLL',
      identifier: code,
      rollNo,
      batchNo,
      storeRef,
    };
  }

  // 2. Rack / Bay location barcode e.g., "RACK-R-05-A-01", "RACK-R-05", "R-05"
  if (code.toUpperCase().startsWith('RACK') || /^R-\d+/i.test(code) || code.includes('Location:')) {
    const cleanRack = code.replace(/^RACK[:\-_]?/i, '').trim();
    return {
      rawCode: code,
      type: 'RACK',
      identifier: cleanRack,
      rackNo: cleanRack.split('/')[0]?.trim(),
      location: cleanRack.split('/')[1]?.trim(),
    };
  }

  // 3. MRR Barcode e.g., "MRR-260905-101"
  if (code.toUpperCase().startsWith('MRR')) {
    return {
      rawCode: code,
      type: 'MRR',
      identifier: code,
    };
  }

  // 4. Batch Barcode e.g., "BATCH-B-1001" or "B-1001"
  if (code.toUpperCase().startsWith('BATCH-') || /^B-\d+/i.test(code)) {
    const cleanBatch = code.replace(/^BATCH[:\-_]?/i, '').trim();
    return {
      rawCode: code,
      type: 'BATCH',
      identifier: cleanBatch,
      batchNo: cleanBatch,
    };
  }

  // 5. Delivery Challan Barcode e.g., "DC-2026-09-001"
  if (code.toUpperCase().startsWith('DC-') || code.toUpperCase().startsWith('CHALLAN')) {
    return {
      rawCode: code,
      type: 'DELIVERY',
      identifier: code,
    };
  }

  // 6. Store Reference Barcode e.g., "SR-1001"
  if (code.toUpperCase().startsWith('SR-') || code.toUpperCase().startsWith('SR')) {
    return {
      rawCode: code,
      type: 'SR',
      identifier: code,
      storeRef: code,
    };
  }

  // Fallback / General match
  return {
    rawCode: code,
    type: 'UNKNOWN',
    identifier: code,
  };
}

/**
 * Generate standard Code 128 roll barcode string
 * e.g., GMS-SR1001-B1001-R01
 */
export function generateRollBarcode(storeRef: string, batchNo: string, rollNumber: number): string {
  const cleanSr = (storeRef || 'SR0000').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const cleanBatch = (batchNo || 'B0000').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const rollPadded = String(rollNumber).padStart(2, '0');
  return `GMS-${cleanSr}-${cleanBatch}-R${rollPadded}`;
}

/**
 * Generate standard Code 128 Rack barcode string
 * e.g., RACK-R05-A01
 */
export function generateRackBarcode(rackNo: string, location?: string): string {
  const cleanRack = (rackNo || 'R00').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (location) {
    const cleanLoc = location.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `RACK-${cleanRack}-${cleanLoc}`;
  }
  return `RACK-${cleanRack}`;
}
