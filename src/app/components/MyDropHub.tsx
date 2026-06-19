import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Share2, QrCode, ExternalLink, Trash2, Plus } from "lucide-react";
import { getMyDrops, shareDropLink, getFriends, removeFriend } from "../../services/dropsService";
import { getDeviceId } from "../../utils/device";
import { showToast } from "./Toast";
import QrBackCard from "./QrBackCard";
import type { UserCard } from "../data/defaults";
import type { FriendRecord } from "../../types/drop";

interface MyDropHubProps {
  onClose: () => void;
  onAddCard: () => void;
}

export default function MyDropHub({ onClose, onAddCard }: MyDropHubProps) {
  const [tab, setTab] = useState<"mycard" | "friends">("mycard");
  const [myCard, setMyCard] = useState<UserCard | null>(null);
  const [friends, setFriends] = useState<FriendRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const deviceId = getDeviceId();
      const mine = await getMyDrops(deviceId);
      setMyCard(mine[0] || null);
      setFriends(await getFriends(deviceId));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRemoveFriend = async (id: string) => {
    await removeFriend(id);
    setFriends(prev => prev.filter(f => f.id !== id));
    showToast("Friend removed");
  };

  const handleShare = (id: string) => {
    shareDropLink(id);
    showToast("Link copied");
  };

  if (showQr && myCard) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(20px)" }}
        onClick={() => setShowQr(false)}
      >
        <div className="relative" onClick={e => e.stopPropagation()}>
          <button onClick={() => setShowQr(false)}
            className="absolute -top-12 right-0 flex items-center justify-center rounded-full"
            style={{ width: 36, height: 36, background: "rgba(255,255,255,0.08)" }}>
            <X size={14} color="#fff" />
          </button>
          <QrBackCard
            dropId={myCard.id}
            displayName={myCard.displayName || myCard.userName}
            handle={myCard.handle}
            profileUrl={(myCard as any).profileUrl}
            onFlipBack={() => setShowQr(false)}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)" }}
    >
      <div className="max-w-md mx-auto p-5 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <h1 className="text-xl font-semibold text-white" style={{ fontFamily: "Inter,sans-serif" }}>
            {tab === "mycard" ? "My Drop" : "Friends"}
          </h1>
          <button onClick={onClose}
            className="flex items-center justify-center rounded-full"
            style={{ width: 40, height: 40, background: "rgba(255,255,255,0.08)" }}>
            <X size={16} color="#fff" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "mycard" as const, label: "My Card" },
            { key: "friends" as const, label: "Friends" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 py-3 rounded-2xl text-sm font-medium transition-all"
              style={{
                background: tab === t.key ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                color: tab === t.key ? "#fff" : "rgba(255,255,255,0.4)",
              }}
            >{t.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-white/40 text-sm">Loading...</div>
        ) : tab === "mycard" ? (
          /* ── My Card Tab ── */
          myCard ? (
            <div className="flex flex-col items-center gap-6 pt-4">
              {/* Card preview */}
              <div className="relative overflow-hidden rounded-[18px] flex flex-col justify-between cursor-pointer transition-transform hover:scale-[1.02]"
                style={{
                  width: 280, height: 400,
                  background: myCard.themeId
                    ? `url(/cards/card-${myCard.themeId}.png) center/cover no-repeat`
                    : myCard.bg || "#7B61FF",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
                }}
                onClick={() => setShowQr(true)}
              >
                <div className="flex-1 flex items-center p-5">
                  <p className="font-bold text-xl leading-tight break-words text-white"
                    style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)", fontFamily: myCard.fontStyle || undefined }}>
                    {myCard.quote}
                  </p>
                </div>
                <div className="px-4 pb-4 flex justify-between items-end">
                  <span className="text-xs font-medium text-white/80">{myCard.userName || "You"}</span>
                  {myCard.userRole && <span className="text-[10px] text-white/50">{myCard.userRole}</span>}
                </div>
                {/* Flip hint */}
                <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.15)" }}>
                  <QrCode size={14} color="#fff" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowQr(true)}
                  className="flex-1 py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>
                  <QrCode size={14} /> Show QR
                </button>
                <button onClick={() => handleShare(myCard.id)}
                  className="flex-1 py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>
                  <Share2 size={14} /> Share
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-4xl mb-3 text-white/20">✦</div>
              <p className="text-white/40 text-sm mb-4">No drops yet</p>
              <button onClick={onAddCard}
                className="px-6 py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 mx-auto"
                style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(16px)", color: "#fff" }}>
                <Plus size={14} /> Create your first drop
              </button>
            </div>
          )
        ) : (
          /* ── Friends Tab ── */
          friends.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-3 text-white/20">✦</div>
              <p className="text-white/40 text-sm">No connections yet</p>
              <p className="text-white/20 text-xs mt-1">Scan a QR code to connect</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {friends.map(f => (
                <div key={f.id} className="rounded-2xl p-4 flex items-center gap-3"
                  style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={{ background: "rgba(255,255,255,0.08)" }}>
                    {f.friend_name?.charAt(0) || "✦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{f.friend_name}</p>
                    {f.friend_handle && <p className="text-[11px] text-white/40 truncate">{f.friend_handle}</p>}
                    <p className="text-[9px] text-white/20">Connected {new Date(f.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1">
                    {f.friend_profile_url && (
                      <button onClick={() => window.open(f.friend_profile_url, "_blank")}
                        className="flex items-center justify-center rounded-xl"
                        style={{ width: 32, height: 32, background: "rgba(255,255,255,0.06)" }}>
                        <ExternalLink size={12} color="rgba(255,255,255,0.5)" />
                      </button>
                    )}
                    <button onClick={() => handleRemoveFriend(f.id)}
                      className="flex items-center justify-center rounded-xl"
                      style={{ width: 32, height: 32, background: "rgba(255,255,255,0.06)" }}>
                      <Trash2 size={12} color="rgba(255,255,255,0.3)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </motion.div>
  );
}
