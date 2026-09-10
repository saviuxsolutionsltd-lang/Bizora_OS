import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, Zap, AlertCircle } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setError(null);
    setScanning(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not supported in this browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      // Check for BarcodeDetector API support
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['code_128', 'ean_13', 'ean_8', 'qr_code', 'upc_a'],
          });

          const interval = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  clearInterval(interval);
                  const code = barcodes[0].rawValue;
                  playBeep();
                  onScan(code);
                  onClose();
                }
              } catch {
                // detector error ignored
              }
            }
          }, 300);

          return () => clearInterval(interval);
        } catch {
          // fallback
        }
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setError(err.message || 'Camera permission denied or camera not found.');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setScanning(false);
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1800;
      gain.gain.value = 0.2;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        audioCtx.close();
      }, 120);
    } catch {
      // audio feedback fallback
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      playBeep();
      onScan(manualBarcode.trim());
      setManualBarcode('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Live Barcode & QR Scanner</h3>
              <p className="text-xs text-slate-500">Camera API for fast product lookup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Camera Area */}
        <div className="relative bg-black h-72 flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-6 text-center text-white max-w-xs">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
              <p className="text-sm font-medium">{error}</p>
              <p className="text-xs text-slate-400 mt-2">
                You can still enter barcodes using the manual barcode input below or a USB laser scanner.
              </p>
              <button
                onClick={startCamera}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 mx-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />
              {/* Target Scan Reticle */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-36 border-2 border-dashed border-blue-400/80 rounded-xl relative flex items-center justify-center bg-blue-500/10">
                  <div className="w-full h-0.5 bg-red-500/90 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                  <span className="absolute bottom-2 text-[10px] text-white/90 bg-black/60 px-2 py-0.5 rounded font-mono">
                    Align Barcode or QR
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Manual Barcode Entry Fallback */}
        <div className="p-6 bg-white space-y-4">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Or enter barcode (e.g. 6161100123456)..."
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
            >
              Add Item
            </button>
          </form>

          {/* Quick Demo Barcode suggestions for instant test */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500 mb-2 font-medium">Quick Click Demo Barcodes:</div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { code: '6161100123456', label: 'EAC 2.5mm Cable' },
                { code: '6161100123463', label: 'Schneider MCB 20A' },
                { code: '6161100123470', label: 'Crown Exterior 20L' },
                { code: '6161100123494', label: 'PPR Pipe 25mm' },
                { code: '6161100123531', label: 'Bamburi Tembo Cement' },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    playBeep();
                    onScan(item.code);
                    onClose();
                  }}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-md border border-slate-200 transition flex items-center gap-1 font-mono"
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
