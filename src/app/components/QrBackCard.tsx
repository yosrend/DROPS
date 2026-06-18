import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { motion } from "motion/react";
import { shareDropLink } from "../../services/dropsService";

interface QrBackCardProps {
  dropId: string;
  displayName?: string;
  handle?: string;
  profileUrl?: string;
  onFlipBack: () => void;
}

export default function QrBackCard({ dropId, displayName, handle, profileUrl, onFlipBack }: QrBackCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrUrl = profileUrl || `${window.location.href.split("?")[0]}?drop=${dropId}`;

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, qrUrl, {
      width: 200,
      margin: 2,
      color: { dark: "#ffffff", light: "#00000000" },
    });
  }, [qrUrl]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 rounded-[18px] flex flex-col items-center justify-center gap-3 p-5"
      style={{
        background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        backfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
      }}
    >
      <canvas ref={canvasRef} className="rounded-xl" style={{ width: 140, height: 140 }} />
      <p className="text-sm font-semibold text-white/90">{displayName || handle || "Drop"}</p>
      {handle && <p className="text-[11px] text-white/50 -mt-2">{handle}</p>}
      <p className="text-[10px] text-white/40 tracking-wider uppercase mt-1">Scan to connect</p>

      <div className="flex gap-2 mt-1">
        <button
          onClick={onFlipBack}
          className="px-4 py-2 rounded-xl text-[11px] font-medium transition-all hover:scale-105"
          style={{
            background: "rgba(255,255,255,0.1)",
            color: "#fff",
            backdropFilter: "blur(8px)",
          }}
        >
          Flip back
        </button>
        <button
          onClick={() => shareDropLink(dropId)}
          className="px-4 py-2 rounded-xl text-[11px] font-medium transition-all hover:scale-105"
          style={{
            background: "rgba(255,255,255,0.1)",
            color: "#fff",
            backdropFilter: "blur(8px)",
          }}
        >
          Share
        </button>
      </div>
    </motion.div>
  );
}
