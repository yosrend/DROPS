import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { X, ExternalLink, Copy, Trash2 } from "lucide-react";
import { getFriends, removeFriend } from "../../services/dropsService";
import { getDeviceId } from "../../utils/device";
import { showToast } from "./Toast";
import type { FriendRecord } from "../../types/drop";

interface FriendListProps {
  onClose: () => void;
}

export default function FriendList({ onClose }: FriendListProps) {
  const [friends, setFriends] = useState<FriendRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const deviceId = getDeviceId();
      setFriends(await getFriends(deviceId));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (id: string) => {
    await removeFriend(id);
    setFriends(prev => prev.filter(f => f.id !== id));
    showToast("Friend removed");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)" }}
    >
      <div className="max-w-md mx-auto p-5 min-h-screen">

        <div className="flex items-center justify-between mb-6 pt-4">
          <h1 className="text-xl font-semibold text-white" style={{ fontFamily: "Inter,sans-serif" }}>Connections</h1>
          <button onClick={onClose}
            className="flex items-center justify-center rounded-full"
            style={{ width: 40, height: 40, background: "rgba(255,255,255,0.08)" }}>
            <X size={16} color="#fff" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-white/40 text-sm">Loading...</div>
        ) : friends.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3 text-white/20">✦</div>
            <p className="text-white/40 text-sm">No connections yet</p>
            <p className="text-white/20 text-xs mt-1">Scan a QR code to connect</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {friends.map(f => (
              <div key={f.id}
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
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
                  <button onClick={() => handleRemove(f.id)}
                    className="flex items-center justify-center rounded-xl"
                    style={{ width: 32, height: 32, background: "rgba(255,255,255,0.06)" }}>
                    <Trash2 size={12} color="rgba(255,255,255,0.3)" />
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
