import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { X, Type, Palette, PenTool, Paintbrush, ChevronDown, Camera, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MAX_CARDS, type UserCard } from "../data/defaults";

function genId() { return crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

const THEMES = [
  { id: "heatmap", label: "Heatmap", img: "/cards/card-heatmap.png", light: false },
  { id: "holographic", label: "Holo", img: "/cards/card-holographic.png", light: false },
  { id: "blurry", label: "Blurry", img: "/cards/card-blurry.png", light: false },
  { id: "fractal", label: "Fractal", img: "/cards/card-fractal.png", light: false },
  { id: "frosted_glow", label: "Frosted", img: "/cards/card-frosted_glow.png", light: false },
  { id: "gradient", label: "Gradient", img: "/cards/card-gradient.png", light: true },
  { id: "chrome", label: "Chrome", img: "/cards/card-chrome.png", light: false },
  { id: "halftone", label: "Halftone", img: "/cards/card-halftone.png", light: false },
  { id: "paper", label: "Paper", img: "/cards/card-paper.png", light: true },
  { id: "custom", label: "Custom", img: null, light: false },
];

const FONT_OPTIONS = [
  { id: "sans", label: "Inter", family: "Inter, system-ui, sans-serif" },
  { id: "serif", label: "Serif", family: "Georgia, serif" },
  { id: "mono", label: "Mono", family: '"Courier New", monospace' },
  { id: "beth", label: "Beth Ellen", family: '"Beth Ellen", cursive' },
];

const DESIGN_COLORS = ["#ff3b30", "#ff9500", "#ffcc00", "#4cd964", "#5ac8fa", "#007aff", "#5856d6", "#ff2d55", "#000000", "#ffffff"];

const STICKER_LIST = [
  { id: "star", e: "⭐" }, { id: "heart", e: "❤️" }, { id: "fire", e: "🔥" },
  { id: "sparkle", e: "✨" }, { id: "wave", e: "👋" }, { id: "rocket", e: "🚀" },
  { id: "party", e: "🎉" }, { id: "rainbow", e: "🌈" }, { id: "crown", e: "👑" },
  { id: "light", e: "💡" }, { id: "config", e: "✦" }, { id: "drops", e: "💧" },
];

function getCardBg(themeId: string, customColor: string): React.CSSProperties {
  const t = THEMES.find(t => t.id === themeId);
  if (!t || !t.img) return { background: customColor };
  return { backgroundImage: `url(${t.img})`, backgroundSize: "cover", backgroundPosition: "center" };
}

function swatchRing(active: boolean): React.CSSProperties {
  return active ? { boxShadow: "0 0 0 2.5px #fff, 0 0 0 4.5px #007aff" } : {};
}

type Tab = "text" | "image" | "sticker";
const TABS: { key: Tab; label: string }[] = [
  { key: "text", label: "Text" },
  { key: "image", label: "Image" },
  { key: "sticker", label: "Sticker" },
];

export default function AddCardModal({ onClose, onPost, cardCount }: { onClose: () => void; onPost: (card: UserCard) => void; cardCount: number }) {
  const [step, setStep] = useState<"creating" | "success">("creating");
  const [tab, setTab] = useState<Tab>("text");
  const [themeIdx, setThemeIdx] = useState(0);
  const [customColor, setCustomColor] = useState("#7B61FF");
  const [customImg, setCustomImg] = useState<string | null>(null);
  const currentTheme = themeIdx === THEMES.length ? { id: "custom_img", label: "Custom", img: customImg, light: false } : THEMES[themeIdx];
  const isCustom = currentTheme.id === "custom" || themeIdx === THEMES.length || themeIdx === THEMES.length + 1;
  const cardBg = customImg && themeIdx === THEMES.length ? { backgroundImage: `url(${customImg})`, backgroundSize: "cover", backgroundPosition: "center" } : getCardBg(currentTheme.id, customColor);
  const [cardSide, setCardSide] = useState<"front" | "back">("front");
  const [textContent, setTextContent] = useState("");
  const [fontIdx, setFontIdx] = useState(0);
  const [fontColor, setFontColor] = useState("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [strokeColor, setStrokeColor] = useState("#ffffff");
  const [showFooter, setShowFooter] = useState(true);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [footerColor, setFooterColor] = useState("#ffffff");
  const [displayName, setDisplayName] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [qrEnabled, setQrEnabled] = useState(true);
  const [imagePreview, setImagePreview] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [stickerIdx, setStickerIdx] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [submittedCard, setSubmittedCard] = useState<UserCard | null>(null);
  const [elements, setElements] = useState<any[]>([]);
  const [nextZ, setNextZ] = useState(1);
  const [selId, setSelId] = useState<string | null>(null);
  const dragEl = useRef({ id: "", active: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });
  const resizeEl = useRef({ id: "", active: false, startX: 0, startY: 0, baseW: 0, baseH: 0, dir: "" });
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isAtLimit = cardCount >= MAX_CARDS;

  useEffect(() => { if (showCamera && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current; }, [showCamera]);

  const startCamera = async () => { try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }); streamRef.current = s; setShowCamera(true); } catch {} };
  const stopCamera = () => { streamRef.current?.getTracks().forEach(t => t.stop()); setShowCamera(false); };
  const capturePhoto = () => { if (!videoRef.current) return; const c = document.createElement("canvas"); c.width = 320; c.height = 240; c.getContext("2d")?.drawImage(videoRef.current, 0, 0); return c.toDataURL("image/png"); };

  const addElement = (type: string) => {
    const id = genId();
    const base: any = { id, type, x: 20 + elements.length * 12, y: 20 + elements.length * 12, w: 180, h: 56, zIndex: nextZ, rotation: 0 };
    if (type === "text") { if (!textContent.trim()) return; base.content = textContent; base.color = fontColor; base.fontFamily = FONT_OPTIONS[fontIdx].family; base.strokeWidth = strokeWidth; base.strokeColor = strokeColor; }
    else if (type === "image") { if (imageBase64) base.imageData = imageBase64; base.content = "📷"; base.w = 140; base.h = 100; }
    else if (type === "sticker") { base.content = STICKER_LIST[stickerIdx].e; base.w = 70; base.h = 70; }
    setElements((prev: any[]) => [...prev, base]); setSelId(id); setNextZ((z: number) => z + 1);
  };
  const updateElement = (id: string, u: any) => setElements((prev: any[]) => prev.map((e: any) => e.id === id ? { ...e, ...u } : e));
  const removeElement = (id: string) => { setElements((prev: any[]) => prev.filter((e: any) => e.id !== id)); if (selId === id) setSelId(null); };

  const handleSubmit = () => {
    if (isAtLimit) return;
    const bgValue = isCustom ? (customImg || customColor) : currentTheme.id;
    const textEl = elements.find((e: any) => e.type === "text");
    const imageEl = elements.find((e: any) => e.type === "image");
    const stickerEl = elements.find((e: any) => e.type === "sticker");
    const allText = elements.map((e: any) => e.content).filter(Boolean).join(" | ") || "✦";
    const card: UserCard = {
      bg: bgValue, quote: allText, handle: "@" + (userName || "you"), type: imageEl ? "image" : stickerEl ? "sticker" : "text",
      accentColor: bgValue, cardSkin: bgValue, id: genId(), userName, userRole, themeId: currentTheme.id,
      imageData: imageEl?.imageData || undefined, stickerLabel: stickerEl?.content,
      fontStyle: textEl?.fontFamily || FONT_OPTIONS[fontIdx].family, borderStyle: strokeWidth > 0 ? "custom" : "none",
      displayName: displayName || undefined, profileUrl: profileUrl || undefined, qrEnabled,
    };
    setSubmittedCard(card); onPost(card); setStep("success"); stopCamera();
  };

  const renderCardPreview = () => (
    <motion.div className="relative shrink-0" style={{ width: 364, height: 520, perspective: "1000px" }}
      onPointerMove={(e) => {
        if (dragEl.current.active) updateElement(dragEl.current.id, { x: dragEl.current.baseX + (e.clientX - dragEl.current.startX) * 0.65, y: dragEl.current.baseY + (e.clientY - dragEl.current.startY) * 0.65 });
        if (resizeEl.current.active) {
          const dx = e.clientX - resizeEl.current.startX, dy = e.clientY - resizeEl.current.startY;
          const d = resizeEl.current.dir;
          let nw = resizeEl.current.baseW, nh = resizeEl.current.baseH;
          if (d.includes("e")) nw = Math.max(30, resizeEl.current.baseW + dx * 0.5);
          if (d.includes("w")) nw = Math.max(30, resizeEl.current.baseW - dx * 0.5);
          if (d.includes("s")) nh = Math.max(30, resizeEl.current.baseH + dy * 0.5);
          if (d.includes("n")) nh = Math.max(30, resizeEl.current.baseH - dy * 0.5);
          updateElement(resizeEl.current.id, { w: nw, h: nh });
        }
      }}
      onPointerUp={() => { dragEl.current.active = false; resizeEl.current.active = false; }}
      onPointerLeave={() => { dragEl.current.active = false; resizeEl.current.active = false; }}
    >
      <motion.div className="relative size-full" style={{ transformStyle: "preserve-3d" }} animate={{ rotateY: cardSide === "back" ? 180 : 0 }} transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}>
        <div className="absolute inset-0 overflow-hidden rounded-[18px]" style={{ backfaceVisibility: "hidden", ...cardBg, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
          {elements.map((el: any) => (
            <div key={el.id}
              onPointerDown={(e) => { e.stopPropagation(); setSelId(el.id); setNextZ((z: number) => z + 1); updateElement(el.id, { zIndex: nextZ + 1 }); dragEl.current = { id: el.id, active: true, startX: e.clientX, startY: e.clientY, baseX: el.x, baseY: el.y }; }}
              onDoubleClick={(e) => { e.stopPropagation(); updateElement(el.id, { rotation: ((el.rotation || 0) + 15) % 360 }); }}
              style={{ position: "absolute", left: el.x, top: el.y, width: el.w, height: el.h, transform: `rotate(${el.rotation || 0}deg)`, zIndex: el.zIndex, cursor: "move", outline: selId === el.id ? "2px solid rgba(255,255,255,0.5)" : "none", borderRadius: 8, overflow: "hidden", ...(el.type === "text" ? { display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.2)" } : {}) }}>
              {el.type === "text" && <p className="font-bold leading-tight break-words text-center px-2 text-sm" style={{ fontFamily: el.fontFamily, color: el.color, WebkitTextStroke: el.strokeWidth > 0 ? `${el.strokeWidth * 0.3}px ${el.strokeColor}` : undefined }}>{el.content}</p>}
              {el.type === "image" && el.imageData && <img src={el.imageData} alt="" className="w-full h-full object-cover" />}
              {el.type === "sticker" && <div className="w-full h-full flex items-center justify-center text-3xl">{el.content}</div>}
              {selId === el.id && <button onClick={(e) => { e.stopPropagation(); removeElement(el.id); }} className="absolute -top-7 right-0 w-5 h-5 rounded flex items-center justify-center text-[9px] text-red-300" style={{ background: "rgba(255,255,255,0.15)" }}>✕</button>}
              {selId === el.id && (["nw","ne","sw","se"] as const).map(dir => (
                <div key={dir} className={`absolute ${dir.includes("n") ? "top-0" : "bottom-0"} ${dir.includes("w") ? "left-0" : "right-0"} w-3 h-3`} style={{ cursor: dir + "-resize", background: "rgba(255,255,255,0.4)", borderRadius: dir === "nw" || dir === "se" ? "4px 0 4px 0" : "0 4px 0 4px" }}
                  onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); resizeEl.current = { id: el.id, active: true, startX: e.clientX, startY: e.clientY, baseW: el.w, baseH: el.h, dir }; }} />
              ))}
            </div>
          ))}
          {showFooter && <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 flex justify-between items-end z-50"><span className="text-[9px] font-medium" style={{ color: footerColor }}>{userName || "Name"}</span><span className="text-[8px] opacity-70" style={{ color: footerColor }}>{userRole || "Role"}</span></div>}
        </div>
        <div className="absolute inset-0 overflow-hidden rounded-[18px] flex flex-col items-center justify-center gap-3" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)", boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
          <div className="text-4xl">✦</div>
          <p className="text-white font-semibold text-lg">{userName || "Your Name"}</p>
          <p className="text-white/60 text-xs">{userRole || "Your Role"}</p>
          <div className="mt-2 px-4 py-1 rounded-full bg-white/10 text-white/50 text-[10px]">{currentTheme.label} · {FONT_OPTIONS[fontIdx].label}</div>
        </div>
      </motion.div>
    </motion.div>
  );

  // ── Success View ──
  if (step === "success" && submittedCard) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] flex items-end md:items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }} onClick={onClose}>
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="w-full md:max-w-sm mx-auto md:rounded-[28px] rounded-t-[28px] p-6 text-center relative overflow-hidden" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }} onClick={e => e.stopPropagation()}>
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div key={i} className="absolute pointer-events-none rounded-full" style={{ width: i % 3 === 0 ? 8 : 5, height: i % 3 === 0 ? 8 : 5, borderRadius: i % 2 === 0 ? "50%" : 2, background: ["#7B61FF", "#ff3b30", "#007aff", "#4cd964", "#fff"][i % 5], left: `${8 + (i * 4.4) % 84}%`, top: -10 }}
              animate={{ y: [0, 260], x: [(i % 2 === 0 ? 1 : -1) * ((i * 7) % 35)], rotate: [0, 360], opacity: [1, 0] }} transition={{ duration: 1.2 + (i % 4) * 0.2, delay: i * 0.07, ease: "easeIn" }} />
          ))}
          <motion.div className="mx-auto mb-5 relative overflow-hidden rounded-2xl flex flex-col justify-between" style={{ width: 140, height: 200, ...cardBg, boxShadow: "0 16px 48px rgba(0,0,0,0.2)" }} initial={{ scale: 0.7, rotate: -6, opacity: 0, y: 16 }} animate={{ scale: 1, rotate: 3, opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}>
            <div className="flex-1 flex items-center p-3"><p className="font-bold text-sm leading-tight text-white" style={{ fontFamily: FONT_OPTIONS[fontIdx].family }}>{submittedCard.quote}</p></div>
            {showFooter && <div className="px-3 pb-2 flex justify-between text-[8px]" style={{ color: footerColor }}><span>{userName || "Name"}</span><span className="opacity-70">{userRole || "Role"}</span></div>}
          </motion.div>
          <p className="text-[18px] font-semibold text-white mb-1" style={{ fontFamily: "Inter, sans-serif" }}>You left your mark ✦</p>
          <p className="text-[14px] text-white/50" style={{ fontFamily: "Inter, sans-serif" }}>Your card is now on the wall</p>
          <Button onClick={onClose} className="mt-5 w-full h-12 rounded-2xl text-sm font-medium text-white" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(16px)" }}>Explore the wall</Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] flex items-end md:items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <style>{`.ios-slider { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; outline: none; cursor: pointer; background: transparent; width: 100%; }
.ios-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 28px; height: 28px; border-radius: 50%; background: white; box-shadow: 0 3px 8px rgba(0,0,0,0.2),0 0 0 0.5px rgba(0,0,0,0.06); cursor: pointer; }
.ios-slider::-moz-range-thumb { width: 28px; height: 28px; border-radius: 50%; background: white; box-shadow: 0 3px 8px rgba(0,0,0,0.2); cursor: pointer; border: none; }`}</style>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 36 }}
        className="w-full md:w-auto md:max-w-5xl flex md:flex-row-reverse flex-col md:rounded-[36px] rounded-t-[28px] overflow-hidden" style={{ maxHeight: "96vh", height: "90vh" }} onClick={e => e.stopPropagation()}>

        {/* ── LEFT PANEL ── */}
        <div className="flex flex-col overflow-y-auto md:w-[380px] w-full" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)", fontFamily: "Inter, sans-serif" }}>
          <div className="flex flex-col gap-6 p-5 pt-6">

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className="flex-1 py-2.5 rounded-[10px] text-sm font-medium transition-all"
                  style={{ background: tab === t.key ? "rgba(255,255,255,0.12)" : "transparent", color: tab === t.key ? "#fff" : "rgba(255,255,255,0.4)" }}>
                  {t.label}
                </button>
              ))}
            </div>

                {/* Mobile Preview */}
                <div className="md:hidden flex flex-col items-center gap-2 py-2">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Preview</p>
                  <div className="scale-[0.55] origin-top">{renderCardPreview()}</div>
                </div>

            {isAtLimit ? (
              <div className="text-center py-6"><div className="text-4xl mb-3">✨</div><p className="text-lg font-semibold text-white">You've dropped your mark</p><p className="text-sm text-white/40 mt-1">Come back and explore!</p></div>
            ) : (
              <div className="flex flex-col gap-5">

                {/* TEXT TAB */}
                {tab === "text" && (
                  <div className="flex flex-col gap-5">
                    <div><Label className="text-white text-base font-semibold">Text Input</Label></div>
                    <Textarea value={textContent} onChange={e => {
                      const v = e.target.value; setTextContent(v);
                      if (v.trim()) { const ex = elements.find((el: any) => el.type === "text"); if (ex) updateElement(ex.id, { content: v, color: fontColor, fontFamily: FONT_OPTIONS[fontIdx].family, strokeWidth, strokeColor }); else setTimeout(() => addElement("text"), 50); }
                    }} placeholder="Hello, Nice 2 meet u!" maxLength={200} rows={3}
                      className="w-full resize-none text-white placeholder:text-white/30 rounded-xl border-0" style={{ background: "rgba(255,255,255,0.08)", padding: "20px", fontSize: 18, lineHeight: "24px" }} />

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-white font-semibold text-base">Font Settings</Label>
                      </div>

                      {/* Font selector */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2"><Type size={16} className="text-white/60" /><span className="text-sm text-white">Select Font</span></div>
                        <select value={fontIdx} onChange={e => setFontIdx(Number(e.target.value))}
                          className="text-sm text-white bg-transparent border-0 outline-none cursor-pointer text-right" style={{ fontFamily: FONT_OPTIONS[fontIdx].family }}>
                          {FONT_OPTIONS.map((f, i) => <option key={f.id} value={i} style={{ background: "#222" }}>{f.label}</option>)}
                        </select>
                      </div>
                      <div className="h-px" style={{ background: "rgba(255,255,255,0.08)" }} />

                      {/* Font Color */}
                      <div className="flex flex-col gap-2 py-2">
                        <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Palette size={16} className="text-white/60" /><span className="text-sm text-white">Font Color</span></div>
                          <div className="w-6 h-6 rounded-full" style={{ background: fontColor, border: fontColor === "#ffffff" ? "1px solid rgba(255,255,255,0.2)" : "none" }} /></div>
                        <div className="flex gap-2 flex-wrap">{DESIGN_COLORS.map(c => (<button key={c} onClick={() => setFontColor(c)} className="w-6 h-6 rounded-full transition-transform hover:scale-110" style={{ background: c, ...swatchRing(fontColor === c) }} />))}</div>
                      </div>
                      <div className="h-px" style={{ background: "rgba(255,255,255,0.08)" }} />

                      {/* Stroke Width */}
                      <div className="flex flex-col gap-2 py-2">
                        <div className="flex items-center justify-between"><div className="flex items-center gap-2"><PenTool size={16} className="text-white/60" /><span className="text-sm text-white">Stroke Width</span></div><span className="text-sm text-white/50">{strokeWidth}px</span></div>
                        <div className="relative h-7 flex items-center">
                          <div className="absolute left-0 right-0 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
                          <div className="absolute left-0 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.5)", width: `${(strokeWidth / 10) * 100}%` }} />
                          <input type="range" min={0} max={10} step={1} value={strokeWidth} onChange={e => setStrokeWidth(Number(e.target.value))} className="ios-slider relative z-10" />
                        </div>
                        <div className="flex justify-between text-[9px] text-white/40">{Array.from({ length: 11 }, (_, i) => i).map(n => <span key={n}>{n}</span>)}</div>
                      </div>
                      <div className="h-px" style={{ background: "rgba(255,255,255,0.08)" }} />

                      {/* Stroke Color */}
                      <div className="flex flex-col gap-2 py-2">
                        <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Paintbrush size={16} className="text-white/60" /><span className="text-sm text-white">Stroke Color</span></div>
                          <div className="w-6 h-6 rounded-full" style={{ background: strokeColor, border: strokeColor === "#ffffff" ? "1px solid rgba(255,255,255,0.2)" : "none" }} /></div>
                        <div className="flex gap-2 flex-wrap">{DESIGN_COLORS.map(c => (<button key={c} onClick={() => setStrokeColor(c)} className="w-6 h-6 rounded-full transition-transform hover:scale-110" style={{ background: c, ...swatchRing(strokeColor === c) }} />))}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* IMAGE TAB */}
                {tab === "image" && (
                  <div className="flex flex-col gap-4">
                    <Label className="text-white text-base font-semibold">Image</Label>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; setImagePreview(URL.createObjectURL(f)); const reader = new FileReader(); reader.onload = () => { setImageBase64(reader.result as string); setTimeout(() => addElement("image"), 100); }; reader.readAsDataURL(f); }} />
                    <div className="flex gap-3">
                      <Button onClick={() => fileRef.current?.click()} variant="secondary" className="flex-1 h-20 rounded-xl flex-col gap-1 text-white/60 hover:text-white" style={{ background: "rgba(255,255,255,0.08)" }}><ImageIcon size={20} /><span className="text-xs">Gallery</span></Button>
                      <Button onClick={startCamera} variant="secondary" className="flex-1 h-20 rounded-xl flex-col gap-1 text-white/60 hover:text-white" style={{ background: "rgba(255,255,255,0.08)" }}><Camera size={20} /><span className="text-xs">Camera</span></Button>
                    </div>
                    {imagePreview && <div className="relative"><img src={imagePreview} alt="" className="w-full h-28 object-cover rounded-xl" /><button onClick={() => { setImagePreview(""); setImageBase64(""); }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center"><X size={12} color="white" /></button></div>}
                    {showCamera && <div className="relative rounded-xl overflow-hidden bg-black"><video ref={videoRef} autoPlay playsInline className="w-full h-36 object-cover" style={{ transform: "scaleX(-1)" }} /><button onClick={() => { const d = capturePhoto(); if (d) { setImagePreview(d); setImageBase64(d); stopCamera(); } }} className="absolute bottom-3 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white/80 flex items-center justify-center"><div className="w-9 h-9 rounded-full bg-white border-2 border-black" /></button></div>}
                  </div>
                )}

                {/* STICKER TAB */}
                {tab === "sticker" && (
                  <div className="flex flex-col gap-4">
                    <Label className="text-white text-base font-semibold">Sticker</Label>
                    <div className="grid grid-cols-4 gap-2">{STICKER_LIST.map((s, i) => (<button key={s.id} onClick={() => { setStickerIdx(i); setTimeout(() => addElement("sticker"), 50); }} className="h-14 rounded-xl flex items-center justify-center text-2xl transition-all" style={{ background: stickerIdx === i ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)", ...swatchRing(stickerIdx === i) }}>{s.e}</button>))}</div>
                  </div>
                )}


                <div className="h-px" style={{ background: "rgba(255,255,255,0.08)" }} />

                {/* FOOTER */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between"><Label className="text-white font-semibold text-base">Footer</Label><Switch checked={showFooter} onCheckedChange={setShowFooter} /></div>
                  {showFooter && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2"><Label className="text-sm text-white/80">Your Name</Label><Input value={userName} onChange={e => setUserName(e.target.value)} placeholder="Bruno" className="text-white placeholder:text-white/30 border-0 rounded-xl h-12" style={{ background: "rgba(255,255,255,0.08)" }} /></div>
                      <div className="flex flex-col gap-2"><Label className="text-sm text-white/80">Your Role</Label><Input value={userRole} onChange={e => setUserRole(e.target.value)} placeholder="Product Designer" className="text-white placeholder:text-white/30 border-0 rounded-xl h-12" style={{ background: "rgba(255,255,255,0.08)" }} /></div>
                      <div className="flex flex-col gap-2 py-1">
                        <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Palette size={16} className="text-white/60" /><span className="text-sm text-white">Font Color</span></div><div className="w-6 h-6 rounded-full" style={{ background: footerColor, border: footerColor === "#ffffff" ? "1px solid rgba(255,255,255,0.2)" : "none" }} /></div>
                        <div className="flex gap-2 flex-wrap">{DESIGN_COLORS.map(c => (<button key={c} onClick={() => setFooterColor(c)} className="w-6 h-6 rounded-full transition-transform hover:scale-110" style={{ background: c, ...swatchRing(footerColor === c) }} />))}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px" style={{ background: "rgba(255,255,255,0.08)" }} />

                {/* CONNECT */}
                <div className="flex flex-col gap-4">
                  <Label className="text-white font-semibold text-base">Connect</Label>
                  <div className="flex flex-col gap-2"><Label className="text-sm text-white/80">Display Name</Label><Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your display name" className="text-white placeholder:text-white/30 border-0 rounded-xl h-12" style={{ background: "rgba(255,255,255,0.08)" }} /></div>
                  <div className="flex flex-col gap-2"><Label className="text-sm text-white/80">Profile / Social URL</Label><Input value={profileUrl} onChange={e => setProfileUrl(e.target.value)} placeholder="https://" className="text-white placeholder:text-white/30 border-0 rounded-xl h-12" style={{ background: "rgba(255,255,255,0.08)" }} /></div>
                  <div className="flex items-center justify-between"><Label className="text-sm text-white/80">Show QR on card</Label><Switch checked={qrEnabled} onCheckedChange={setQrEnabled} /></div>
                </div>

                <div className="h-px" style={{ background: "rgba(255,255,255,0.08)" }} />

                {/* SUBMIT */}
                <Button onClick={handleSubmit} disabled={elements.length === 0}
                  className="w-full h-14 rounded-xl text-base font-semibold text-white"
                  style={{ background: elements.length > 0 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)", backdropFilter: "blur(16px)" }}>
                  Add To Card
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="hidden md:flex flex-1 flex-col relative overflow-hidden" style={{ minWidth: 480, background: "rgba(0,0,0,0.4)" }}>
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }}>
              {(["front", "back"] as const).map(side => (
                <button key={side} onClick={() => setCardSide(side)} className="px-4 py-1.5 rounded-[6px] text-sm transition-all" style={{ background: cardSide === side ? "rgba(255,255,255,0.12)" : "transparent", color: cardSide === side ? "#fff" : "rgba(255,255,255,0.4)" }}>{side.charAt(0).toUpperCase() + side.slice(1)}</button>
              ))}
            </div>
            <button onClick={onClose} className="flex items-center justify-center rounded-full transition-opacity hover:opacity-75" style={{ width: 44, height: 44, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)" }}><X size={18} color="#fff" /></button>
          </div>
          <div className="flex-1 flex items-center justify-center pb-4">{renderCardPreview()}</div>
          <div className="px-6 pb-5 flex flex-col gap-3">
            <p className="text-sm font-semibold text-center text-white/40" style={{ fontFamily: "Inter, sans-serif" }}>Theme</p>
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {/* Upload custom image thumbnail */}
              <label className="relative shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-105 flex items-center justify-center" style={{ width: 72, height: 72, background: "rgba(255,255,255,0.08)", border: customImg ? "2px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.15)" }}>
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (!f) return; const reader = new FileReader(); reader.onload = (ev) => { setCustomImg(ev.target?.result as string); setThemeIdx(THEMES.length); }; reader.readAsDataURL(f); }} />
                <svg width={20} height={20} viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/><path d="M10 6v8M6 10h8" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/></svg>
              </label>
              {THEMES.map((t, i) => (
                <button key={t.id} onClick={() => setThemeIdx(i)} className="relative shrink-0 rounded-xl overflow-hidden transition-all" style={{ width: 72, height: 72, backgroundImage: t.img ? `url(${t.img})` : undefined, backgroundSize: "cover", backgroundPosition: "center", background: t.img ? undefined : customColor, outline: themeIdx === i ? "2px solid rgba(255,255,255,0.5)" : "1px solid transparent", outlineOffset: 2, border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div className="absolute inset-0 flex items-end justify-start p-1.5"><span className="text-[8px] font-semibold text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>{t.label}</span></div>
                </button>
              ))}
              {/* Rainbow color picker at end */}
              <label className="relative shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-105 flex items-center justify-center" style={{ width: 72, height: 72, background: "conic-gradient(from 90deg, #ff0000, #ff9500, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)", outline: themeIdx === THEMES.length + 1 ? "2px solid rgba(255,255,255,0.5)" : "1px solid transparent" }}>
                <input type="color" value={customColor} onChange={e => { setCustomColor(e.target.value); setThemeIdx(THEMES.length + 1); }} className="opacity-0 absolute w-0 h-0" />
                <span className="text-white text-[8px] font-semibold" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>Color</span>
              </label>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
