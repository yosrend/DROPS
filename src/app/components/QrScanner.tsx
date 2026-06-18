import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { getDropById, createFriend, scanQrResult, shareDropLink } from "../../services/dropsService";
import { getDeviceId } from "../../utils/device";
import { showToast } from "./Toast";
import type { UserCard } from "../data/defaults";
import type { FriendRecord } from "../../types/drop";

interface QrScannerProps {
  onClose: () => void;
  onFriendAdded?: (friend: FriendRecord) => void;
}

export default function QrScanner({ onClose, onFriendAdded }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanResult, setScanResult] = useState<{ type: "drop" | "profile" | "external"; dropId?: string; url?: string } | null>(null);
  const [scannedDrop, setScannedDrop] = useState<UserCard | null>(null);
  const [scanning, setScanning] = useState(true);
  const [cameraError, setCameraError] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const handleScan = (rawValue: string) => {
    if (processing) return;
    setProcessing(true);
    const result = scanQrResult(rawValue);
    setScanResult(result);

    if (result.type === "drop" && result.dropId) {
      getDropById(result.dropId).then(card => {
        setScannedDrop(card || null);
      });
    }
  };

  const handleAcceptConnection = async () => {
    if (!scannedDrop) return;
    const deviceId = getDeviceId();
    const friend = await createFriend({
      device_id: deviceId,
      friend_drop_id: scannedDrop.id,
      friend_name: scannedDrop.displayName || scannedDrop.userName || scannedDrop.handle || "Connected",
      friend_handle: scannedDrop.handle,
      friend_profile_url: scannedDrop.profileUrl,
    });
    if (friend) {
      showToast("Connected! ✦");
      onFriendAdded?.(friend);
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.9)" }}
    >
      {/* Close */}
      <button onClick={onClose}
        className="absolute top-6 right-6 z-10 flex items-center justify-center rounded-full"
        style={{
          width: 44, height: 44,
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(12px)",
        }}
      >
        <X size={18} color="#fff" />
      </button>

      {/* Title */}
      <p className="absolute top-8 left-6 text-lg font-semibold text-white" style={{ fontFamily: "Inter,sans-serif" }}>
        Scan QR
      </p>

      {/* Scanner view or result */}
      {scanResult ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4 px-6 max-w-sm w-full"
        >
          {scanResult.type === "drop" && scannedDrop ? (
            <>
              <div className="w-32 h-44 rounded-2xl overflow-hidden flex flex-col justify-between"
                style={{
                  background: scannedDrop.bg ? `url(/cards/card-${scannedDrop.themeId || "gradient"}.png) center/cover no-repeat` : scannedDrop.accentColor || "#7B61FF",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
                }}
              >
                <div className="flex-1 flex items-center p-3">
                  <p className="text-xs font-bold text-white leading-tight">{scannedDrop.quote}</p>
                </div>
                <div className="px-3 pb-2 flex justify-between text-[8px] text-white/70">
                  <span>{scannedDrop.userName || scannedDrop.handle || "Drop"}</span>
                </div>
              </div>
              <p className="text-white font-semibold text-lg">{scannedDrop.displayName || scannedDrop.userName || "Drop"}</p>
              {scannedDrop.handle && <p className="text-white/50 text-sm -mt-2">{scannedDrop.handle}</p>}
              <button
                onClick={handleAcceptConnection}
                className="w-full py-4 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.02]"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(16px)",
                  color: "#fff",
                  boxShadow: "0 0 0 0.5px rgba(255,255,255,0.08)",
                }}
              >
                ✦ Accept Connection
              </button>
              <button onClick={() => { setScanResult(null); setScannedDrop(null); setProcessing(false); }}
                className="text-sm text-white/40 underline">Scan another</button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: "rgba(255,255,255,0.08)" }}>✦</div>
              <p className="text-white font-semibold text-lg">External Link</p>
              <p className="text-white/50 text-sm text-center break-all max-w-xs">{scanResult.url}</p>
              <div className="flex gap-3 w-full">
                {scanResult.url && (
                  <button onClick={() => { window.open(scanResult.url, "_blank"); onClose(); }}
                    className="flex-1 py-4 rounded-2xl text-sm font-semibold"
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      backdropFilter: "blur(16px)",
                      color: "#fff",
                      boxShadow: "0 0 0 0.5px rgba(255,255,255,0.08)",
                    }}>
                    Open Link
                  </button>
                )}
              </div>
              <button onClick={() => { setScanResult(null); setScannedDrop(null); setProcessing(false); }}
                className="text-sm text-white/40 underline">Scan another</button>
            </>
          )}
        </motion.div>
      ) : cameraError ? (
        <div className="flex flex-col items-center gap-4 px-8 text-center">
          <div className="text-4xl">📷</div>
          <p className="text-white/70 text-sm">Camera unavailable</p>
          <p className="text-white/40 text-xs">Please allow camera access or use a different device</p>
          <button onClick={onClose}
            className="mt-4 px-6 py-3 rounded-2xl text-sm font-medium"
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
            }}>Close</button>
        </div>
      ) : (
        <>
          {/* Scanner viewfinder */}
          <div className="relative flex items-center justify-center"
            style={{ width: 260, height: 260 }}>
            <div className="absolute inset-0 rounded-3xl border-2 border-white/30" />
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-3xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-3xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-3xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-3xl" />
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover rounded-3xl opacity-0" />
          </div>
          <p className="text-white/50 text-xs mt-6">Point your camera at a DROPS QR code</p>
        </>
      )}
    </motion.div>
  );
}
