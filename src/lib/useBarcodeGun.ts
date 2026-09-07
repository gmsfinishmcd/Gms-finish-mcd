import { useEffect, useRef } from 'react';

interface UseBarcodeGunOptions {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  minChars?: number;
  maxKeyInterval?: number; // ms
}

/**
 * Universal USB/Bluetooth Barcode Scanner Gun Listener
 * Listens for high-speed keystrokes typical of industrial barcode guns (Honeywell, Zebra, Datalogic, etc.)
 */
export function useBarcodeGun({
  onScan,
  enabled = true,
  minChars = 3,
  maxKeyInterval = 65,
}: UseBarcodeGunOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) {
        return;
      }

      const now = Date.now();
      const interval = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Enter key indicates end of barcode transmission from scanner gun
      if (e.key === 'Enter') {
        const scanned = bufferRef.current.trim();
        bufferRef.current = '';

        if (scanned.length >= minChars) {
          // Prevent form submit if it was fired by a scanner gun
          e.preventDefault();
          onScan(scanned);
        }
        return;
      }

      // If characters come too slowly (> maxKeyInterval), it's likely human typing, reset buffer
      if (interval > maxKeyInterval && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      // Add single character
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onScan, enabled, minChars, maxKeyInterval]);
}
