import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { X, Camera, Image as ImageIcon, ChevronDown, Type, Palette, PenTool, Paintbrush } from "lucide-react";
import { MAX_CARDS, type UserCard } from "../data/defaults";

function genId() { return crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// ── Constants ─────────────────────────────────────────────────────────────────

const THEMES = [
  { id: "heatmap",      label: "Heatmap",  img: "/cards/card-heatmap.png",      light: false },
  { id: "holographic",  label: "Holo",     img: "/cards/card-holographic.png",   light: false },
  { id: "blurry",       label: "Blurry",   img: "/cards/card-blurry.png",        light: false },
  { id: "fractal",      label: "Fractal",  img: "/cards/card-fractal.png",       light: false },
  { id: "frosted_glow", label: "Frosted",  img: "/cards/card-frosted_glow.png",  light: false },
  { id: "gradient",     label: "Gradient", img: "/cards/card-gradient.png",      light: true  },
  { id: "chrome",       label: "Chrome",   img: "/cards/card-chrome.png",        light: false },
  { id: "halftone",     label: "Halftone", img: "/cards/card-halftone.png",      light: false },
  { id: "paper",        label: "Paper",    img: "/cards/card-paper.png",         light: true  },
  { id: "custom",       label: "Custom",   img: null,                            light: false },
];

const FONT_OPTIONS = [
  { id: "sans",  label: "Inter",     family: "Inter, system-ui, sans-serif" },
  { id: "serif", label: "Serif",     family: "Georgia, serif" },
  { id: "mono",  label: "Mono",      family: '"Courier New", monospace' },
  { id: "beth",  label: "Beth Ellen",family: '"Beth Ellen", cursive' },
];

const DESIGN_COLORS = [
  "#ff3b30", "#ff9500", "#ffcc00", "#4cd964", "#5ac8fa",
  "#007aff", "#5856d6", "#ff2d55", "#000000", "#ffffff",
];

const STICKER_LIST = [
  { id: "star", e: "⭐" }, { id: "heart", e: "❤️" }, { id: "fire", e: "🔥" },
  { id: "sparkle", e: "✨" }, { id: "wave", e: "👋" }, { id: "rocket", e: "🚀" },
  { id: "party", e: "🎉" }, { id: "rainbow", e: "🌈" }, { id: "crown", e: "👑" },
  { id: "light", e: "💡" }, { id: "config", e: "✦" }, { id: "drops", e: "💧" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCardBg(themeId: string, customColor: string): React.CSSProperties {
  const t = THEMES.find(t => t.id === themeId);
  if (!t || !t.img) return { background: customColor };
  return { backgroundImage: `url(${t.img})`, backgroundSize: "cover", backgroundPosition: "center" };
}

function isThemeLight(themeId: string): boolean {
  return THEMES.find(t => t.id === themeId)?.light ?? false;
}

function swatchRing(active: boolean): React.CSSProperties {
  return active ? { boxShadow: "0 0 0 2.5px #fff, 0 0 0 4.5px #007aff" } : {};
}

// ── Sub-components ────────────────────────────────────────────────────────────

function IosToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative shrink-0 h-[31px] w-[51px] rounded-[100px] overflow-hidden transition-colors duration-200"
      style={{ background: on ? "#34c759" : "rgba(120,120,128,0.32)" }}
    >
      <div
        className="absolute top-1/2 -translate-y-1/2 size-[27px] rounded-full bg-white transition-all duration-200"
        style={{ right: on ? 2 : "auto", left: on ? "auto" : 2, boxShadow: "0 3px 8px rgba(0,0,0,0.15), 0 0 0 0.5px rgba(0,0,0,0.04)" }}
      />
    </button>
  );
}

function ColorSwatches({ selected, onSelect }: { selected: string; onSelect: (c: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isRainbow = !DESIGN_COLORS.includes(selected);
  return (
    <div className="flex flex-wrap gap-y-2 justify-between w-full">
      {DESIGN_COLORS.map(c => (
        <button
          key={c}
          onClick={() => onSelect(c)}
          className="size-[28px] rounded-[14px] shrink-0 transition-transform hover:scale-105"
          style={{
            background: c,
            border: c === "#ffffff" ? "1px solid rgba(0,0,0,0.12)" : "none",
            ...swatchRing(selected === c),
          }}
        />
      ))}
      {/* Rainbow / custom picker */}
      <label className="size-[28px] rounded-[14px] shrink-0 cursor-pointer overflow-hidden relative transition-transform hover:scale-105"
        style={{ background: "conic-gradient(from 90deg, #ff0000, #ff9500, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)", ...swatchRing(isRainbow) }}>
        <input ref={fileRef} type="color" value={isRainbow ? selected : "#007aff"}
          onChange={e => onSelect(e.target.value)}
          className="opacity-0 absolute w-0 h-0 pointer-events-none" />
      </label>
    </div>
  );
}

function Divider() {
  return <div className="w-full h-px shrink-0" style={{ background: "#c6c6c8" }} />;
}

function SectionRow({ icon, label, right }: { icon: React.ReactNode; label: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <span className="text-black">{icon}</span>
        <span className="font-normal text-[17px] text-black leading-normal" style={{ fontFamily: "Inter, sans-serif" }}>{label}</span>
      </div>
      {right}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

interface AddCardModalProps {
  onClose: () => void;
  onPost: (card: UserCard) => void;
  cardCount: number;
}

type Tab = "text" | "image" | "sticker";

export default function AddCardModal({ onClose, onPost, cardCount }: AddCardModalProps) {
  const [step, setStep] = useState<"creating" | "success">("creating");
  const [tab, setTab] = useState<Tab>("text");

  // Theme
  const [themeIdx, setThemeIdx] = useState(0);
  const [customColor, setCustomColor] = useState("#7B61FF");
  const currentTheme = THEMES[themeIdx];
  const isCustom = currentTheme.id === "custom";
  const cardBg = getCardBg(currentTheme.id, customColor);

  // Card side
  const [cardSide, setCardSide] = useState<"front" | "back">("front");

  // Text settings
  const [textContent, setTextContent] = useState("");
  const [fontIdx, setFontIdx] = useState(0);
  const [fontColor, setFontColor] = useState("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [strokeColor, setStrokeColor] = useState("#ffffff");
  const [showFontPicker, setShowFontPicker] = useState(false);

  // Footer
  const [showFooter, setShowFooter] = useState(true);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [footerColor, setFooterColor] = useState("#ffffff");

  // Image / sticker
  const [imagePreview, setImagePreview] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [stickerIdx, setStickerIdx] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [submittedCard, setSubmittedCard] = useState<UserCard | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isAtLimit = cardCount >= MAX_CARDS;

  useEffect(() => {
    if (showCamera && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
  }, [showCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      setShowCamera(true);
    } catch {}
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const c = document.createElement("canvas"); c.width = 320; c.height = 240;
    c.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    return c.toDataURL("image/png");
  };

  const handleSubmit = () => {
    if (isAtLimit) return;
    const bgValue = isCustom ? customColor : currentTheme.id;
    const mainText = textContent.trim() || (tab === "sticker" ? STICKER_LIST[stickerIdx].e : "✦");
    const card: UserCard = {
      bg: bgValue,
      quote: mainText,
      handle: "@" + (userName || "you"),
      type: tab === "image" ? "image" : tab === "sticker" ? "sticker" : "text",
      accentColor: bgValue,
      cardSkin: bgValue,
      id: genId(),
      userName,
      userRole,
      themeId: currentTheme.id,
      imageData: imageBase64 || undefined,
      stickerLabel: tab === "sticker" ? STICKER_LIST[stickerIdx].e : undefined,
      fontStyle: FONT_OPTIONS[fontIdx].family,
      borderStyle: strokeWidth > 0 ? "custom" : "none",
    };
    setSubmittedCard(card);
    onPost(card);
    setStep("success");
    stopCamera();
  };

  // ── Card Preview (right panel + compact mobile) ──────────────────────────
  const CardPreview = ({ compact = false }: { compact?: boolean }) => {
    const isFlipped = cardSide === "back";
    // 30% larger: 280×400 → 364×520
    const cW = compact ? 120 : 364;
    const cH = compact ? 170 : 520;
    return (
      <motion.div
        className="relative shrink-0"
        style={{ width: cW, height: cH, perspective: "1000px" }}
      >
        <motion.div
          className="relative size-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* ── Front face ── */}
          <div
            className="absolute inset-0 overflow-hidden rounded-[18px] flex flex-col justify-between"
            style={{
              backfaceVisibility: "hidden",
              ...cardBg,
              boxShadow: compact ? "0 4px 20px rgba(0,0,0,0.2)" : "0 12px 40px rgba(0,0,0,0.25)",
            }}
          >
            <div className="flex-1 flex items-center p-4">
              <p
                className="font-bold leading-tight break-words"
                style={{
                  fontFamily: FONT_OPTIONS[fontIdx].family,
                  color: fontColor,
                  fontSize: compact ? 11 : 18,
                  WebkitTextStroke: strokeWidth > 0 ? `${strokeWidth * 0.5}px ${strokeColor}` : undefined,
                }}
              >
                {tab === "sticker"
                  ? STICKER_LIST[stickerIdx].e
                  : textContent || (compact ? "Your text" : "Start typing your message…")}
              </p>
            </div>

            {/* Image preview overlay */}
            {tab === "image" && imagePreview && (
              <img src={imagePreview} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}

            {/* Footer */}
            {showFooter && (
              <div className="px-3 pb-2 flex justify-between items-end">
                <span className="text-[9px] font-medium" style={{ color: footerColor, fontSize: compact ? 7 : 10 }}>
                  {userName || "Name"}
                </span>
                <span className="text-[8px] opacity-70" style={{ color: footerColor, fontSize: compact ? 6 : 9 }}>
                  {userRole || "Role"}
                </span>
              </div>
            )}
          </div>

          {/* ── Back face ── */}
          <div
            className="absolute inset-0 overflow-hidden rounded-[18px] flex flex-col items-center justify-center gap-3"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)",
              boxShadow: compact ? "0 4px 20px rgba(0,0,0,0.2)" : "0 12px 40px rgba(0,0,0,0.25)",
            }}
          >
            <div className="text-4xl">✦</div>
            <p className="text-white font-semibold text-lg">{userName || "Your Name"}</p>
            <p className="text-white/60 text-xs">{userRole || "Your Role"}</p>
            <div className="mt-2 px-4 py-1 rounded-full bg-white/10 text-white/50 text-[10px]">
              {currentTheme.label} · {FONT_OPTIONS[fontIdx].label}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // ── Segmented Control ─────────────────────────────────────────────────────
  const tabs: { key: Tab; label: string }[] = [
    { key: "text", label: "Text" },
    { key: "image", label: "Image" },
    { key: "sticker", label: "Sticker" },
  ];

  if (step === "success" && submittedCard) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500] flex items-end md:items-center justify-center"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="w-full md:max-w-sm mx-auto bg-[#eeeeef] md:rounded-[28px] rounded-t-[28px] p-6 text-center relative overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div key={i} className="absolute pointer-events-none rounded-full"
              style={{ width: i % 3 === 0 ? 8 : 5, height: i % 3 === 0 ? 8 : 5, borderRadius: i % 2 === 0 ? "50%" : 2, background: ["#7B61FF", "#ff3b30", "#007aff", "#4cd964", "#fff"][i % 5], left: `${8 + (i * 4.4) % 84}%`, top: -10 }}
              animate={{ y: [0, 260], x: [(i % 2 === 0 ? 1 : -1) * ((i * 7) % 35)], rotate: [0, 360], opacity: [1, 0] }}
              transition={{ duration: 1.2 + (i % 4) * 0.2, delay: i * 0.07, ease: "easeIn" }}
            />
          ))}
          <motion.div
            className="mx-auto mb-5 relative overflow-hidden rounded-2xl flex flex-col justify-between"
            style={{ width: 140, height: 200, ...cardBg, boxShadow: "0 16px 48px rgba(0,0,0,0.2)" }}
            initial={{ scale: 0.7, rotate: -6, opacity: 0, y: 16 }}
            animate={{ scale: 1, rotate: 3, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}
          >
            <div className="flex-1 flex items-center p-3">
              <p className="font-bold text-sm leading-tight" style={{ color: fontColor, fontFamily: FONT_OPTIONS[fontIdx].family }}>
                {submittedCard.quote}
              </p>
            </div>
            {showFooter && (
              <div className="px-3 pb-2 flex justify-between text-[8px]" style={{ color: footerColor }}>
                <span>{userName || "Name"}</span>
                <span className="opacity-70">{userRole || "Role"}</span>
              </div>
            )}
          </motion.div>
          <p className="text-[18px] font-semibold text-black mb-1" style={{ fontFamily: "Inter, sans-serif" }}>You left your mark ✦</p>
          <p className="text-[14px] text-[rgba(60,60,67,0.6)]" style={{ fontFamily: "Inter, sans-serif" }}>Your card is now on the wall</p>
          <button onClick={onClose}
            className="mt-5 w-full h-12 rounded-2xl text-sm font-medium"
            style={{ background: "rgba(120,120,128,0.12)", color: "#111", fontFamily: "Inter, sans-serif" }}>
            Explore the wall
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] flex items-end md:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      {/* Slider CSS */}
      <style>{`
        .ios-slider { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; outline: none; cursor: pointer; background: transparent; width: 100%; }
        .ios-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 28px; height: 28px; border-radius: 50%; background: white; box-shadow: 0 3px 8px rgba(0,0,0,0.2),0 0 0 0.5px rgba(0,0,0,0.06); cursor: pointer; }
        .ios-slider::-moz-range-thumb { width: 28px; height: 28px; border-radius: 50%; background: white; box-shadow: 0 3px 8px rgba(0,0,0,0.2); cursor: pointer; border: none; }
      `}</style>

      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        className="w-full md:w-auto md:max-w-5xl flex md:flex-row flex-col md:rounded-[36px] rounded-t-[28px] overflow-hidden"
        style={{ maxHeight: "96vh", height: "90vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── LEFT PANEL: Form ───────────────────────────────────────────── */}
        <div
          className="flex flex-col overflow-y-auto md:w-[380px] w-full"
          style={{ background: "#eeeeef", fontFamily: "Inter, sans-serif" }}
        >
          <div className="flex flex-col gap-7 px-5 py-8">

            {/* Segmented Control */}
            <div className="bg-[rgba(120,120,128,0.12)] h-[50px] relative rounded-[14px] shrink-0 w-full overflow-hidden">
              <div className="flex items-center p-[3px] h-full gap-0">
                {tabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className="flex-1 h-full relative flex items-center justify-center rounded-[10px] transition-all"
                    style={{ position: "relative" }}
                  >
                    {tab === t.key && (
                      <span className="absolute inset-0 bg-white rounded-[10px] shadow-[0px_4px_12px_rgba(0,0,0,0.12),0px_4px_1.5px_rgba(0,0,0,0.04)]" />
                    )}
                    <span
                      className="relative text-[17px] leading-[28px] text-center tracking-[-0.1px] whitespace-nowrap"
                      style={{ fontWeight: tab === t.key ? 600 : 400 }}
                    >
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {isAtLimit ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">✨</div>
                <p className="text-lg font-semibold text-black">You've dropped your mark</p>
                <p className="text-sm text-[rgba(60,60,67,0.6)] mt-1">Come back and explore!</p>
              </div>
            ) : (
              <div className="flex flex-col flex-1" style={{ minHeight: 500 }}>
                {/* ── TEXT TAB ─────────────────────────────────────────── */}
                {tab === "text" && (
                  <>
                    {/* Text Input section */}
                    <div className="flex flex-col gap-7">
                      <div className="px-0">
                        <div className="flex items-center justify-between py-3">
                          <p className="font-semibold text-[22px] text-black leading-normal">Text Input</p>
                        </div>
                      </div>
                      <textarea
                        value={textContent}
                        onChange={e => setTextContent(e.target.value)}
                        placeholder="Hello, Nice 2 meet u!"
                        maxLength={200}
                        rows={4}
                        className="w-full bg-white rounded-[18px] resize-none outline-none text-black placeholder:text-[rgba(60,60,67,0.3)]"
                        style={{
                          padding: "24px",
                          fontSize: 20,
                          fontWeight: 500,
                          lineHeight: "26px",
                          fontFamily: FONT_OPTIONS[fontIdx].family,
                        }}
                      />
                    </div>

                    {/* Font Settings section */}
                    <div className="flex flex-col gap-0">
                      <div className="py-3">
                        <p className="font-semibold text-[22px] text-black leading-normal">Font Settings</p>
                      </div>

                      {/* Select Font row */}
                      <div className="py-4 relative">
                        <SectionRow
                          icon={<Type size={20} />}
                          label="Select Font"
                          right={
                            <button
                              onClick={() => setShowFontPicker(p => !p)}
                              className="flex items-center gap-1.5"
                            >
                              <span className="text-[17px] text-black" style={{ fontFamily: FONT_OPTIONS[fontIdx].family }}>
                                {FONT_OPTIONS[fontIdx].label}
                              </span>
                              <ChevronDown size={10} color="black" />
                            </button>
                          }
                        />
                        {showFontPicker && (
                          <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-lg z-10 overflow-hidden min-w-[160px]">
                            {FONT_OPTIONS.map((f, i) => (
                              <button
                                key={f.id}
                                onClick={() => { setFontIdx(i); setShowFontPicker(false); }}
                                className="w-full text-left px-4 py-3 text-[15px] hover:bg-[rgba(120,120,128,0.08)] transition-colors flex items-center justify-between"
                                style={{ fontFamily: f.family, fontWeight: fontIdx === i ? 600 : 400 }}
                              >
                                {f.label}
                                {fontIdx === i && <span className="text-[#007aff] text-xs">✓</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <Divider />

                      {/* Font Color */}
                      <div className="flex flex-col gap-4 py-4">
                        <SectionRow
                          icon={<Palette size={20} />}
                          label="Font Color"
                          right={
                            <div className="size-[28px] rounded-[14px] shrink-0"
                              style={{ background: fontColor, border: fontColor === "#ffffff" ? "1px solid rgba(0,0,0,0.12)" : "none" }} />
                          }
                        />
                        <ColorSwatches selected={fontColor} onSelect={setFontColor} />
                      </div>

                      <Divider />

                      {/* Stroke Width */}
                      <div className="flex flex-col gap-4 py-4">
                        <SectionRow
                          icon={<PenTool size={20} />}
                          label="Stroke Width"
                          right={<span className="text-[17px] text-[rgba(60,60,67,0.6)]">{strokeWidth}px</span>}
                        />
                        {/* iOS slider */}
                        <div className="relative h-8 flex items-center">
                          {/* Track */}
                          <div className="absolute left-0 right-0 h-[4px] rounded-full" style={{ background: "#c6c6c8" }} />
                          <div className="absolute left-0 h-[4px] rounded-full" style={{ background: "#007aff", width: `${(strokeWidth / 10) * 100}%` }} />
                          <input
                            type="range" min={0} max={10} step={1} value={strokeWidth}
                            onChange={e => setStrokeWidth(Number(e.target.value))}
                            className="ios-slider relative z-10"
                          />
                        </div>
                        {/* Tick labels */}
                        <div className="flex justify-between text-[10px] text-[rgba(60,60,67,0.6)]">
                          {[0,1,2,3,4,5,6,7,8,9,10].map(n => <span key={n}>{n}</span>)}
                        </div>
                      </div>

                      <Divider />

                      {/* Stroke Color */}
                      <div className="flex flex-col gap-4 py-4">
                        <SectionRow
                          icon={<Paintbrush size={20} />}
                          label="Stroke Color"
                          right={
                            <div className="size-[28px] rounded-[14px] shrink-0"
                              style={{ background: strokeColor, border: strokeColor === "#ffffff" ? "2px solid #c6c6c8" : "none" }} />
                          }
                        />
                        <ColorSwatches selected={strokeColor} onSelect={setStrokeColor} />
                      </div>
                    </div>
                  </>
                )}

                {/* ── IMAGE TAB ─────────────────────────────────────────── */}
                {tab === "image" && (
                  <div className="flex flex-col gap-4">
                    <p className="font-semibold text-[22px] text-black py-1">Image</p>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async e => {
                      const f = e.target.files?.[0]; if (!f) return;
                      setImagePreview(URL.createObjectURL(f));
                      const reader = new FileReader();
                      reader.onload = () => setImageBase64(reader.result as string);
                      reader.readAsDataURL(f);
                    }} />
                    <div className="flex gap-3">
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="flex-1 h-[80px] bg-white rounded-[18px] flex flex-col items-center justify-center gap-2 text-[rgba(60,60,67,0.6)] hover:text-[#007aff] transition-colors"
                      >
                        <ImageIcon size={22} />
                        <span className="text-[13px]">Gallery</span>
                      </button>
                      <button
                        onClick={startCamera}
                        className="flex-1 h-[80px] bg-white rounded-[18px] flex flex-col items-center justify-center gap-2 text-[rgba(60,60,67,0.6)] hover:text-[#007aff] transition-colors"
                      >
                        <Camera size={22} />
                        <span className="text-[13px]">Camera</span>
                      </button>
                    </div>
                    {imagePreview && (
                      <div className="relative">
                        <img src={imagePreview} alt="" className="w-full h-32 object-cover rounded-[18px]" />
                        <button onClick={() => { setImagePreview(""); setImageBase64(""); }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center">
                          <X size={12} color="white" />
                        </button>
                      </div>
                    )}
                    {showCamera && (
                      <div className="relative rounded-[18px] overflow-hidden bg-black">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-40 object-cover" style={{ transform: "scaleX(-1)" }} />
                        <button
                          onClick={() => { const d = capturePhoto(); if (d) { setImagePreview(d); setImageBase64(d); stopCamera(); } }}
                          className="absolute bottom-3 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
                          <div className="w-9 h-9 rounded-full bg-white border-2 border-black" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── STICKER TAB ───────────────────────────────────────── */}
                {tab === "sticker" && (
                  <div className="flex flex-col gap-4">
                    <p className="font-semibold text-[22px] text-black py-1">Sticker</p>
                    <div className="grid grid-cols-4 gap-2">
                      {STICKER_LIST.map((s, i) => (
                        <button key={s.id} onClick={() => setStickerIdx(i)}
                          className="h-[60px] rounded-[18px] flex items-center justify-center text-2xl transition-all"
                          style={{
                            background: stickerIdx === i ? "rgba(0,122,255,0.1)" : "white",
                            ...swatchRing(stickerIdx === i),
                          }}>
                          {s.e}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── SEPARATOR ─────────────────────────────────────────── */}
                <div className="flex justify-center px-0 py-2">
                  <div className="w-full h-px" style={{ background: "#c6c6c8" }} />
                </div>

                {/* ── FOOTER SECTION ────────────────────────────────────── */}
                <div className="flex flex-col gap-6">
                  {/* Footer toggle */}
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[22px] text-black leading-normal">Footer</p>
                    <IosToggle on={showFooter} onToggle={() => setShowFooter(p => !p)} />
                  </div>

                  {showFooter && (
                    <>
                      {/* Your Name */}
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between py-3">
                          <p className="font-normal text-[17px] text-black">Your Name</p>
                        </div>
                        <div className="bg-white rounded-[12px] overflow-hidden">
                          <input
                            value={userName}
                            onChange={e => setUserName(e.target.value)}
                            placeholder="Bruno"
                            maxLength={30}
                            className="w-full px-5 py-5 text-[17px] outline-none bg-transparent text-black placeholder:text-[rgba(60,60,67,0.3)] tracking-[-0.4px]"
                          />
                        </div>
                      </div>

                      {/* Your Role */}
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between py-3">
                          <p className="font-normal text-[17px] text-black">Your Role</p>
                        </div>
                        <div className="bg-white rounded-[12px] overflow-hidden">
                          <input
                            value={userRole}
                            onChange={e => setUserRole(e.target.value)}
                            placeholder="Product Designer"
                            maxLength={40}
                            className="w-full px-5 py-5 text-[17px] outline-none bg-transparent text-black placeholder:text-[rgba(60,60,67,0.3)] tracking-[-0.4px]"
                          />
                        </div>
                      </div>

                      {/* Footer Font Color */}
                      <div className="flex flex-col gap-4">
                        <SectionRow
                          icon={<Palette size={20} />}
                          label="Font Color"
                          right={
                            <div className="size-[28px] rounded-[14px] shrink-0"
                              style={{ background: footerColor, border: footerColor === "#ffffff" ? "2px solid #c6c6c8" : "none" }} />
                          }
                        />
                        <ColorSwatches selected={footerColor} onSelect={setFooterColor} />
                      </div>
                    </>
                  )}
                </div>

                {/* ── ADD TO CARD BUTTON ────────────────────────────────── */}
                <button
                  onClick={handleSubmit}
                  className="w-full rounded-[12px] h-[64px] flex items-center justify-center transition-opacity"
                  style={{
                    background: "#323232",
                    opacity: (tab === "text" && !textContent.trim()) || (tab === "image" && !imageBase64) ? 0.5 : 1,
                  }}
                >
                  <span className="font-semibold text-[19px] text-white" style={{ fontFamily: "Inter, sans-serif" }}>
                    Add To Card
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Card Preview (desktop only) ──────────────────────── */}
        <div className="hidden md:flex flex-1 bg-white flex-col relative overflow-hidden" style={{ minWidth: 480 }}>
          {/* Top controls */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            {/* Front/Back segmented */}
            <div className="bg-[rgba(120,120,128,0.12)] h-[40px] rounded-[10px] overflow-hidden flex p-[3px] gap-0">
              {(["front", "back"] as const).map(side => (
                <button key={side}
                  onClick={() => setCardSide(side)}
                  className="px-5 h-full rounded-[8px] text-[16px] leading-none transition-all relative"
                  style={{ fontWeight: cardSide === side ? 600 : 400 }}>
                  {cardSide === side && <span className="absolute inset-0 bg-white rounded-[8px] shadow-[0px_3px_10px_rgba(0,0,0,0.1)]" />}
                  <span className="relative capitalize">{side}</span>
                </button>
              ))}
            </div>

            {/* Close button - liquid glass */}
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-full transition-opacity hover:opacity-75"
              style={{
                width: 52, height: 52,
                background: "rgba(255,255,255,0.75)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)",
                backdropFilter: "blur(12px)",
              }}
            >
              <X size={20} color="#111" />
            </button>
          </div>

          {/* Card preview centered */}
          <div className="flex-1 flex items-center justify-center pb-4">
            <CardPreview />
          </div>

          {/* Theme selector */}
          <div className="px-6 pb-5 flex flex-col gap-3">
            <p className="text-[18px] font-semibold text-center text-[#979797]" style={{ fontFamily: "Inter, sans-serif" }}>
              Swipe to Change Theme
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {THEMES.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setThemeIdx(i)}
                  className="relative shrink-0 rounded-[18px] overflow-hidden transition-all"
                  style={{
                    width: 88, height: 88,
                    backgroundImage: t.img ? `url(${t.img})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    background: t.img ? undefined : customColor,
                    outline: themeIdx === i ? "2.5px solid #7B61FF" : "2px solid transparent",
                    outlineOffset: 2,
                  }}
                >
                  <div className="absolute inset-0 flex items-end justify-start p-2">
                    <span className="text-[10px] font-semibold text-white"
                      style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
                      {t.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom color (only when custom theme selected) */}
            {isCustom && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[12px] text-[rgba(60,60,67,0.6)]">Color:</span>
                <div className="flex gap-2 flex-wrap">
                  {["#7B61FF","#F24822","#1ABCFE","#111111","#FFCD29","#0FA958","#ff006e","#3a86ff"].map(c => (
                    <button key={c} onClick={() => setCustomColor(c)}
                      className="size-6 rounded-full transition-transform hover:scale-110"
                      style={{ background: c, ...swatchRing(customColor === c) }} />
                  ))}
                  <label className="size-6 rounded-full cursor-pointer overflow-hidden flex items-center justify-center"
                    style={{ background: "conic-gradient(from 90deg, #ff0000, #ff9500, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)" }}>
                    <input type="color" value={customColor} onChange={e => setCustomColor(e.target.value)} className="opacity-0 absolute w-0 h-0" />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
