import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { X, Image, Type, Sticker, ArrowRight, ZoomIn, ZoomOut, RotateCw, Camera } from "lucide-react";
import { MAX_CARDS, type UserCard } from "../data/defaults";

type Tab = "text" | "image" | "gif" | "sticker";

interface AddCardModalProps {
  onClose: () => void;
  onPost: (card: UserCard) => void;
  cardCount: number;
}

const THEMES = [
  { id: "glass", label: "Glass", style: { background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.2)" } },
  { id: "chrome", label: "Chrome", style: { background: "linear-gradient(135deg, #868686, #c0c0c0, #e8e8e8, #a0a0a0)" } },
  { id: "heatmap", label: "Heatmap", style: { background: "linear-gradient(135deg, #ff006e, #f24822, #ffcd29)" } },
  { id: "holographic", label: "Holo", style: { background: "linear-gradient(135deg, #ff006e, #8338ec, #3a86ff, #06ffd4)" } },
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
  { id: "star", label: "⭐", file: "" },
  { id: "heart", label: "❤️", file: "" },
  { id: "fire", label: "🔥", file: "" },
  { id: "sparkle", label: "✨", file: "" },
  { id: "wave", label: "👋", file: "" },
  { id: "rocket", label: "🚀", file: "" },
  { id: "party", label: "🎉", file: "" },
  { id: "rainbow", label: "🌈", file: "" },
  { id: "crown", label: "👑", file: "" },
  { id: "light", label: "💡", file: "" },
  { id: "config", label: "✦", file: "" },
  { id: "drops", label: "💧", file: "" },
];

const ROLES = [
  "Product Designer",
  "Graphic Designer",
  "UX Designer",
  "UI Designer",
  "Developer",
  "Design Engineer",
  "Product Manager",
  "Design Lead",
  "Creative Director",
  "Artist",
  "Student",
  "Other",
];

export default function AddCardModal({ onClose, onPost, cardCount }: AddCardModalProps) {
  const [step, setStep] = useState<"creating" | "success">("creating");
  const [tab, setTab] = useState<Tab>("text");
  const [themeIdx, setThemeIdx] = useState(4); // default: normal

  // text state
  const [textContent, setTextContent] = useState("");
  const [fontIdx, setFontIdx] = useState(0);
  const [textColorIdx, setTextColorIdx] = useState(0);
  const [strokeWeightIdx, setStrokeWeightIdx] = useState(0);
  const [strokeColorIdx, setStrokeColorIdx] = useState(0);

  // image state
  const [imagePreview, setImagePreview] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // GIF state (2-shot capture)
  const [gifShots, setGifShots] = useState<string[]>([]);
  const [gifPreview, setGifPreview] = useState("");

  // sticker state
  const [stickerIdx, setStickerIdx] = useState(0);
  const [stickerScale, setStickerScale] = useState(1);

  // user info
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  // interactive card editor
  const [elX, setElX] = useState(0);
  const [elY, setElY] = useState(0);
  const [elScale, setElScale] = useState(1);
  const [elRotate, setElRotate] = useState(0);
  const dragEl = useRef({ active: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });

  const fileRef = useRef<HTMLInputElement>(null);
  const [submittedCard, setSubmittedCard] = useState<UserCard | null>(null);

  const isAtLimit = cardCount >= MAX_CARDS;
  const currentTheme = THEMES[themeIdx];

  const onElPointerDown = (e: React.PointerEvent) => {
    dragEl.current = { active: true, startX: e.clientX, startY: e.clientY, baseX: elX, baseY: elY };
  };
  const onElPointerMove = (e: React.PointerEvent) => {
    if (!dragEl.current.active) return;
    setElX(dragEl.current.baseX + (e.clientX - dragEl.current.startX));
    setElY(dragEl.current.baseY + (e.clientY - dragEl.current.startY));
  };
  const onElPointerUp = () => { dragEl.current.active = false; };

  // camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch { /* camera not available */ }
  };
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setShowCamera(false);
  };
  const captureShot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 320; canvas.height = 240;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");
    setGifShots(prev => [...prev, dataUrl]);
    if (gifShots.length >= 1) {
      // auto-create GIF after 2 shots
      setGifPreview(dataUrl);
      stopCamera();
    }
  };

  useEffect(() => {
    if (showCamera && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [showCamera]);

  const handleSubmit = () => {
    if (isAtLimit) return;
    const card: UserCard = {
      bg: currentTheme.id,
      quote: textContent || "✦",
      handle: "@" + (userName || "you"),
      type: tab,
      imageData: imagePreview || gifPreview || undefined,
      accentColor: currentTheme.id === "normal" ? "#7B61FF" : currentTheme.id,
      moodBadge: "",
      cardSkin: currentTheme.id,
      cardSize: "Medium",
      fontStyle: FONTS[fontIdx].id as any,
      stickerLabel: STICKER_LIST[stickerIdx]?.id,
      id: crypto.randomUUID?.() || Date.now().toString(36),
      userName,
      userRole,
      themeId: currentTheme.id,
    };
    setSubmittedCard(card);
    onPost(card);
    setStep("success");
  };

  const previewFontFamily = FONTS[fontIdx].family;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[500] flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="relative w-full md:max-w-[520px] max-h-[92vh] md:rounded-3xl rounded-t-3xl overflow-y-auto bg-white"
        style={{ fontFamily: "Inter, sans-serif" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-black/5 px-5 pt-4 pb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#111]">Drop your card</p>
            <p className="text-[11px] text-[rgba(17,17,17,0.35)]">{cardCount} of {MAX_CARDS} cards</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5">
            <X size={14} color="rgba(17,17,17,0.5)" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {step === "success" && submittedCard ? (
            <SuccessView card={submittedCard} onClose={onClose} />
          ) : isAtLimit ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-4">✨</div>
              <p className="text-lg font-bold text-[#111]">You've dropped your mark</p>
              <p className="text-sm text-[rgba(17,17,17,0.4)] mt-1">Come back and explore!</p>
            </div>
          ) : (
            <>
              {/* Theme carousel */}
              <div>
                <p className="text-[11px] font-semibold text-[rgba(17,17,17,0.4)] uppercase tracking-[.06em] mb-2">Card Theme</p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {THEMES.map((t, i) => (
                    <button
                      key={t.id}
                      onClick={() => setThemeIdx(i)}
                      className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-[9px] font-medium transition-all"
                      style={{
                        ...t.style,
                        outline: themeIdx === i ? "2px solid #7B61FF" : "2px solid transparent",
                        outlineOffset: 2,
                        color: t.id === "glass" ? "#111" : "#fff",
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive preview card */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="relative overflow-hidden select-none"
                  style={{
                    width: 200, height: 260,
                    borderRadius: 20,
                    ...currentTheme.style,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    touchAction: "none",
                    color: currentTheme.id === "glass" ? "#111" : "#fff",
                  }}
                  onPointerDown={onElPointerDown}
                  onPointerMove={onElPointerMove}
                  onPointerUp={onElPointerUp}
                  onPointerLeave={onElPointerUp}
                >
                  {/* Content layer */}
                  <div
                    className="absolute inset-0 flex flex-col justify-between p-4"
                    style={{
                      transform: `translateX(${elX}px) translateY(${elY}px) scale(${elScale}) rotate(${elRotate}deg)`,
                      transformOrigin: "center center",
                    }}
                  >
                    {/* Sticker (back) */}
                    {tab === "sticker" && (
                      <div className="text-5xl text-center pt-4" style={{ fontSize: 60, lineHeight: 1 }}>
                        {STICKER_LIST[stickerIdx]?.label}
                      </div>
                    )}

                    {/* Image/GIF */}
                    {(tab === "image" || tab === "gif") && (imagePreview || gifPreview) && (
                      <img src={imagePreview || gifPreview} alt="" className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
                    )}

                    {/* Text */}
                    {tab === "text" && textContent && (
                      <div
                        className="flex-1 flex items-center justify-center text-center text-lg font-bold leading-tight px-2"
                        style={{
                          fontFamily: previewFontFamily,
                          color: TEXT_COLORS[textColorIdx],
                          WebkitTextStroke: strokeWeightIdx > 0 ? `${STROKE_SIZES[strokeWeightIdx]}px ${TEXT_COLORS[strokeColorIdx]}` : undefined,
                        }}
                      >
                        {textContent}
                      </div>
                    )}

                    {/* Bottom: name + role */}
                    <div className="flex justify-between items-end mt-auto pt-4">
                      <div className="text-[10px] font-medium opacity-80">{userName || "your name"}</div>
                      <div className="text-[8px] opacity-60 text-right">{userRole || "role"}</div>
                    </div>
                  </div>

                  {/* Drag hint */}
                  {!dragEl.current.active && (
                    <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center pointer-events-none">
                      <span className="text-white/50 text-[9px]">✥</span>
                    </div>
                  )}
                </div>
                {/* Scale/rotate controls */}
                <div className="flex items-center gap-3">
                  <button onClick={() => setElScale(s => Math.max(0.3, s - 0.1))} className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10"><ZoomOut size={13} color="rgba(17,17,17,0.5)" /></button>
                  <span className="text-xs text-[rgba(17,17,17,0.4)] w-10 text-center font-medium">{Math.round(elScale * 100)}%</span>
                  <button onClick={() => setElScale(s => Math.min(3, s + 0.1))} className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10"><ZoomIn size={13} color="rgba(17,17,17,0.5)" /></button>
                  <button onClick={() => setElRotate(r => r - 15)} className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10 ml-2"><RotateCw size={13} color="rgba(17,17,17,0.5)" /></button>
                  <button onClick={() => setElRotate(0)} className="text-[10px] text-[rgba(17,17,17,0.35)] underline">reset</button>
                </div>
              </div>

              {/* Tab bar */}
              <div className="flex gap-1 bg-[rgba(17,17,17,0.04)] rounded-2xl p-1">
                {([{ key: "text", label: "Text", icon: <Type size={16} /> },
                   { key: "image", label: "Image", icon: <Image size={16} /> },
                   { key: "gif", label: "GIF", icon: <Camera size={16} /> },
                   { key: "sticker", label: "Sticker", icon: <Sticker size={16} /> }] as const).map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    className="flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-xs font-medium transition-all"
                    style={{
                      background: tab === t.key ? "#fff" : "transparent",
                      color: tab === t.key ? "#7B61FF" : "rgba(17,17,17,0.5)",
                      boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    }}
                  >{t.icon}{t.label}</button>
                ))}
              </div>

              {/* Tab content */}
              {tab === "text" && (
                <div className="space-y-3">
                  <textarea value={textContent} onChange={e => setTextContent(e.target.value)}
                    placeholder="Type something…" maxLength={140} rows={2}
                    className="w-full rounded-2xl px-4 py-3 text-sm resize-none outline-none bg-[rgba(17,17,17,0.05)] text-[#111]"
                  />
                  <div>
                    <p className="text-[10px] font-semibold text-[rgba(17,17,17,0.35)] uppercase mb-1.5">Font</p>
                    <div className="flex gap-1.5">
                      {FONTS.map((f, i) => (
                        <button key={f.id} onClick={() => setFontIdx(i)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ background: fontIdx === i ? "rgba(123,97,255,0.12)" : "rgba(17,17,17,0.05)", color: fontIdx === i ? "#7B61FF" : "rgba(17,17,17,0.5)", fontFamily: f.family }}
                        >{f.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[10px] font-semibold text-[rgba(17,17,17,0.35)] uppercase mb-1.5">Color</p>
                      <div className="flex gap-1.5">
                        {TEXT_COLORS.map((c, i) => (
                          <button key={i} onClick={() => setTextColorIdx(i)}
                            className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                            style={{ background: c, outline: textColorIdx === i ? "2px solid #7B61FF" : "2px solid transparent", outlineOffset: 2, boxShadow: c === "#fff" ? "0 0 0 1px rgba(0,0,0,0.1)" : "none" }}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-[rgba(17,17,17,0.35)] uppercase mb-1.5">Stroke</p>
                      <div className="flex gap-1.5">
                        {STROKE_SIZES.map((s, i) => (
                          <button key={i} onClick={() => setStrokeWeightIdx(i)}
                            className="w-7 h-7 rounded-lg text-[10px] font-medium transition-all"
                            style={{ background: strokeWeightIdx === i ? "rgba(123,97,255,0.12)" : "rgba(17,17,17,0.05)", color: strokeWeightIdx === i ? "#7B61FF" : "rgba(17,17,17,0.5)" }}
                          >{s === 0 ? "–" : s}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === "image" && (
                <div className="space-y-3">
                  <input ref={fileRef} type="file" accept="image/*" onChange={e => {
                    const f = e.target.files?.[0]; if (f) { setImagePreview(URL.createObjectURL(f)); setTab("image"); }
                  }} className="hidden" />
                  <div className="flex gap-2">
                    <button onClick={() => fileRef.current?.click()} className="flex-1 h-20 rounded-2xl border-2 border-dashed border-[rgba(17,17,17,0.12)] flex items-center justify-center gap-2 text-sm text-[rgba(17,17,17,0.4)] hover:border-[#7B61FF] hover:text-[#7B61FF] transition-colors">
                      <Image size={18} /> Gallery
                    </button>
                    <button onClick={startCamera} className="flex-1 h-20 rounded-2xl border-2 border-dashed border-[rgba(17,17,17,0.12)] flex items-center justify-center gap-2 text-sm text-[rgba(17,17,17,0.4)] hover:border-[#7B61FF] hover:text-[#7B61FF] transition-colors">
                      <Camera size={18} /> Capture
                    </button>
                  </div>
                  {showCamera && (
                    <div className="relative rounded-2xl overflow-hidden bg-black">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-40 object-cover" />
                      <button onClick={() => { /* capture */ const c = document.createElement("canvas"); c.width=320; c.height=240; c.getContext("2d")?.drawImage(videoRef.current!,0,0); setImagePreview(c.toDataURL()); stopCamera(); }} className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white border-2 border-[#111]" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {tab === "gif" && (
                <div className="space-y-3">
                  {!showCamera && gifShots.length < 2 && (
                    <button onClick={startCamera} className="w-full h-20 rounded-2xl border-2 border-dashed border-[rgba(17,17,17,0.12)] flex items-center justify-center gap-2 text-sm text-[rgba(17,17,17,0.4)] hover:border-[#7B61FF] hover:text-[#7B61FF] transition-colors">
                      <Camera size={18} /> Take 2 photos (auto GIF)
                    </button>
                  )}
                  {showCamera && (
                    <div className="relative rounded-2xl overflow-hidden bg-black">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-40 object-cover" />
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-3">
                        <button onClick={captureShot} className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center border-2 border-white">
                          <div className="w-9 h-9 rounded-full bg-white border-2 border-[#111]" />
                        </button>
                      </div>
                      <div className="absolute top-2 right-2 text-[10px] text-white/60 bg-black/50 px-2 py-1 rounded-full">
                        Shot {gifShots.length + 1}/2
                      </div>
                    </div>
                  )}
                  {gifShots.length > 0 && (
                    <div className="flex gap-2">
                      {gifShots.map((s, i) => <img key={i} src={s} alt={`shot ${i}`} className="w-16 h-12 rounded-lg object-cover" />)}
                      <span className="text-xs text-[rgba(17,17,17,0.4)] self-center">✅ {gifShots.length}/2 captured</span>
                    </div>
                  )}
                </div>
              )}

              {tab === "sticker" && (
                <div className="grid grid-cols-4 gap-2">
                  {STICKER_LIST.map((s, i) => (
                    <button key={s.id} onClick={() => setStickerIdx(i)}
                      className="h-16 rounded-2xl flex items-center justify-center text-2xl transition-all"
                      style={{ background: stickerIdx === i ? "rgba(123,97,255,0.12)" : "rgba(17,17,17,0.04)", outline: stickerIdx === i ? "2px solid #7B61FF" : "2px solid transparent" }}
                      title={s.label}
                    >{s.label}</button>
                  ))}
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
                  <select value={userRole} onChange={e => setUserRole(e.target.value)}
                    className="w-full h-10 rounded-xl px-3 text-sm outline-none bg-[rgba(17,17,17,0.05)] text-[#111]"
                  >
                    <option value="">Select role</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* Submit */}
              <button onClick={handleSubmit} disabled={!textContent && tab === "text"}
                className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  background: (textContent || tab !== "text") ? "#111" : "rgba(17,17,17,0.1)",
                  color: (textContent || tab !== "text") ? "#fff" : "rgba(17,17,17,0.3)",
                  cursor: (textContent || tab !== "text") ? "pointer" : "not-allowed",
                }}
              >
                Drop it <ArrowRight size={15} />
              </button>
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
    <div className="text-center relative overflow-hidden py-6" style={{ fontFamily: "Inter,sans-serif" }}>
      {Array.from({ length: 22 }).map((_, i) => (
        <motion.div key={i} className="absolute pointer-events-none"
          style={{ width: i % 3 === 0 ? 8 : 5, height: i % 3 === 0 ? 8 : 5, borderRadius: i % 2 === 0 ? "50%" : 2, background: ["#7B61FF", "#F24822", "#1ABCFE", "#FFCD29", "#fff", "#7B61FF", "#F24822"][i % 7], left: `${6 + (i * 4.2) % 88}%`, top: -10 }}
          animate={{ y: [0, 280 + (i % 5) * 30], x: [(i % 2 === 0 ? 1 : -1) * ((i * 7) % 40)], rotate: [0, (i % 2 === 0 ? 1 : -1) * (180 + (i * 30) % 180)], opacity: [1, 1, 0] }}
          transition={{ duration: 1.2 + (i % 4) * 0.25, delay: (i % 6) * 0.08, ease: "easeIn" }}
        />
      ))}
      <div className="flex justify-center pt-4 mb-5">
        <motion.div className="relative flex flex-col justify-between overflow-hidden"
          style={{ width: 160, height: 220, borderRadius: 20, background: card.bg, boxShadow: "0 16px 56px rgba(0,0,0,0.15)", fontFamily: "Inter,sans-serif" }}
          initial={{ scale: 0.65, rotate: -8, opacity: 0, y: 20 }}
          animate={{ scale: 1, rotate: 4, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}
        >
          <div className="flex flex-col justify-between h-full p-4">
            <div className="text-[10px] uppercase opacity-60">Config 2025</div>
            <div className="flex-1 flex items-center justify-center text-center text-sm font-bold leading-tight px-1">{card.quote}</div>
            <div className="flex justify-between items-end text-[9px] opacity-60 mt-2">
              <span>{card.handle?.replace("@", "")}</span>
              <span>{card.userRole || ""}</span>
            </div>
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
      >
        Explore the wall
      </motion.button>
    </div>
  );
}
