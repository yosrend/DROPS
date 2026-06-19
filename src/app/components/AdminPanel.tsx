import { useState, useEffect, useCallback } from "react";
import { getDrops, updateDrop, deleteDrop as deleteDropApi } from "../../services/dropsService";
import { Search, RefreshCw, LogOut, Globe, Monitor, Clock, Type, Image, Sticker, Trash2, Pin, EyeOff, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ADMIN_KEY = "drops_admin_session";

interface EnrichedCard {
  id: string;
  quote: string;
  handle: string;
  bg: string;
  type: string;
  imageData?: string;
  userName?: string;
  userRole?: string;
  deviceId?: string;
  createdAt?: string;
  isHidden?: boolean;
  isPinned?: boolean;
  isFeatured?: boolean;
  stickerLabel?: string;
  fontStyle?: string;
  themeId?: string;
}

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [loggedIn, setLoggedIn] = useState(() => sessionStorage.getItem(ADMIN_KEY) === "true");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cards, setCards] = useState<EnrichedCard[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "type">("newest");
  const [myIp, setMyIp] = useState("");
  const [myDevice, setMyDevice] = useState("");

  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(r => r.json())
      .then(d => setMyIp(d.ip))
      .catch(() => setMyIp("unknown"));
    setMyDevice(navigator.userAgent);
  }, []);

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getDrops();
      const enriched = all.map((c: any) => ({
        id: c.id,
        quote: c.quote || c.text_content || "",
        handle: c.handle || "@you",
        bg: c.bg || c.accentColor || "#7B61FF",
        type: c.type || "text",
        imageData: c.imageData || c.content_url,
        userName: c.userName || c.user_name || "",
        userRole: c.userRole || c.user_role || "",
        deviceId: c.deviceId || c.device_id || "",
        createdAt: c.createdAt || c.created_at || "",
        isHidden: c.isHidden ?? c.is_hidden ?? false,
        isPinned: c.isPinned ?? c.is_pinned ?? false,
        isFeatured: c.isFeatured ?? c.is_featured ?? false,
        stickerLabel: c.stickerLabel || c.sticker_label || "",
        fontStyle: c.fontStyle || c.font_style || "",
        themeId: c.themeId || c.theme_id || "",
      }));
      setCards(enriched);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    loadCards();
  }, [loggedIn, loadCards]);

  const handleLogin = () => {
    if (password === adminPassword) {
      sessionStorage.setItem(ADMIN_KEY, "true");
      setLoggedIn(true);
      setError("");
    } else {
      setError("Wrong password");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_KEY);
    setLoggedIn(false);
  };

  const deleteCard = async (id: string) => {
    await deleteDropApi(id);
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const toggleHidden = async (id: string) => {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    const hidden = !card.isHidden;
    await updateDrop(id, { is_hidden: hidden } as any);
    setCards(prev => prev.map(c => c.id === id ? { ...c, isHidden: hidden } : c));
  };

  const togglePinned = async (id: string) => {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    const pinned = !card.isPinned;
    await updateDrop(id, { is_pinned: pinned } as any);
    setCards(prev => prev.map(c => c.id === id ? { ...c, isPinned: pinned } : c));
  };

  const visible = cards.filter(c => !c.isHidden);
  const hidden = cards.filter(c => c.isHidden);
  const pinned = cards.filter(c => c.isPinned);
  const uniqueUsers = new Set(cards.map(c => c.deviceId || c.userName).filter(Boolean)).size;

  const processed = cards
    .filter(c => {
      if (filter === "visible" && c.isHidden) return false;
      if (filter === "hidden" && !c.isHidden) return false;
      if (filter === "pinned" && !c.isPinned) return false;
      if (filter === "featured" && !c.isFeatured) return false;
      if (search) {
        const q = search.toLowerCase();
        return c.quote.toLowerCase().includes(q) || c.userName?.toLowerCase().includes(q) || c.userRole?.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "type") return a.type.localeCompare(b.type);
      const ta = a.createdAt || "";
      const tb = b.createdAt || "";
      if (!ta && !tb) return 0;
      if (!ta) return 1;
      if (!tb) return -1;
      return sortBy === "newest" ? tb.localeCompare(ta) : ta.localeCompare(tb);
    });

  const typeIcon = (t: string) => {
    if (t === "image" || t === "gif") return <Image size={12} />;
    if (t === "sticker") return <Sticker size={12} />;
    return <Type size={12} />;
  };

  const formatDate = (d?: string) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return d; }
  };

  const textColor = (bg: string) => {
    const light = bg === "#FFCD29" || bg === "#F5F0E8" || bg === "#fc0" || bg === "#4cd964" || bg === "#5ac8fa" || bg === "#fff";
    return light ? "#111" : "#fff";
  };

  if (!adminPassword) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-8" style={{ fontFamily: "Inter,sans-serif", background: "rgba(0,0,0,0.92)", backdropFilter: "blur(20px)" }}>
        <div className="text-center">
          <p className="text-lg font-bold text-white">Admin</p>
          <p className="text-sm text-white/40 mt-2">Not configured. Set VITE_ADMIN_PASSWORD to enable.</p>
          <button onClick={onClose} className="mt-4 text-xs text-white/50 underline">Back</button>
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-8" style={{ fontFamily: "Inter,sans-serif", background: "rgba(0,0,0,0.92)", backdropFilter: "blur(20px)" }}>
        <div className="w-full max-w-[320px]">
          <p className="text-lg font-bold text-white mb-1">Admin</p>
          <p className="text-xs text-white/40 mb-4">Enter password to continue</p>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" autoFocus
            className="w-full h-10 rounded-xl px-3 text-sm outline-none text-white placeholder:text-white/20 mb-2"
            style={{ background: "rgba(255,255,255,0.08)" }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
          {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
          <Button onClick={handleLogin} className="w-full h-10 rounded-xl text-sm font-medium text-white" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(16px)" }}>Login</Button>
          <button onClick={onClose} className="w-full text-xs text-white/30 underline mt-3">Back to wall</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ fontFamily: "Inter,sans-serif", background: "rgba(0,0,0,0.92)", backdropFilter: "blur(20px)" }}>
      <div className="max-w-[720px] mx-auto p-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Dashboard</h1>
            <p className="text-xs text-white/40 mt-0.5">{cards.length} total drops · {hidden.length} hidden</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={loadCards} className="w-9 h-9 rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} style={{ color: loading ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)" }} />
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="px-3 h-9 rounded-xl text-xs font-medium flex items-center gap-1.5" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
              <LogOut size={12} /> Logout
            </Button>
            <Button onClick={onClose} className="px-4 h-9 rounded-xl text-xs font-medium text-white" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(16px)" }}>Back</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Drops", value: cards.length, color: "#7B61FF" },
            { label: "Visible", value: visible.length, color: "#4cd964" },
            { label: "Hidden", value: hidden.length, color: "#ff3b30" },
            { label: "Unique Users", value: uniqueUsers, color: "#007aff" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/35">{s.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/50">
            <span className="flex items-center gap-1.5"><Globe size={12} /> Your IP: <strong className="text-white">{myIp}</strong></span>
            <span className="flex items-center gap-1.5"><Monitor size={12} /> Device: <strong className="text-white truncate max-w-[200px]">{myDevice.slice(0, 60)}</strong></span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {["all", "visible", "hidden", "pinned"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 h-8 rounded-lg text-xs font-medium transition-colors"
              style={{ background: filter === f ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)", color: filter === f ? "#fff" : "rgba(255,255,255,0.5)" }}
            >{f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            className="h-8 rounded-lg px-2 text-xs font-medium outline-none"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="type">By type</option>
          </select>
          <div className="relative flex-1 min-w-[140px]">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.25)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cards, users…"
              className="w-full h-8 rounded-lg px-3 text-xs text-white placeholder:text-white/25 border-0"
              style={{ background: "rgba(255,255,255,0.06)", paddingLeft: 28 }}
            />
          </div>
        </div>

        {loading && <div className="text-center py-8 text-sm text-white/40"><RefreshCw size={16} className="inline animate-spin mr-2" />Loading drops…</div>}
        {!loading && processed.length === 0 && (
          <div className="text-center py-12">
            <div className="text-3xl mb-3 opacity-30">✦</div>
            <p className="text-sm font-medium text-white/40">No drops found</p>
          </div>
        )}

        {!loading && <div className="space-y-2">
          {processed.map(c => (
            <div key={c.id} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-[8px] font-bold overflow-hidden relative"
                    style={{ background: c.bg, color: textColor(c.bg) }}>
                    {c.imageData ? <img src={c.imageData} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <span className="leading-[1.1] text-center px-0.5">{c.quote.slice(0, 20)}</span>}
                    {c.isHidden && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><EyeOff size={14} color="#fff" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{c.quote || "(empty)"}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] text-white/40">
                          <span className="flex items-center gap-1">{typeIcon(c.type)}{c.type}</span>
                          {c.createdAt && <span className="flex items-center gap-1"><Clock size={10} />{formatDate(c.createdAt)}</span>}
                          {c.fontStyle && <span style={{ fontFamily: c.fontStyle }}>{c.fontStyle.split(",")[0]}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => togglePinned(c.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: c.isPinned ? "rgba(255,205,41,0.15)" : "transparent" }}>
                          <Pin size={12} style={{ color: c.isPinned ? "#fc0" : "rgba(255,255,255,0.2)" }} />
                        </button>
                        <button onClick={() => toggleHidden(c.id)}
                          className="w-14 h-7 rounded-full relative transition-colors" style={{ background: c.isHidden ? "rgba(255,255,255,0.12)" : "#34c759" }}>
                          <div className="w-[22px] h-[22px] rounded-full bg-white shadow absolute top-[3px] transition-transform"
                            style={{ left: c.isHidden ? "3px" : "calc(100% - 25px)" }} />
                        </button>
                        <button onClick={() => { if (confirm("Delete this drop?")) deleteCard(c.id); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-900/20 transition-colors">
                          <Trash2 size={12} style={{ color: "rgba(248,66,34,0.5)" }} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      {c.userName && (
                        <span className="flex items-center gap-1 text-white/60">
                          <svg width={10} height={10} viewBox="0 0 10 10"><circle cx="5" cy="3.5" r="2" fill="currentColor"/><path d="M1 9c0-2 1.8-3 4-3s4 1 4 3" stroke="currentColor" strokeWidth="0.8" fill="none"/></svg>
                          {c.userName}{c.userRole ? ` · ${c.userRole}` : ""}
                        </span>
                      )}
                      {c.deviceId && <span className="flex items-center gap-1 text-white/35"><Smartphone size={10} />{c.deviceId.slice(0, 12)}…</span>}
                      {!c.userName && !c.deviceId && <span className="text-white/25">Anonymous</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}
