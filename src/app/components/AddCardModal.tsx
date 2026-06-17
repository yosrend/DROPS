import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { X, Image, Type, Sticker, ArrowRight, RotateCw, Camera, Trash2, Layers } from "lucide-react";
import { MAX_CARDS, type UserCard } from "../data/defaults";
import { Button } from "../../components/ui/button";

type Tab = "text" | "image" | "gif" | "sticker";

interface AddCardModalProps {
  onClose: () => void;
  onPost: (card: UserCard) => void;
  cardCount: number;
}

interface CardElem {
  id: string;
  type: "text" | "image" | "sticker";
  x: number; y: number; w: number; h: number;
  rotation: number; zIndex: number;
  content: string;
  imageData?: string;
  color?: string;
  fontFamily?: string;
  strokeWidth?: number;
  strokeColor?: string;
}

const THEMES = [
  { id: "glass", label: "Glass", style: { background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.2)" } },
  { id: "chrome", label: "Chrome", style: { background: "linear-gradient(135deg, #868686, #c0c0c0, #e8e8e8, #a0a0a0)" } },
  { id: "heatmap", label: "Heatmap", style: { background: "linear-gradient(135deg, #ff006e, #f24822, #ffcd29)" } },
  { id: "holographic", label: "Holo", style: { backgroundImage: "url(/cards/card-holographic.png)", backgroundSize: "cover", backgroundPosition: "center" } },
  { id: "normal", label: "Normal", style: { background: "#7B61FF" } },
];

const FONTS = [
  { id: "sans", label: "Sans", family: "Inter, sans-serif" },
  { id: "serif", label: "Serif", family: "Georgia, serif" },
  { id: "mono", label: "Mono", family: '"Courier New", monospace' },
  { id: "hand", label: "Hand", family: '"Comic Sans MS", cursive' },
];

const TEXT_COLORS = ["#fff", "#111", "#7B61FF", "#F24822", "#1ABCFE", "#FFCD29", "#0FA958"];
const STROKE_SIZES = [0, 1, 2, 3, 4];

const STICKER_LIST = [
  { id: "star", label: "⭐" }, { id: "heart", label: "❤️" }, { id: "fire", label: "🔥" },
  { id: "sparkle", label: "✨" }, { id: "wave", label: "👋" }, { id: "rocket", label: "🚀" },
  { id: "party", label: "🎉" }, { id: "rainbow", label: "🌈" }, { id: "crown", label: "👑" },
  { id: "light", label: "💡" }, { id: "config", label: "✦" }, { id: "drops", label: "💧" },
];

function genId() { return crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export default function AddCardModal({ onClose, onPost, cardCount }: AddCardModalProps) {
  const [step, setStep] = useState<"creating" | "success">("creating");
  const [tab, setTab] = useState<Tab>("text");
  const [themeIdx, setThemeIdx] = useState(4);

  // elements in the card
  const [elements, setElements] = useState<CardElem[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [nextZ, setNextZ] = useState(1);

  // selected element editing state
  const [textContent, setTextContent] = useState("");
  const [fontIdx, setFontIdx] = useState(0);
  const [textColorIdx, setTextColorIdx] = useState(0);
  const [strokeWeightIdx, setStrokeWeightIdx] = useState(0);
  const [strokeColorIdx, setStrokeColorIdx] = useState(0);
  const [imagePreview, setImagePreview] = useState("");
  const [stickerIdx, setStickerIdx] = useState(0);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  // camera
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [submittedCard, setSubmittedCard] = useState<UserCard | null>(null);

  const [gifShots, setGifShots] = useState<string[]>([]);
  const [gifPreview, setGifPreview] = useState("");

  const selEl = elements.find(e => e.id === selId) || null;

  const isAtLimit = cardCount >= MAX_CARDS;
  const currentTheme = THEMES[themeIdx];

  // drag element
  const dragEl = useRef({ id: "", active: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });
  const resizeEl = useRef({ id: "", active: false, startX: 0, startY: 0, baseW: 0, baseH: 0, dir: "" });

  const updateElement = useCallback((id: string, patch: Partial<CardElem>) => {
    setElements(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      setShowCamera(true);
    } catch { /* no camera */ }
  };
  const stopCamera = () => { streamRef.current?.getTracks().forEach(t => t.stop()); setShowCamera(false); };

  useEffect(() => {
    if (showCamera && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
  }, [showCamera]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const c = document.createElement("canvas"); c.width = 320; c.height = 240;
    c.getContext("2d")?.drawImage(videoRef.current!, 0, 0);
    return c.toDataURL("image/png");
  };

  // Add element from tab content
  const addElement = (type: CardElem["type"]) => {
    const id = genId();
    const base: CardElem = { id, type, x: 10, y: 10, w: 80, h: 50, rotation: 0, zIndex: nextZ, content: "" };
    if (type === "text") {
      if (!textContent.trim()) return;
      base.content = textContent;
      base.color = TEXT_COLORS[textColorIdx];
      base.fontFamily = FONTS[fontIdx].family;
      base.strokeWidth = STROKE_SIZES[strokeWeightIdx];
      base.strokeColor = TEXT_COLORS[strokeColorIdx];
    } else if (type === "image") {
      if (!imagePreview) return;
      base.imageData = imagePreview;
      base.content = "📷";
    } else if (type === "sticker") {
      base.content = STICKER_LIST[stickerIdx].label;
    }
    setElements(prev => [...prev, base]);
    setSelId(id);
    setNextZ(z => z + 1);
  };

  const removeElement = (id: string) => {
    setElements(prev => prev.filter(e => e.id !== id));
    if (selId === id) setSelId(null);
  };

  const bringToFront = (id: string) => {
    setNextZ(z => z + 1);
    updateElement(id, { zIndex: nextZ });
  };

  // Pointer handlers for drag
  const onCardPointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    setSelId(id);
    const el = elements.find(ev => ev.id === id);
    if (!el) return;
    dragEl.current = { id, active: true, startX: e.clientX, startY: e.clientY, baseX: el.x, baseY: el.y };
  };
  const onCardPointerMove = (e: React.PointerEvent) => {
    if (!dragEl.current.active) return;
    updateElement(dragEl.current.id, {
      x: dragEl.current.baseX + (e.clientX - dragEl.current.startX),
      y: dragEl.current.baseY + (e.clientY - dragEl.current.startY),
    });
  };
  const onCardPointerUp = () => { dragEl.current.active = false; };

  // Resize handlers
  const onResizeStart = (e: React.PointerEvent, id: string, dir: string) => {
    e.stopPropagation();
    const el = elements.find(ev => ev.id === id);
    if (!el) return;
    resizeEl.current = { id, active: true, startX: e.clientX, startY: e.clientY, baseW: el.w, baseH: el.h, dir };
  };
  const onResizeMove = (e: React.PointerEvent) => {
    if (!resizeEl.current.active) return;
    const dx = e.clientX - resizeEl.current.startX;
    const dy = e.clientY - resizeEl.current.startY;
    const dir = resizeEl.current.dir;
    let nw = resizeEl.current.baseW, nh = resizeEl.current.baseH;
    if (dir.includes("e")) nw = Math.max(15, resizeEl.current.baseW + dx * 0.4);
    if (dir.includes("w")) nw = Math.max(15, resizeEl.current.baseW - dx * 0.4);
    if (dir.includes("s")) nh = Math.max(15, resizeEl.current.baseH + dy * 0.4);
    if (dir.includes("n")) nh = Math.max(15, resizeEl.current.baseH - dy * 0.4);
    updateElement(resizeEl.current.id, { w: nw, h: nh });
  };
  const onResizeEnd = () => { resizeEl.current.active = false; };

  // handle tab add vs edit
  const handleTabAction = () => {
    if (selEl?.type === tab) {
      // update selected element
      if (tab === "text") updateElement(selEl.id, { content: textContent, color: TEXT_COLORS[textColorIdx], fontFamily: FONTS[fontIdx].family, strokeWidth: STROKE_SIZES[strokeWeightIdx], strokeColor: TEXT_COLORS[strokeColorIdx] });
      else if (tab === "image" && imagePreview) updateElement(selEl.id, { imageData: imagePreview });
      else if (tab === "sticker") updateElement(selEl.id, { content: STICKER_LIST[stickerIdx].label });
    } else {
      addElement(tab);
    }
  };

  const handleSubmit = () => {
    if (isAtLimit) return;
    const allText = elements.map(e => e.content).filter(Boolean).join(" | ") || "✦";
    const card: UserCard = {
      bg: currentTheme.id, quote: allText, handle: "@" + (userName || "you"),
      type: "text", accentColor: currentTheme.id, cardSkin: currentTheme.id,
      id: genId(), userName, userRole, themeId: currentTheme.id,
    };
    setSubmittedCard(card); onPost(card); setStep("success");
  };

  const previewFontFamily = FONTS[fontIdx].family;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[500] flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="relative w-full md:max-w-[520px] max-h-[92vh] md:rounded-3xl rounded-t-3xl overflow-y-auto overflow-x-hidden bg-white"
        style={{ fontFamily: "Inter, sans-serif" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-black/5 px-5 pt-4 pb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#111]">Drop your card</p>
            <p className="text-[11px] text-[rgba(17,17,17,0.35)]">{cardCount} of {MAX_CARDS} cards</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5"><X size={14} color="rgba(17,17,17,0.5)" /></button>
        </div>

        <div className="p-4 space-y-4">
          {step === "success" && submittedCard ? (
            <SuccessView card={submittedCard} onClose={onClose} />
          ) : isAtLimit ? (
            <div className="text-center py-10"><div className="text-4xl mb-4">✨</div>
              <p className="text-lg font-bold text-[#111]">You've dropped your mark</p>
              <p className="text-sm text-[rgba(17,17,17,0.4)] mt-1">Come back and explore!</p>
            </div>
          ) : (
            <>
              {/* Theme carousel - swipe left/right */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 snap-x snap-mandatory"
                style={{ scrollBehavior: "smooth" }}>
                {THEMES.map((t, i) => (
                  <div key={t.id} onClick={() => setThemeIdx(i)}
                    className="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-[9px] font-medium snap-start cursor-pointer transition-all"
                    style={{ ...t.style, outline: themeIdx === i ? "2px solid #7B61FF" : "2px solid transparent", outlineOffset: 2, color: t.id === "glass" ? "#111" : "#fff" }}
                  >{t.label}</div>
                ))}
              </div>

              {/* Card canvas with layered elements */}
              <div className="flex justify-center">
                <div className="relative overflow-hidden select-none"
                  style={{ width: "min(100%, 280px)", aspectRatio: "7/10", borderRadius: 14, ...currentTheme.style, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", touchAction: "none", color: currentTheme.id === "glass" ? "#111" : "#fff" }}
                >
                  {/* Name + role (always rendered) */}
                  <div className={`absolute bottom-2 left-3 right-3 flex justify-between items-end z-[999] text-[9px] ${currentTheme.id === "glass" ? "text-[#111]" : "text-white/80"}`}>
                    <span className="font-medium">{userName || "name"}</span>
                    <span className="opacity-60 text-right">{userRole || "role"}</span>
                  </div>

                  {/* Elements layer */}
                  {elements.map(el => (
                    <div key={el.id}
                      className={`absolute rounded-xl cursor-move ${selId === el.id ? "ring-2 ring-[#7B61FF]" : ""}`}
                      style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%`, zIndex: el.zIndex, transform: `rotate(${el.rotation}deg)` }}
                      onPointerDown={e => onCardPointerDown(e, el.id)}
                      onPointerMove={onCardPointerMove}
                      onPointerUp={onCardPointerUp}
                      onPointerLeave={onCardPointerUp}
                    >
                      {el.type === "text" && (
                        <div className="w-full h-full flex items-center justify-center text-center text-sm font-bold leading-tight p-1 overflow-hidden"
                          style={{ fontFamily: el.fontFamily, color: el.color, WebkitTextStroke: (el.strokeWidth || 0) > 0 ? `${el.strokeWidth}px ${el.strokeColor || "#000"}` : undefined }}
                        >{el.content}</div>
                      )}
                      {el.type === "image" && el.imageData && (
                        <img src={el.imageData} alt="" className="w-full h-full object-cover rounded-xl" />
                      )}
                      {el.type === "sticker" && (
                        <div className="w-full h-full flex items-center justify-center text-3xl">{el.content}</div>
                      )}

                      {/* Resize handles on selected */}
                      {selId === el.id && (
                        <div className="absolute inset-0 pointer-events-none">
                          {["nw", "n", "ne", "e", "se", "s", "sw", "w"].map(d => (
                            <div key={d}
                              className="absolute w-2.5 h-2.5 rounded-full bg-white border-2 border-[#7B61FF] shadow pointer-events-auto"
                              style={{
                                ...(d.includes("n") ? { top: -4 } : d.includes("s") ? { bottom: -4 } : { top: "calc(50% - 5px)" }),
                                ...(d.includes("w") ? { left: -4 } : d.includes("e") ? { right: -4 } : { left: "calc(50% - 5px)" }),
                                cursor: `${d}-resize`,
                              }}
                              onPointerDown={e => onResizeStart(e, el.id, d)}
                              onPointerMove={onResizeMove}
                              onPointerUp={onResizeEnd}
                              onPointerLeave={onResizeEnd}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Empty state */}
                  {elements.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-white/30 text-[11px]">
                      Add text, image or sticker
                    </div>
                  )}
                </div>
              </div>

              {/* Element layer controls */}
              {elements.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-[rgba(17,17,17,0.5)] -my-1">
                  <Layers size={12} />
                  <span>{elements.length} element{elements.length > 1 ? "s" : ""}</span>
                  {selEl && (
                    <>
                      <button onClick={() => updateElement(selEl.id, { rotation: (selEl.rotation || 0) - 15 })} className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-black/5 hover:bg-black/10"><RotateCw size={12} /> Rotate</button>
                      <button onClick={() => bringToFront(selEl.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/5 hover:bg-black/10"><Layers size={12} /> Front</button>
                      <button onClick={() => removeElement(selEl.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-400 hover:bg-red-100"><Trash2 size={12} /> Remove</button>
                    </>
                  )}
                </div>
              )}

              {/* Tab bar */}
              <div className="flex gap-1 bg-[rgba(17,17,17,0.04)] rounded-2xl p-1">
                {([{ key: "text", label: "Text", icon: <Type size={16} /> },
                   { key: "image", label: "Image", icon: <Image size={16} /> },
                   { key: "sticker", label: "Sticker", icon: <Sticker size={16} /> }] as const).map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    className="flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-xs font-medium transition-all"
                    style={{ background: tab === t.key ? "#fff" : "transparent", color: tab === t.key ? "#7B61FF" : "rgba(17,17,17,0.5)", boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}
                  >{t.icon}{t.label}</button>
                ))}
              </div>

              {/* Tab content + Add to card button */}
              {tab === "text" && (
                <div className="space-y-3">
                  <textarea value={textContent} onChange={e => setTextContent(e.target.value)}
                    placeholder="Type something…" maxLength={140} rows={2}
                    className="w-full rounded-2xl px-4 py-3 text-sm resize-none outline-none bg-[rgba(17,17,17,0.05)] text-[#111]"
                  />
                  <div className="flex flex-wrap gap-3">
                    <div>
                      <p className="text-[10px] font-semibold text-[rgba(17,17,17,0.35)] uppercase mb-1">Font</p>
                      <div className="flex gap-1">
                        {FONTS.map((f, i) => (
                          <button key={f.id} onClick={() => setFontIdx(i)}
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                            style={{ background: fontIdx === i ? "rgba(123,97,255,0.12)" : "rgba(17,17,17,0.05)", color: fontIdx === i ? "#7B61FF" : "rgba(17,17,17,0.5)", fontFamily: f.family }}
                          >{f.label}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-[rgba(17,17,17,0.35)] uppercase mb-1">Color</p>
                      <div className="flex gap-1">
                        {TEXT_COLORS.map((c, i) => (
                          <button key={i} onClick={() => setTextColorIdx(i)}
                            className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                            style={{ background: c, outline: textColorIdx === i ? "2px solid #7B61FF" : "2px solid transparent", outlineOffset: 2, boxShadow: c === "#fff" ? "0 0 0 1px rgba(0,0,0,0.1)" : "none" }}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-[rgba(17,17,17,0.35)] uppercase mb-1">Stroke</p>
                      <div className="flex gap-1">
                        {STROKE_SIZES.map((s, i) => (
                          <button key={i} onClick={() => setStrokeWeightIdx(i)}
                            className="w-6 h-6 rounded-lg text-[10px] font-medium transition-all"
                            style={{ background: strokeWeightIdx === i ? "rgba(123,97,255,0.12)" : "rgba(17,17,17,0.05)", color: strokeWeightIdx === i ? "#7B61FF" : "rgba(17,17,17,0.5)" }}
                          >{s === 0 ? "–" : s}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={handleTabAction}
                    className="w-full h-11 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
                    style={{ background: textContent.trim() ? "#7B61FF" : "rgba(123,97,255,0.2)", color: textContent.trim() ? "#fff" : "rgba(123,97,255,0.4)", cursor: textContent.trim() ? "pointer" : "not-allowed" }}
                    disabled={!textContent.trim()}
                  ><Type size={15} /> {selEl?.type === "text" ? "Update text" : "Add text"}</button>
                </div>
              )}

              {tab === "image" && (
                <div className="space-y-3">
                  <input ref={fileRef} type="file" accept="image/*" onChange={e => {
                    const f = e.target.files?.[0]; if (f) { setImagePreview(URL.createObjectURL(f)); }
                  }} className="hidden" />
                  <div className="flex gap-2">
                    <button onClick={() => fileRef.current?.click()} className="flex-1 h-16 rounded-2xl border-2 border-dashed border-[rgba(17,17,17,0.12)] flex items-center justify-center gap-2 text-sm text-[rgba(17,17,17,0.4)] hover:border-[#7B61FF] hover:text-[#7B61FF] transition-colors">
                      <Image size={18} /> Gallery
                    </button>
                    <button onClick={startCamera} className="flex-1 h-16 rounded-2xl border-2 border-dashed border-[rgba(17,17,17,0.12)] flex items-center justify-center gap-2 text-sm text-[rgba(17,17,17,0.4)] hover:border-[#7B61FF] hover:text-[#7B61FF] transition-colors">
                      <Camera size={18} /> Capture
                    </button>
                  </div>
                  {imagePreview && <img src={imagePreview} alt="" className="w-full h-24 rounded-2xl object-cover" />}
                  {showCamera && (
                    <div className="relative rounded-2xl overflow-hidden bg-black">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-36 object-cover" />
                      <button onClick={() => { const d = capturePhoto(); if (d) { setImagePreview(d); stopCamera(); } }} className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white/80 flex items-center justify-center"><div className="w-8 h-8 rounded-full bg-white border-2 border-[#111]" /></button>
                    </div>
                  )}
                  <button onClick={handleTabAction} disabled={!imagePreview}
                    className="w-full h-11 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
                    style={{ background: imagePreview ? "#7B61FF" : "rgba(123,97,255,0.2)", color: imagePreview ? "#fff" : "rgba(123,97,255,0.4)", cursor: imagePreview ? "pointer" : "not-allowed" }}
                  ><Image size={15} /> {selEl?.type === "image" ? "Update image" : "Add image"}</button>
                </div>
              )}

              {tab === "sticker" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    {STICKER_LIST.map((s, i) => (
                      <button key={s.id} onClick={() => setStickerIdx(i)}
                        className="h-14 rounded-2xl flex items-center justify-center text-2xl transition-all"
                        style={{ background: stickerIdx === i ? "rgba(123,97,255,0.12)" : "rgba(17,17,17,0.04)", outline: stickerIdx === i ? "2px solid #7B61FF" : "2px solid transparent" }}
                      >{s.label}</button>
                    ))}
                  </div>
                  <button onClick={handleTabAction}
                    className="w-full h-11 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 bg-[#7B61FF] text-white"
                  ><Sticker size={15} /> {selEl?.type === "sticker" ? "Update sticker" : "Add sticker"}</button>
                </div>
              )}

              {/* User info */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-[rgba(17,17,17,0.35)] uppercase mb-1">Name</p>
                  <input value={userName} onChange={e => setUserName(e.target.value)} placeholder="Your name" maxLength={20}
                    className="w-full h-10 rounded-xl px-3 text-sm outline-none bg-[rgba(17,17,17,0.05)] text-[#111] placeholder:text-[rgba(17,17,17,0.25)]"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-[rgba(17,17,17,0.35)] uppercase mb-1">Role</p>
                  <input value={userRole} onChange={e => setUserRole(e.target.value)} placeholder="e.g. Product Designer" maxLength={30}
                    className="w-full h-10 rounded-xl px-3 text-sm outline-none bg-[rgba(17,17,17,0.05)] text-[#111] placeholder:text-[rgba(17,17,17,0.25)]"
                  />
                </div>
              </div>

              {/* Submit */}
              <Button onClick={handleSubmit} disabled={elements.length === 0} className="w-full h-12 text-sm font-semibold"
                style={{ cursor: elements.length > 0 ? "pointer" : "not-allowed" }}
              >Drop it <ArrowRight size={15} /></Button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Success view
function SuccessView({ card, onClose }: { card: UserCard; onClose: () => void }) {
  return (
    <div className="text-center relative overflow-hidden py-6">
      {Array.from({ length: 22 }).map((_, i) => (
        <motion.div key={i} className="absolute pointer-events-none"
          style={{ width: i % 3 === 0 ? 8 : 5, height: i % 3 === 0 ? 8 : 5, borderRadius: i % 2 === 0 ? "50%" : 2, background: ["#7B61FF", "#F24822", "#1ABCFE", "#FFCD29", "#fff", "#7B61FF", "#F24822"][i % 7], left: `${6 + (i * 4.2) % 88}%`, top: -10 }}
          animate={{ y: [0, 280 + (i % 5) * 30], x: [(i % 2 === 0 ? 1 : -1) * ((i * 7) % 40)], rotate: [0, (i % 2 === 0 ? 1 : -1) * (180 + (i * 30) % 180)], opacity: [1, 1, 0] }}
          transition={{ duration: 1.2 + (i % 4) * 0.25, delay: (i % 6) * 0.08, ease: "easeIn" }}
        />
      ))}
      <div className="flex justify-center pt-4 mb-5">
        <motion.div className="relative flex flex-col justify-between overflow-hidden p-4"
          style={{ width: 160, height: 229, borderRadius: 14, background: "#7B61FF", boxShadow: "0 16px 56px rgba(0,0,0,0.15)", fontFamily: "Inter,sans-serif" }}
          initial={{ scale: 0.65, rotate: -8, opacity: 0, y: 20 }}
          animate={{ scale: 1, rotate: 4, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}
        >
          <div className="flex-1 flex items-center justify-center text-center text-sm font-bold text-white leading-tight px-1 pt-4">{card.quote}</div>
          <div className="flex justify-between items-end text-[9px] text-white/60 mt-2">
            <span>{card.userName || ""}</span>
            <span>{card.userRole || ""}</span>
          </div>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }}>
        <p className="text-lg font-bold text-[#111]">You left your mark ✦</p>
        <p className="text-sm text-[rgba(17,17,17,0.4)] mt-1">Your card is now on the wall</p>
      </motion.div>
      <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}
        onClick={onClose} className="w-full h-12 rounded-2xl text-sm font-medium mt-5"
        style={{ background: "rgba(17,17,17,0.06)", color: "#111", border: "1px solid rgba(17,17,17,0.1)" }}
      >Explore the wall</motion.button>
    </div>
  );
}
