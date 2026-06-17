const fs = require('fs');
const before = `import { useEffect, useRef, useState } from "react";
import { Plus, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useGyroTilt } from "../hooks/useGyroTilt";

// ── data ─────────────────────────────────────────────────────────────────────

const CARDS_DATA = [
  { bg: "#7B61FF", quote: "Figma just changed everything. Again.", handle: "@devstudio" },
  { bg: "#F24822", quote: "The energy in that room was unreal.", handle: "@carlos_ux" },
  { bg: "#1ABCFE", quote: "Best Config yet. No contest.", handle: "@designlead" },
  { bg: "#111111", quote: "Mind. Blown.", handle: "@sarah_m" },
  { bg: "#FFCD29", quote: "Day 1 forever.", handle: "@jun" },
  { bg: "#7B61FF", quote: "A Study in Pace.", handle: "@mariad" },
  { bg: "#F24822", quote: "Can't believe I almost missed this.", handle: "@priya" },
  { bg: "#1ABCFE", quote: "See you at Config 2026.", handle: "@thomas" },
  { bg: "#111111", quote: "This changed how I think about design.", handle: "@nina" },
  { bg: "#FFCD29", quote: "First Config. Not the last.", handle: "@alex" },
  { bg: "#7B61FF", quote: "Drop your card.", handle: "@drops" },
  { bg: "#F24822", quote: "Config 2025 — we were here.", handle: "@wei" },
  { bg: "#1ABCFE", quote: "Infinite possibilities.", handle: "@aisha" },
  { bg: "#F5F0E8", quote: "The future is collaborative.", handle: "@marcus" },
  { bg: "#7B61FF", quote: "Pixel perfect, every time.", handle: "@leena" },
  { bg: "#111111", quote: "Design without borders.", handle: "@raj" },
  { bg: "#FFCD29", quote: "Keep building.", handle: "@taylor" },
  { bg: "#F24822", quote: "Bold moves only.", handle: "@jordan" },
  { bg: "#1ABCFE", quote: "Ship fast, ship often.", handle: "@sam" },
  { bg: "#7B61FF", quote: "Collaboration is magic.", handle: "@emma" },
  { bg: "#111111", quote: "Less talk, more design.", handle: "@noah" },
  { bg: "#FFCD29", quote: "Dream big. Build bigger.", handle: "@mia" },
  { bg: "#F5F0E8", quote: "Innovate or stagnate.", handle: "@liam" },
  { bg: "#F24822", quote: "Break things. Fix them.", handle: "@zoe" },
];

const CARD_STYLES = [
  { label: "Purple", bg: "#7B61FF" },
  { label: "Coral", bg: "#F24822" },
  { label: "Blue", bg: "#1ABCFE" },
  { label: "Dark", bg: "#111111" },
  { label: "Amber", bg: "#FFCD29" },
  { label: "Holo", bg: "linear-gradient(135deg, #ff006e, #8338ec, #3a86ff, #06ffd4)" },
  { label: "Paper", bg: "#F5F0E8" },
  { label: "Chrome", bg: "linear-gradient(135deg, #868686, #c0c0c0, #e8e8e8, #a0a0a0)" },
];

// ── tunnel constants ──────────────────────────────────────────────────────────

const TUNNEL_SIZES: [number, number][] = [
  [130, 170], [110, 145], [120, 155], [100, 130], [90, 118], [115, 150],
  [125, 165], [105, 138], [135, 175], [95, 125], [80, 105], [118, 155],
];

const POS: [number, number][] = [
  [.07, .08], [.25, .05], [.48, .06], [.68, .07], [.85, .10],
  [.90, .30], [.88, .52], [.84, .70], [.70, .82], [.50, .87],
  [.30, .83], [.12, .76], [.04, .58], [.03, .36], [.08, .18],
  [.22, .28], [.45, .22], [.65, .26], [.80, .44], [.60, .50],
  [.38, .55], [.20, .48], [.55, .68], [.75, .62], [.35, .35],
];

const ROTS = Array(25).fill(0);
const LAYERS = 5;
const DEPTH = 900;

const rng = (s: number) => { const x = Math.sin(s * 7.3 + 1) * 99999; return x - Math.floor(x); };

function blurAmt(z: number) {
  const d = Math.abs(z);
  if (d < 160) return 0;
  return Math.min(14, ((d - 160) / 320) * 14);
}

// ── mobile layout constants ───────────────────────────────────────────────────

const MOBILE_HEIGHTS = [400, 380, 420, 360, 370, 390, 375, 410, 385, 360, 395, 370, 405, 375, 415, 365, 380, 395, 400, 370, 385, 410, 390, 360];
const CARD_W = 290;
const PHONE_W = 390;
const PHONE_H = 640;

const SCATTER_POS = [
  { x: 10, y: 50, r: -6 }, { x: 180, y: 30, r: 5 }, { x: -20, y: 220, r: -8 },
  { x: 200, y: 180, r: 7 }, { x: 30, y: 380, r: -4 }, { x: 220, y: 340, r: 8 },
  { x: -10, y: 490, r: -5 }, { x: 190, y: 480, r: 4 }, { x: 80, y: 130, r: 6 },
  { x: 150, y: 280, r: -3 }, { x: 50, y: 300, r: 5 }, { x: 240, y: 120, r: -7 },
  { x: 20, y: 160, r: 3 }, { x: 210, y: 260, r: -4 }, { x: 0, y: 350, r: 6 },
  { x: 170, y: 420, r: -2 }, { x: 60, y: 200, r: -5 }, { x: 230, y: 400, r: 3 },
  { x: -30, y: 130, r: 7 }, { x: 120, y: 450, r: -6 }, { x: 250, y: 200, r: 4 },
  { x: 40, y: 100, r: -3 }, { x: 160, y: 360, r: 2 }, { x: 100, y: 250, r: -1 },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function isLightBg(bg: string) {
  return bg === "#FFCD29" || bg === "#F5F0E8";
}

function CardFace({ quote, handle, bg, small = false }: {
  quote: string; handle: string; bg: string; small?: boolean;
}) {
  const light = isLightBg(bg);
  const textColor = light ? "rgba(17,17,17,0.9)" : "#fff";
  const mutedColor = light ? "rgba(17,17,17,0.4)" : "rgba(255,255,255,0.45)";
  return (
    <>
      <div style={{
        fontSize: small ? 7 : 8, textTransform: "uppercase", letterSpacing: ".1em",
        color: mutedColor, fontWeight: 500,
        padding: small ? "12px 12px 0" : "14px 14px 0",
      }}>
        Config 2025
      </div>
      <div style={{
        fontSize: small ? 13 : 15, fontWeight: 700, color: textColor, lineHeight: 1.3,
        padding: small ? "6px 12px" : "8px 14px",
        flex: 1, display: "flex", alignItems: "center",
      }}>
        {quote}
      </div>
      <div style={{
        fontSize: small ? 9 : 10, color: mutedColor,
        padding: small ? "0 12px 12px" : "0 14px 14px",
      }}>
        {handle}
      </div>
      <div style={{
        position: "absolute", top: small ? 10 : 12, right: small ? 10 : 12,
        width: 5, height: 5, borderRadius: "50%",
        background: light ? "rgba(17,17,17,0.25)" : "rgba(255,255,255,0.6)",
      }} />
    </>
  );
}

// ── Card Creator Modal ────────────────────────────────────────────────────────

type NewCard = { bg: string; quote: string; handle: string };

function CardModal({ onClose, onPost }: {
  onClose: () => void;
  onPost: (card: NewCard) => void;
}) {
  const [step, setStep] = useState<"creating" | "success">("creating");
  const [styleIdx, setStyleIdx] = useState(0);
  const [quote, setQuote] = useState("");
  const [handle, setHandle] = useState("");
  const [newCard, setNewCard] = useState<NewCard | null>(null);

  const chosen = CARD_STYLES[styleIdx];

  const handlePost = () => {
    if (!quote.trim()) return;
    const card: NewCard = { bg: chosen.bg, quote: quote.trim(), handle: handle.trim() || "@you" };
    setNewCard(card);
    setStep("success");
    onPost(card);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 24 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        className="relative w-full max-w-[420px] rounded-3xl overflow-hidden"
        style={{ background: "#0e0e0e", border: "1px solid rgba(255,255,255,0.1)" }}
        onClick={e => e.stopPropagation()}
      >
        {step === "creating" ? (
          <div className="p-6 space-y-5">
            {/* header */}
            <div className="flex justify-between items-start">
              <div>
                <p style={{ color: "#fff", fontWeight: 600, fontSize: 17, fontFamily: "Inter,sans-serif" }}>
                  Leave your mark
                </p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontFamily: "Inter,sans-serif", marginTop: 2 }}>
                  Config 2025 · Community Wall
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:bg-white/10"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <X size={14} color="rgba(255,255,255,0.6)" />
              </button>
            </div>

            {/* preview card */}
            <div className="flex justify-center">
              <div
                className="relative flex flex-col justify-between overflow-hidden"
                style={{
                  width: 160, height: 220, borderRadius: 20,
                  background: chosen.bg,
                  boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
                  fontFamily: "Inter,sans-serif",
                }}
              >
                <CardFace quote={quote || "Your story here…"} handle={handle || "@you"} bg={chosen.bg} small />
              </div>
            </div>

            {/* style picker */}
            <div>
              <p style={{
                color: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "Inter,sans-serif",
                letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8,
              }}>Style</p>
              <div className="flex gap-2 flex-wrap">
                {CARD_STYLES.map((s, i) => (
                  <button
                    key={i}
                    title={s.label}
                    onClick={() => setStyleIdx(i)}
                    className="w-8 h-8 rounded-full transition-transform hover:scale-110 flex-shrink-0"
                    style={{
                      background: s.bg,
                      outline: styleIdx === i ? "2px solid #fff" : "2px solid transparent",
                      outlineOffset: 2,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* inputs */}
            <div className="space-y-3">
              <textarea
                value={quote}
                onChange={e => setQuote(e.target.value)}
                placeholder="What do you want to say?"
                maxLength={120}
                rows={3}
                className="w-full rounded-2xl px-4 py-3 text-sm resize-none outline-none placeholder:text-white/25"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  fontFamily: "Inter,sans-serif",
                }}
              />
              <input
                value={handle}
                onChange={e => setHandle(e.target.value)}
                placeholder="@your_handle"
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-white/25"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  fontFamily: "Inter,sans-serif",
                }}
              />
            </div>

            {/* post */}
            <button
              onClick={handlePost}
              disabled={!quote.trim()}
              className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background: quote.trim() ? "#7B61FF" : "rgba(123,97,255,0.25)",
                color: quote.trim() ? "#fff" : "rgba(255,255,255,0.4)",
                fontFamily: "Inter,sans-serif",
                cursor: quote.trim() ? "pointer" : "not-allowed",
              }}
            >
              Drop it <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          newCard && <SuccessState card={newCard} onExplore={onClose} />
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Success State ─────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ["#7B61FF", "#F24822", "#1ABCFE", "#FFCD29", "#fff", "#7B61FF", "#F24822"];

function SuccessState({ card, onExplore }: { card: NewCard; onExplore: () => void }) {
  return (
    <div className="p-6 text-center relative overflow-hidden" style={{ fontFamily: "Inter,sans-serif" }}>
      {/* confetti */}
      {Array.from({ length: 22 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            width: i % 3 === 0 ? 8 : 5,
            height: i % 3 === 0 ? 8 : 5,
            borderRadius: i % 2 === 0 ? "50%" : 2,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            left: \`\${6 + (i * 4.2) % 88}%\`,
            top: -10,
          }}
          animate={{
            y: [0, 280 + (i % 5) * 30],
            x: [(i % 2 === 0 ? 1 : -1) * ((i * 7) % 40)],
            rotate: [0, (i % 2 === 0 ? 1 : -1) * (180 + (i * 30) % 180)],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 1.2 + (i % 4) * 0.25,
            delay: (i % 6) * 0.08,
            ease: "easeIn",
          }}
        />
      ))}

      {/* floating card */}
      <div className="flex justify-center pt-2 mb-6">
        <motion.div
          className="relative flex flex-col justify-between overflow-hidden"
          style={{
            width: 160, height: 220, borderRadius: 20,
            background: card.bg,
            boxShadow: "0 16px 56px rgba(0,0,0,0.55)",
            fontFamily: "Inter,sans-serif",
          }}
          initial={{ scale: 0.65, rotate: -8, opacity: 0, y: 20 }}
          animate={{ scale: 1, rotate: 4, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}
        >
          <CardFace quote={card.quote} handle={card.handle} bg={card.bg} small />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <p style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>You left your mark ✦</p>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 4 }}>
          Your card is now on the wall
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        onClick={onExplore}
        className="w-full h-12 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 mt-5 transition-colors hover:bg-white/10"
        style={{
          background: "rgba(255,255,255,0.08)",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        Explore the wall
      </motion.button>
    </div>
  );
}

// ── Desktop Tunnel View ───────────────────────────────────────────────────────

function DesktopView({ onAdd, onCardSelect }: { onAdd: () => void; onCardSelect: (index: number) => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const setModeRef = useRef<(m: "scatter" | "card") => void>(() => {});
  const [mode, setMode] = useState<"scatter" | "card">("scatter");
  const [hintVisible, setHintVisible] = useState(true);
  const [counter, setCounter] = useState(1);

  // ── spacing / zoom controls ──
  const [showControls, setShowControls] = useState(false);
  const [spread, setSpread] = useState(0.6);
  const [depthGap, setDepthGap] = useState(200);
  const [zoom, setZoom] = useState(1.45);
  const spreadRef = useRef(spread);
  const depthGapRef = useRef(depthGap);
  const zoomRef = useRef(zoom);
  spreadRef.current = spread;
  depthGapRef.current = depthGap;
  zoomRef.current = zoom;
  // computed center of POS
  const centerX = POS.reduce((s, [x]) => s + x, 0) / POS.length;
  const centerY = POS.reduce((s, [, y]) => s + y, 0) / POS.length;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const vw = wrap.clientWidth;
    const vh = wrap.clientHeight;

    // mutable state
    const s = {
      mode: "scatter" as "scatter" | "card",
      panX: 0, panY: 0, tPanX: 0, tPanY: 0,
      scrollZ: 0, targetScrollZ: 0,
      spread: spreadRef.current, cx: centerX, cy: centerY,
      depthGap: depthGapRef.current, zoom: zoomRef.current,
      hoveredIndex: null as number | null,
      isDown: false, holdActive: false,
      holdTimer: null as ReturnType<typeof setTimeout> | null,
      lmx: 0, lmy: 0,
      dragging: false, dragStartX: 0, dragCurX: 0,
      cardIdx: 0,
      hintGone: false,
      rafId: 0,
    };

    type TCard = {
      el: HTMLDivElement;
      bx: number; by: number; bz: number; rot: number;
      w: number; h: number; bg: string;
      nx: number; ny: number;
      isCenter: boolean;
    };

    const cards: TCard[] = [];

    for (let l = 0; l < LAYERS; l++) {
      for (let i = 0; i < CARDS_DATA.length; i++) {
        const data = CARDS_DATA[i % CARDS_DATA.length];
        const [w, h] = TUNNEL_SIZES[i % TUNNEL_SIZES.length];
        const pi = (l * 7 + i) % POS.length;
        const [px, py] = POS[pi];
        const jx = (rng(l * 50 + i) - .5) * 80;
        const jy = (rng(l * 50 + i + 1) - .5) * 55;
        // compute base position with spread applied
        const sp = s.spread;
        const spPx = (px - s.cx) * sp + s.cx;
        const spPy = (py - s.cy) * sp + s.cy;
        const bx = spPx * vw - w / 2 + jx;
        const by = spPy * vh - h / 2 + jy;
        const bz = -l * s.depthGap;
        const rot = ROTS[(l * 7 + i) % ROTS.length];
        const light = isLightBg(data.bg);
        const textColor = light ? "rgba(17,17,17,0.9)" : "#fff";
        const mutedColor = light ? "rgba(17,17,17,0.4)" : "rgba(255,255,255,0.45)";

        // create 9 mirror copies (3×3 grid) for infinite pan
        const logicalIdx = l * CARDS_DATA.length + i;
        [-vw, 0, vw].forEach((xOff) => {
          [-vh, 0, vh].forEach((yOff) => {
            const el = document.createElement("div");
            el.style.cssText = \`position:absolute;border-radius:20px;overflow:hidden;user-select:none;will-change:transform,filter,opacity;backface-visibility:hidden;display:flex;flex-direction:column;justify-content:space-between;width:\${w}px;height:\${h}px;background:\${data.bg};left:\${bx + xOff}px;top:\${by + yOff}px;box-shadow:0 8px 32px rgba(0,0,0,0.35);font-family:Inter,sans-serif;\`;
            el.innerHTML = [
              '<div style="font-size:8px;text-transform:uppercase;letter-spacing:.1em;color:',mutedColor,';font-weight:500;padding:14px 14px 0">Config 2025</div>',
              '<div style="font-size:14px;font-weight:700;color:',textColor,';line-height:1.3;padding:8px 14px;flex:1;display:flex;align-items:center">',data.quote,'</div>',
              '<div style="font-size:10px;color:',mutedColor,';padding:0 14px 14px">',data.handle,'</div>',
              '<div style="position:absolute;top:12px;right:12px;width:5px;height:5px;border-radius:50%;background:',light ? "rgba(17,17,17,0.25)" : "rgba(255,255,255,0.6)",'"></div>',
            ].join("");
            el.dataset.cardIndex = String(logicalIdx);
            el.addEventListener("mouseenter", () => { s.hoveredIndex = logicalIdx; });
            el.addEventListener("mouseleave", () => { s.hoveredIndex = null; });
            el.addEventListener("click", () => {
              if (s.mode === "scatter") {
                onCardSelect(logicalIdx % CARDS_DATA.length);
              }
            });
            canvas.appendChild(el);
            cards.push({ el, bx: bx + xOff, by: by + yOff, bz, rot, w, h, bg: data.bg, nx: px, ny: py, isCenter: xOff === 0 && yOff === 0 });
          });
        });
      }
    }

    const drawScatter = () => {
      const sp = spreadRef.current;
      const dg = depthGapRef.current;
      const zm = zoomRef.current;
      s.spread = sp; s.depthGap = dg; s.zoom = zm;
      const loop = LAYERS * dg;
      cards.forEach(({ el, nx, ny, w, h, rot }, idx) => {
        const spPx = (nx - s.cx) * sp + s.cx;
        const spPy = (ny - s.cy) * sp + s.cy;
        const cBx = spPx * vw - w / 2;
        const cBy = spPy * vh - h / 2;
        const layer = Math.floor(idx / (CARDS_DATA.length * 9));
        const cBz = -layer * dg;
        const rx = cBx + s.panX;
        const ry = cBy + s.panY;
        let z = ((cBz + s.scrollZ) % loop + loop) % loop;
        if (z > loop * .78) z = z - loop;
        const far = -dg * (LAYERS - 1) - 200;
        const near = 460;
        const t = (z - far) / (near - far);
        const baseScale = Math.max(.04, (.20 + t * .92) * zm);
        const hoverScale = s.hoveredIndex === idx ? 1.08 : 1;
        const finalScale = baseScale * hoverScale;
        const op = Math.max(0, Math.min(1, t * 1.9 - .15));
        const zLimit = dg * LAYERS * 1.2;
        if (z < -zLimit || z > 680) { el.style.visibility = "hidden"; return; }
        el.style.visibility = "visible";
        el.style.opacity = String(op);
        el.style.zIndex = String(Math.round(z + 6000));
        el.style.transform = \`translate3d(\${rx}px,\${ry}px,\${z}px) scale(\${finalScale}) rotate(\${rot}deg)\`;
        el.style.filter = "none";
        el.style.cursor = s.hoveredIndex === idx ? "pointer" : "default";
        el.style.boxShadow = s.hoveredIndex === idx
          ? "0 12px 40px rgba(0,0,0,0.18)"
          : "0 8px 32px rgba(0,0,0,0.12)";
      });
    };

    const drawCard = () => {
      const centers = cards.filter(c => c.isCenter);
      const total = centers.length;
      const idx = s.cardIdx;
      cards.forEach(c => { c.el.style.visibility = "hidden"; c.el.style.opacity = "0"; });
      centers.forEach((c, i) => {
        const rel = ((i - idx) % total + total) % total;
        const el = c.el;
        const cx = vw / 2 - c.w / 2;
        const cy = vh / 2 - c.h / 2 - 20;
        if (rel === 0) {
          el.style.visibility = "visible";
          el.style.transition = "transform .4s cubic-bezier(.34,1.2,.64,1),opacity .3s,filter .3s,left .4s,top .4s";
          el.style.left = cx + "px"; el.style.top = cy + "px";
          el.style.transform = "translate3d(0,0,0) rotate(0deg) scale(1)";
          el.style.opacity = "1"; el.style.zIndex = "50"; el.style.cursor = "grab";
        } else if (rel === 1) {
          el.style.visibility = "visible";
          el.style.transition = "transform .4s cubic-bezier(.34,1.2,.64,1),opacity .3s,left .4s,top .4s";
          el.style.left = (cx + 16) + "px"; el.style.top = (cy + 14) + "px";
          el.style.transform = "translate3d(0,0,0) rotate(3deg) scale(0.94)";
          el.style.opacity = ".65"; el.style.zIndex = "40"; el.style.filter = "blur(0.5px)"; el.style.cursor = "default";
        } else if (rel === 2) {
          el.style.visibility = "visible";
          el.style.transition = "transform .4s cubic-bezier(.34,1.2,.64,1),opacity .3s,left .4s,top .4s";
          el.style.left = (cx - 12) + "px"; el.style.top = (cy + 26) + "px";
          el.style.transform = "translate3d(0,0,0) rotate(-2deg) scale(0.88)";
          el.style.opacity = ".35"; el.style.zIndex = "30"; el.style.filter = "blur(1.5px)"; el.style.cursor = "default";
        } else if (rel === 3) {
          el.style.visibility = "visible";
          el.style.transition = "transform .4s,opacity .3s,left .4s,top .4s";
          el.style.left = cx + "px"; el.style.top = (cy + 36) + "px";
          el.style.transform = "translate3d(0,0,0) scale(0.82)";
          el.style.opacity = ".15"; el.style.zIndex = "20"; el.style.filter = "blur(2px)"; el.style.cursor = "default";
        } else {
          el.style.visibility = "hidden"; el.style.opacity = "0"; el.style.zIndex = "5";
        }
      });
    };

    const applyMode = (m: "scatter" | "card") => {
      s.mode = m;
      setMode(m);
      if (m === "card") {
        s.panX = 0; s.panY = 0; s.tPanX = 0; s.tPanY = 0;
        drawCard();
      }
    };

    setModeRef.current = applyMode;

    const tick = () => {
      s.panX += (s.tPanX - s.panX) * .10;
      s.panY += (s.tPanY - s.panY) * .10;
      s.scrollZ += (s.targetScrollZ - s.scrollZ) * 0.04;
      if (s.mode === "scatter") drawScatter();
      s.rafId = requestAnimationFrame(tick);
    };
    drawScatter();
    s.rafId = requestAnimationFrame(tick);

    const onDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      if (s.mode === "card") {
        s.dragging = true; s.dragStartX = e.clientX; s.dragCurX = 0;
        const centers = cards.filter(c => c.isCenter);
        const top = centers[s.cardIdx % centers.length];
        if (top) top.el.style.transition = "none";
        return;
      }
      s.isDown = true; s.lmx = e.clientX; s.lmy = e.clientY;
      s.holdTimer = setTimeout(() => { s.holdActive = true; wrap.style.cursor = "grabbing"; }, 160);
      if (!s.hintGone) { s.hintGone = true; setHintVisible(false); }
    };

    const onMove = (e: MouseEvent) => {
      if (s.mode === "card" && s.dragging) {
        s.dragCurX = e.clientX - s.dragStartX;
        const centers = cards.filter(c => c.isCenter);
        const top = centers[s.cardIdx % centers.length];
        if (top) {
          const cx = vw / 2 - top.w / 2;
          const cy = vh / 2 - top.h / 2 - 20;
          const rot = s.dragCurX * 0.06;
          top.el.style.transform = \`translate3d(\${s.dragCurX}px,\${Math.abs(s.dragCurX) * .05}px,0) rotate(\${rot}deg) scale(1)\`;
        }
        return;
      }
      if (!s.isDown || !s.holdActive) return;
      s.tPanX += e.clientX - s.lmx; s.tPanY += e.clientY - s.lmy;
      s.lmx = e.clientX; s.lmy = e.clientY;
    };

    const onUp = () => {
      if (s.mode === "card" && s.dragging) {
        s.dragging = false;
        const centers = cards.filter(c => c.isCenter);
        if (Math.abs(s.dragCurX) > 90) {
          const top = centers[s.cardIdx % centers.length];
          const dir = s.dragCurX > 0 ? 1 : -1;
          if (top) {
            top.el.style.transition = "transform .35s cubic-bezier(.55,.06,.68,.19),opacity .3s";
            top.el.style.transform = \`translateX(\${dir * 500}px) rotate(\${dir * 20}deg) scale(0.9)\`;
            top.el.style.opacity = "0";
          }
          setTimeout(() => {
            s.cardIdx = (s.cardIdx + 1) % centers.length;
            setCounter(s.cardIdx + 1);
            drawCard();
          }, 380);
        } else {
          drawCard();
        }
        return;
      }
      s.isDown = false; s.holdActive = false;
      wrap.style.cursor = "default";
      if (s.holdTimer) clearTimeout(s.holdTimer);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (s.mode === "card") { applyMode("scatter"); return; }
      s.targetScrollZ += e.deltaY * 2.1;
      if (!s.hintGone) { s.hintGone = true; setHintVisible(false); }
    };

    wrap.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    wrap.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(s.rafId);
      canvas.innerHTML = "";
      wrap.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      wrap.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full h-full overflow-hidden select-none" style={{ background: "#ffffff" }}>
      {/* 3D stage */}
      <div className="absolute inset-0" style={{ perspective: "1000px", transformStyle: "preserve-3d" }}>
        <div ref={canvasRef} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }} />
      </div>

      {/* Logo */}
      <div className="absolute top-4 left-5 pointer-events-none z-10"
        style={{ color: "rgba(17,17,17,0.4)", fontSize: 12, fontFamily: "Inter,sans-serif", fontWeight: 500, letterSpacing: ".04em" }}>
        Drops ✦
      </div>

      {/* Hint */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap z-10 transition-opacity duration-700"
        style={{
          opacity: hintVisible ? 1 : 0,
          color: "rgba(17,17,17,0.22)", fontSize: 10,
          fontFamily: "Inter,sans-serif", letterSpacing: ".12em", textTransform: "uppercase",
        }}>
        scroll · hold & drag
      </div>

      {/* Mode label */}
      <div className="absolute top-4 right-5 pointer-events-none z-10"
        style={{ color: "rgba(17,17,17,0.22)", fontSize: 10, fontFamily: "Inter,sans-serif", letterSpacing: ".1em", textTransform: "uppercase" }}>
        {mode}
      </div>

      {/* Counter (card mode) */}
      {mode === "card" && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap z-10"
          style={{ color: "rgba(17,17,17,0.25)", fontSize: 10, fontFamily: "Inter,sans-serif" }}>
          {counter} of {CARDS_DATA.length}
        </div>
      )}

      {/* Mode pills */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 items-center z-[100]">
        {(["scatter", "card"] as const).map(m => (
          <button
            key={m}
            onClick={() => setModeRef.current(m)}
            className="h-[38px] rounded-full border px-4 text-[11px] tracking-[.05em] transition-all"
            style={{
              background: mode === m ? "rgba(17,17,17,0.12)" : "rgba(17,17,17,0.05)",
              borderColor: mode === m ? "rgba(17,17,17,0.25)" : "rgba(17,17,17,0.1)",
              color: mode === m ? "#111" : "rgba(17,17,17,0.5)",
              fontFamily: "Inter,sans-serif",
              backdropFilter: "blur(10px)",
            }}>
            {m === "scatter" ? "Scatter View" : "Card View"}
          </button>
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={onAdd}
        className="absolute bottom-5 right-5 w-12 h-12 rounded-full flex items-center justify-center z-[100] transition-transform hover:scale-110 active:scale-95"
        style={{
          background: "rgba(17,17,17,0.08)",
          border: "1px solid rgba(17,17,17,0.15)",
          backdropFilter: "blur(12px)",
        }}>
        <Plus size={18} color="#111" />
      </button>

      {/* Spacing controls toggle */}
      <button
        onClick={() => setShowControls(p => !p)}
        className="absolute bottom-5 left-5 flex items-center justify-center z-[100] transition-transform hover:scale-110 active:scale-95"
        style={{
          height: 38, paddingInline: 14,
          borderRadius: 19,
          background: "rgba(17,17,17,0.08)",
          border: "1px solid rgba(17,17,17,0.15)",
          backdropFilter: "blur(12px)",
          color: "#111",
          fontSize: 10,
          fontFamily: "Inter,sans-serif",
          letterSpacing: ".05em",
        }}>
        {showControls ? "✕" : "◉ Controls"}
      </button>

      {/* Control panel */}
      {showControls && (
        <div
          className="absolute z-[200]"
          style={{
            bottom: 64, left: 20,
            background: "rgba(255,255,255,0.95)",
            border: "1px solid rgba(17,17,17,0.12)",
            borderRadius: 16,
            padding: "16px 20px",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            fontFamily: "Inter,sans-serif",
            minWidth: 220,
          }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#111", marginBottom: 12, letterSpacing: ".04em" }}>
            Spacing & Zoom
          </div>
          {[
            { label: "Spread", val: spread, set: setSpread, min: 0.2, max: 1.5, step: 0.05 },
            { label: "Depth", val: depthGap, set: setDepthGap, min: 200, max: 1200, step: 50 },
            { label: "Zoom", val: zoom, set: setZoom, min: 0.5, max: 2.5, step: 0.05 },
          ].map(({ label, val, set, min, max, step }) => (
            <div key={label} style={{ marginBottom: 10 }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 10, color: "rgba(17,17,17,0.5)", marginBottom: 4,
              }}>
                <span>{label}</span>
                <span style={{ fontWeight: 600, color: "#111" }}>{val}</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={val}
                onChange={e => set(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "#7B61FF" }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}`;

