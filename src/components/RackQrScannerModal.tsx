import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Upload, ScanLine, AlertCircle, RefreshCw, CheckCircle2, Keyboard } from 'lucide-react';
import jsQR from 'jsqr';

interface RackQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedText: string) => void;
  availableRacks: string[];
}

export const RackQrScannerModal: React.FC<RackQrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  availableRacks,
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

  // Soft beep for scanner feedback
  const playBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.13);
      }
    } catch {
      // Audio not supported or blocked
    }
  };

  const handleDetected = (text: string) => {
    playBeep();
    stopCamera();
    onScanSuccess(text);
  };

  // Start Camera
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
        `Unable to access camera (${errMsg}). Please check browser permissions or switch to 'Upload Image' or 'Manual Input'.`
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
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Live video frame processing loop
  const startScanLoop = () => {
    const scan = () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        canvasRef.current
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
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
        }
      }
      animFrameRef.current = requestAnimationFrame(scan);
    };
    animFrameRef.current = requestAnimationFrame(scan);
  };

  // Decode from image file
  const decodeImageFile = (file: File) => {
    setCameraError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          if (code && code.data) {
            handleDetected(code.data);
          } else {
            setCameraError('No readable QR code found in this image. Please try a clearer, higher-contrast photo.');
          }
        }
      };
      img.onerror = () => setCameraError('Failed to load image file.');
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
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

  if (!isOpen) return null;

  return (
    <div
      id="rack-scanner-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        id="rack-scanner-modal-container"
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gray-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ScanLine className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-snug">Warehouse QR Scanner</h3>
              <p className="text-xs text-gray-400">Scan bay, shelf or rack QR tags to inspect live stock</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50/80 px-4 pt-2">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Camera className="size-3.5" />
            <span>Live Camera</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Upload className="size-3.5" />
            <span>Upload Image</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Keyboard className="size-3.5" />
            <span>Manual / Barcode Gun</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* CAMERA TAB */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              <div className="relative w-full aspect-4/3 bg-black rounded-xl overflow-hidden border border-gray-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Laser scan line overlay */}
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="size-48 sm:size-56 border-2 border-dashed border-emerald-400/70 rounded-2xl relative">
                      {/* Corner marks */}
                      <div className="absolute -top-1 -left-1 size-5 border-t-4 border-l-4 border-emerald-500" />
                      <div className="absolute -top-1 -right-1 size-5 border-t-4 border-r-4 border-emerald-500" />
                      <div className="absolute -bottom-1 -left-1 size-5 border-b-4 border-l-4 border-emerald-500" />
                      <div className="absolute -bottom-1 -right-1 size-5 border-b-4 border-r-4 border-emerald-500" />

                      {/* Moving laser beam */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-1/2 -translate-y-1/2 shadow-[0_0_8px_#10b981] animate-pulse" />
                    </div>
                    <span className="mt-3 text-[11px] font-mono text-emerald-300 bg-black/60 px-2 py-0.5 rounded-full">
                      Align QR tag inside frame
                    </span>
                  </div>
                )}

                {/* Camera Inactive or Error State */}
                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-gray-950 text-gray-400 space-y-2">
                    <Camera className="size-10 text-gray-600 animate-pulse" />
                    <p className="text-xs max-w-xs text-gray-300">
                      {cameraError || 'Starting warehouse camera stream...'}
                    </p>
                    <button
                      onClick={startCamera}
                      className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="size-3.5" />
                      <span>Retry Camera</span>
                    </button>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-800">
                  <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Camera Permission or Device Notice:</span>
                    <span>{cameraError}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* UPLOAD IMAGE TAB */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    decodeImageFile(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-gray-300 hover:border-emerald-400 bg-gray-50/50'
                }`}
              >
                <Upload className="size-10 text-gray-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-gray-700">Drop QR photo or Browse</h4>
                <p className="text-[11px] text-gray-500 mt-1">
                  Upload screenshot, warehouse photo, or saved tag (PNG, JPG, WEBP)
                </p>
                <label className="mt-3 inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-xs">
                  <span>Select Image File</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        decodeImageFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>

              {cameraError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-800">
                  <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          )}

          {/* MANUAL / SCANNER GUN TAB */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Scan Barcode Gun or Enter Rack ID / QR Payload
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
                    placeholder="e.g. Rack A-01, or paste decoded QR payload..."
                    className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-mono"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (manualInput.trim()) {
                        handleDetected(manualInput.trim());
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Submit
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Connect a USB/Bluetooth barcode scanner gun or type the rack code directly.
                </p>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-700 block mb-2">
                  Quick Select Existing Bay / Rack:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {availableRacks.map((rack) => (
                    <button
                      key={rack}
                      onClick={() => handleDetected(rack)}
                      className="px-2.5 py-2 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-400 border border-gray-200 rounded-lg text-xs font-mono font-semibold text-gray-800 text-left transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{rack}</span>
                      <CheckCircle2 className="size-3 text-emerald-600 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span className="font-mono text-[11px]">GMS Finish Fabric MCD • Optical WMS</span>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
