import { useState, useEffect } from "react";
import { getDeviceId } from "../../utils/device";
import { CARDS_KEY, type UserCard } from "../data/defaults";

const ADMIN_KEY = "drops_admin_session";

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [loggedIn, setLoggedIn] = useState(() => sessionStorage.getItem(ADMIN_KEY) === "true");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cards, setCards] = useState<UserCard[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

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

  useEffect(() => {
    if (!loggedIn) return;
    const stored = localStorage.getItem(CARDS_KEY);
    try { setCards(stored ? JSON.parse(stored) : []); } catch { setCards([]); }
  }, [loggedIn]);

  const deleteCard = (id: string) => {
    // update localStorage
    const updated = cards.filter(c => c.id !== id);
    localStorage.setItem(CARDS_KEY, JSON.stringify(updated));
    setCards(updated);
  };

  const toggleHidden = (id: string) => {
    const updated = cards.map(c => c.id === id ? { ...c, isHidden: !(c as any).isHidden } : c);
    localStorage.setItem(CARDS_KEY, JSON.stringify(updated));
    setCards(updated);
  };

  const filteredCards = cards.filter(c => {
    if (filter === "hidden" && !(c as any).isHidden) return false;
    if (filter === "visible" && (c as any).isHidden) return false;
    if (filter === "pinned" && !(c as any).isPinned) return false;
    if (filter === "featured" && !(c as any).isFeatured) return false;
    if (search && !c.quote?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (!adminPassword) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-8" style={{ fontFamily: "Inter,sans-serif" }}>
        <div className="text-center">
          <p className="text-lg font-bold text-[#111]">Admin</p>
          <p className="text-sm text-[rgba(17,17,17,0.4)] mt-2">Not configured. Set VITE_ADMIN_PASSWORD to enable.</p>
          <button onClick={onClose} className="mt-4 text-xs text-[#7B61FF] underline">Back</button>
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-8" style={{ fontFamily: "Inter,sans-serif" }}>
        <div className="w-full max-w-[320px]">
          <p className="text-lg font-bold text-[#111] mb-1">Admin</p>
          <p className="text-xs text-[rgba(17,17,17,0.4)] mb-4">Enter password to continue</p>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password" autoFocus
            className="w-full h-10 rounded-xl px-3 text-sm outline-none bg-[rgba(17,17,17,0.05)] text-[#111] mb-2"
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <button onClick={handleLogin} className="w-full h-10 rounded-xl text-sm font-medium bg-[#111] text-white">Login</button>
          <button onClick={onClose} className="w-full text-xs text-[rgba(17,17,17,0.35)] underline mt-3">Back to wall</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto" style={{ fontFamily: "Inter,sans-serif" }}>
      <div className="max-w-[600px] mx-auto p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-lg font-bold text-[#111]">Admin</p>
            <p className="text-xs text-[rgba(17,17,17,0.4)]">{cards.length} drops · {cards.filter(c => (c as any).isHidden).length} hidden</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleLogout} className="px-4 h-9 rounded-xl text-xs font-medium bg-[rgba(17,17,17,0.06)] text-[rgba(17,17,17,0.5)]">Logout</button>
            <button onClick={onClose} className="px-4 h-9 rounded-xl text-xs font-medium bg-[#111] text-white">Back</button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {["all", "visible", "hidden", "pinned", "featured"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 h-8 rounded-lg text-xs font-medium flex-shrink-0"
              style={{ background: filter === f ? "#7B61FF" : "rgba(17,17,17,0.05)", color: filter === f ? "#fff" : "rgba(17,17,17,0.5)" }}
            >{f}</button>
          ))}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="h-8 rounded-lg px-3 text-xs outline-none bg-[rgba(17,17,17,0.05)] text-[#111] placeholder:text-[rgba(17,17,17,0.25)] flex-shrink-0 w-[120px]"
          />
        </div>

        {/* Card list */}
        {filteredCards.length === 0 && (
          <div className="text-center py-10 text-sm text-[rgba(17,17,17,0.4)]">No drops found</div>
        )}
        <div className="space-y-2">
          {filteredCards.map(c => (
            <div key={c.id} className="rounded-2xl p-3 border border-[rgba(17,17,17,0.06)]" style={{ background: c.bg || "#f5f5f5" }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-white" style={{ color: c.bg === "#FFCD29" || c.bg === "#F5F0E8" ? "#111" : "#fff" }}>
                    {c.quote || "(no text)"}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: c.bg === "#FFCD29" || c.bg === "#F5F0E8" ? "rgba(17,17,17,0.4)" : "rgba(255,255,255,0.5)" }}>
                    {c.type} · {c.id?.slice(0, 8)}… · {c.userName || "?"} · {c.userRole || "?"}
                  </p>
                  {c.imageData && <p className="text-[9px] text-white/40 mt-0.5 truncate">📎 has image</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => toggleHidden(c.id)} className="px-2 h-7 rounded-lg text-[10px] font-medium"
                    style={{ background: (c as any).isHidden ? "rgba(248,66,34,0.1)" : "rgba(17,17,17,0.06)", color: (c as any).isHidden ? "#F24822" : "rgba(17,17,17,0.5)" }}>
                    {(c as any).isHidden ? "Hidden" : "Visible"}
                  </button>
                  <button onClick={() => { if (confirm("Delete this drop?")) deleteCard(c.id); }} className="px-2 h-7 rounded-lg text-[10px] font-medium bg-red-50 text-red-400">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
