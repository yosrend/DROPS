import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { X, Share2, QrCode } from "lucide-react";
import { getMyDrops, shareDropLink } from "../../services/dropsService";
import { getDeviceId } from "../../utils/device";
import { showToast } from "./Toast";
import type { UserCard } from "../data/defaults";

interface MyDropsProps {
  onClose: () => void;
  onViewQr?: (card: UserCard) => void;
}

export default function MyDrops({ onClose, onViewQr }: MyDropsProps) {
  const [drops, setDrops] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDrops = useCallback(async () => {
    setLoading(true);
    try {
      const deviceId = getDeviceId();
      const mine = await getMyDrops(deviceId);
      setDrops(mine);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadDrops(); }, [loadDrops]);

  const handleShare = (id: string) => {
    shareDropLink(id);
    showToast("Link copied");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)" }}
    >
      <div className="max-w-md mx-auto p-5 min-h-screen">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <h1 className="text-xl font-semibold text-white" style={{ fontFamily: "Inter,sans-serif" }}>My Drops</h1>
          <button onClick={onClose}
            className="flex items-center justify-center rounded-full"
            style={{ width: 40, height: 40, background: "rgba(255,255,255,0.08)" }}>
            <X size={16} color="#fff" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-white/40 text-sm">Loading...</div>
        ) : drops.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3 text-white/20">✦</div>
            <p className="text-white/40 text-sm">No drops yet</p>
            <p className="text-white/20 text-xs mt-1">Create your first drop!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {drops.map(card => (
              <div
                key={card.id}
                className="rounded-2xl overflow-hidden flex items-center gap-3 p-3"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                {/* Card preview */}
                <div className="w-14 h-20 rounded-xl overflow-hidden flex-shrink-0 flex flex-col justify-between"
                  style={{
                    background: card.bg ? `url(/cards/card-${card.themeId || "gradient"}.png) center/cover no-repeat` : card.accentColor || "#7B61FF",
                  }}
                >
                  <div className="flex-1 flex items-center p-1.5">
                    <p className="text-[7px] font-bold text-white leading-tight">{card.quote.slice(0, 30)}</p>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{card.displayName || card.userName || "Drop"}</p>
                  <p className="text-[11px] text-white/40 truncate">{card.handle || card.quote?.slice(0, 40)}</p>
                  <p className="text-[10px] text-white/20">{card.type} · {card.id?.slice(0, 8)}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5">
                  <button onClick={() => onViewQr?.(card)}
                    className="flex items-center justify-center rounded-xl"
                    style={{ width: 36, height: 36, background: "rgba(255,255,255,0.06)" }}>
                    <QrCode size={14} color="rgba(255,255,255,0.6)" />
                  </button>
                  <button onClick={() => handleShare(card.id)}
                    className="flex items-center justify-center rounded-xl"
                    style={{ width: 36, height: 36, background: "rgba(255,255,255,0.06)" }}>
                    <Share2 size={14} color="rgba(255,255,255,0.6)" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