const after = `
// ── Desktop Card Gallery Modal ────────────────────────────────────────────────

function CardGalleryModal({
  card,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  card: typeof CARDS_DATA[0];
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/35"
      onClick={onClose}
    >
      <div
        className="relative w-[min(440px,90vw)] rounded-[24px] bg-white p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#111] shadow"
          onClick={onClose}
        >
          ×
        </button>
        <button
          className="absolute left-[-56px] top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#111] shadow md:flex"
          onClick={onPrev}
        >
          ‹
        </button>
        <button
          className="absolute right-[-56px] top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#111] shadow md:flex"
          onClick={onNext}
        >
          ›
        </button>
        <div
          className="relative flex h-[520px] flex-col justify-between overflow-hidden rounded-[20px] p-5"
          style={{ background: card.bg, fontFamily: "Inter,sans-serif" }}
        >
          <div className="text-[10px] uppercase tracking-[0.14em] text-black/45">
            CONFIG 2026
          </div>
          <div className="flex flex-1 items-center text-[28px] font-bold leading-tight"
            style={{ color: card.bg === "#FFCD29" || card.bg === "#F5F0E8" ? "#111" : "#fff" }}>
            {card.quote}
          </div>
          <div className="text-[13px] text-black/45">
            {card.handle}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <button className="rounded-full bg-black/5 px-3 py-1">\\u2764\\ufe0f 24</button>
          <button className="rounded-full bg-black/5 px-3 py-1">\\ud83d\\udd25 12</button>
          <button className="rounded-full bg-black/5 px-3 py-1">\\u2728 40</button>
        </div>
        <div className="mt-4 rounded-2xl bg-black/5 p-3">
          <div className="text-xs text-black/40">Comments</div>
          <div className="mt-2 text-sm text-black/70">
            This was such a good moment.
          </div>
        </div>
        <div className="mt-3 text-center text-xs text-black/30">
          {index + 1} of {total}
        </div>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [showModal, setShowModal] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // keyboard navigation for gallery modal
  useEffect(() => {
    if (selectedCardIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedCardIndex(null);
      if (e.key === "ArrowRight") {
        setSelectedCardIndex(i => i !== null ? (i + 1) % CARDS_DATA.length : null);
      }
      if (e.key === "ArrowLeft") {
        setSelectedCardIndex(i => i !== null ? (i - 1 + CARDS_DATA.length) % CARDS_DATA.length : null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCardIndex]);

  const handlePost = (_card: NewCard) => {
    // would push to wall data
  };

  return (
    <div className="w-full h-full" style={{ fontFamily: "Inter, sans-serif" }}>
      {isMobile
        ? <MobileView onAdd={() => setShowModal(true)} />
        : <DesktopView onAdd={() => setShowModal(true)} onCardSelect={(i) => setSelectedCardIndex(i)} />
      }

      <AnimatePresence>
        {showModal && (
          <CardModal onClose={() => setShowModal(false)} onPost={handlePost} />
        )}
      </AnimatePresence>

      {selectedCardIndex !== null && (
        <CardGalleryModal
          card={CARDS_DATA[selectedCardIndex]}
          index={selectedCardIndex}
          total={CARDS_DATA.length}
          onClose={() => setSelectedCardIndex(null)}
          onPrev={() => setSelectedCardIndex(i => i !== null ? (i - 1 + CARDS_DATA.length) % CARDS_DATA.length : null)}
          onNext={() => setSelectedCardIndex(i => i !== null ? (i + 1) % CARDS_DATA.length : null)}
        />
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/app/App_temp.tsx', before + '\n' + after);
console.log('Written');
