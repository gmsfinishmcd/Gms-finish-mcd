import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  X,
  Upload,
  ScanLine,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Keyboard,
  Barcode as BarcodeIcon,
  Zap,
} from 'lucide-react';
import jsQR from 'jsqr';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedText: string) => void;
  title?: string;
  subtitle?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Barcode & QR Scanner',
  subtitle = 'Scan fabric roll barcode, rack location tag, batch, or MRR',
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Audio feedback on successful scan
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6 high beep
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.13);
      }
    } catch {
      // ignore
    }
  };

  const handleDetected = (text: string) => {
    playBeep();
    stopCamera();
    onScanSuccess(text.trim());
  };

  // Start video stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      stopCamera();
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        startScanLoop();
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setCameraError(
        `Unable to access camera (${errMsg}). Please verify camera permissions or switch to 'Upload Image' or 'Manual Input'.`
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Continuous scanning loop (BarcodeDetector API + jsQR fallback)
  const startScanLoop = () => {
    // Check if window.BarcodeDetector is natively supported
    const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;
    let detector: any = null;

    if (hasBarcodeDetector) {
      try {
        // @ts-expect-error - BarcodeDetector is a modern web standard
        detector = new window.BarcodeDetector({
          formats: ['code_128', 'code_39', 'ean_13', 'qr_code', 'upc_a'],
        });
      } catch (e) {
        console.warn('BarcodeDetector init error:', e);
      }
    }

    const scan = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(scan);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvasRef.current = canvas;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        animFrameRef.current = requestAnimationFrame(scan);
        return;
      }

      // 1. Try native BarcodeDetector if available
      if (detector) {
        try {
          const barcodes = await detector.detect(video);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            handleDetected(barcodes[0].rawValue);
            return;
          }
        } catch {
          // Fall back to jsQR
        }
      }

      // 2. jsQR Fallback for QR codes
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleDetected(code.data);
        return;
      }

      animFrameRef.current = requestAnimationFrame(scan);
    };

    animFrameRef.current = requestAnimationFrame(scan);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  // Handle uploaded image file
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        // Try native BarcodeDetector first
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          try {
            // @ts-expect-error - BarcodeDetector standard
            const detector = new window.BarcodeDetector({
              formats: ['code_128', 'code_39', 'ean_13', 'qr_code'],
            });
            const barcodes = await detector.detect(img);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              handleDetected(barcodes[0].rawValue);
              return;
            }
          } catch (err) {
            console.warn('BarcodeDetector upload err:', err);
          }
        }

        // jsQR fallback
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qr = jsQR(imgData.data, imgData.width, imgData.height);
          if (qr && qr.data) {
            handleDetected(qr.data);
            return;
          }
        }
        alert('Could not decode a valid 1D barcode or QR code from this image. Please try another image or use manual entry.');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <ScanLine className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full">
                  1D / 2D
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Camera className="size-4" />
            <span>Live Camera</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Upload className="size-4" />
            <span>Upload Image</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Keyboard className="size-4" />
            <span>Manual / Gun</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 flex-1 overflow-y-auto">
          {activeTab === 'camera' && (
            <div className="flex flex-col items-center">
              {cameraError ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 w-full space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm">Camera Offline</div>
                      <p className="mt-0.5 text-amber-800">{cameraError}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={startCamera}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="size-3.5" />
                      <span>Retry Camera</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('manual')}
                      className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 font-bold rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      Use Manual / Gun Input
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative w-full aspect-4/3 bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />

                  {/* Scanning Crosshair Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                    <div className="w-64 h-44 border-2 border-emerald-400 rounded-xl relative shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_red] animate-pulse" />
                      <div className="absolute top-2 left-2 size-4 border-t-2 border-l-2 border-white" />
                      <div className="absolute top-2 right-2 size-4 border-t-2 border-r-2 border-white" />
                      <div className="absolute bottom-2 left-2 size-4 border-b-2 border-l-2 border-white" />
                      <div className="absolute bottom-2 right-2 size-4 border-b-2 border-r-2 border-white" />
                    </div>
                    <span className="mt-3 bg-black/75 text-white font-mono text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs">
                      Align 1D Barcode or QR Code inside box
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-3 text-center text-xs text-gray-500 flex items-center justify-center gap-1.5">
                <Zap className="size-3.5 text-emerald-600" />
                <span>Supports industrial barcode guns, mobile camera, and QR codes</span>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`p-8 border-2 border-dashed rounded-xl text-center flex flex-col items-center justify-center transition-colors ${
                dragActive ? 'border-emerald-600 bg-emerald-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }`}
            >
              <Upload className="size-10 text-gray-400 mb-2" />
              <p className="text-xs font-bold text-gray-700">Drag & drop photo of barcode tag</p>
              <p className="text-[11px] text-gray-500 mt-1">or click below to browse image file</p>
              <label className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer">
                <span>Select Image File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-700 space-y-1">
                <div className="font-bold flex items-center gap-1 text-slate-900">
                  <BarcodeIcon className="size-3.5 text-emerald-700" />
                  <span>Hardware Barcode Gun & Manual Entry</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Aim any USB/Bluetooth barcode scanner gun at the screen or physical label, or type the code below.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Barcode String / Roll ID / Rack / MRR:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && manualInput.trim()) {
                        handleDetected(manualInput.trim());
                      }
                    }}
                    placeholder="e.g., GMS-SR1001-B1001-R01 or RACK-R05"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (manualInput.trim()) {
                        handleDetected(manualInput.trim());
                      }
                    }}
                    disabled={!manualInput.trim()}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Scan / Lookup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
