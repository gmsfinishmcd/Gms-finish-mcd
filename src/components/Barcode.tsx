import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export interface BarcodeProps {
  value: string;
  format?: 'CODE128' | 'CODE39' | 'EAN13' | 'ITF14' | 'pharmacode';
  width?: number;
  height?: number;
  displayValue?: boolean;
  text?: string;
  fontSize?: number;
  font?: string;
  margin?: number;
  lineColor?: string;
  background?: string;
  className?: string;
}

export const Barcode: React.FC<BarcodeProps> = ({
  value,
  format = 'CODE128',
  width = 1.8,
  height = 46,
  displayValue = true,
  text,
  fontSize = 13,
  font = 'monospace',
  margin = 4,
  lineColor = '#000000',
  background = 'transparent',
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value, {
        format,
        width,
        height,
        displayValue,
        text,
        fontSize,
        font,
        margin,
        lineColor,
        background,
      });
    } catch (err) {
      console.warn('JsBarcode render error for value:', value, err);
    }
  }, [value, format, width, height, displayValue, text, fontSize, font, margin, lineColor, background]);

  if (!value) {
    return (
      <div className="text-gray-400 text-xs italic p-2 text-center">
        No barcode data
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <svg ref={svgRef} className="max-w-full h-auto" />
    </div>
  );
};
