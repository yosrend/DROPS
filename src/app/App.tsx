import React, { useEffect, useRef, useState } from "react";
import { Plus, X, ArrowRight, Menu, QrCode, Users, Layers, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useGyroTilt } from "../hooks/useGyroTilt";
import Onboarding from "./components/Onboarding";
import AddCardModal from "./components/AddCardModal";
import AdminPanel from "./components/AdminPanel";

import { CardFace } from "./components/CardFace";
import Toast from "./components/Toast";
import MyDropHub from "./components/MyDropHub";
import QrScanner from "./components/QrScanner";

import { ONBOARDING_KEY, CARDS_KEY, type UserCard } from "./data/defaults";
import { getDrops, createDrop, shareDropLink, shareWallLink, getDropById } from "../services/dropsService";
import { getDeviceId } from "../utils/device";

// ── data ─────────────────────────────────────────────────────────────────────

const CARD_THEMES = ["chrome","heatmap","holographic","blurry","fractal","frosted_glow","gradient","halftone","paper"];

const CARDS_DATA = [
  { bg: "#7B61FF", quote: "Figma just changed everything. Again.", handle: "@devstudio" },
  { bg: "#F24822", quote: "The energy in that room was unreal.", handle: "@carlos_ux" },
  { bg: "#1ABCFE", quote: "Best Config yet. No contest.", handle: "@designlead" },
  { bg: "#111111", quote: "Mind. Blown.", handle: "@sarah_m" },
  { bg: "#FFCD29", quote: "Day 1 forever.", handle: "@jun" },
  { bg: "#F5F0E8", quote: "A Study in Pace.", handle: "@mariad" },
  { bg: "#0FA958", quote: "Can't believe I almost missed this.", handle: "@priya" },
  { bg: "#8338ec", quote: "See you at Config 2026.", handle: "@thomas" },
  { bg: "#ff006e", quote: "This changed how I think about design.", handle: "@nina" },
  { bg: "#3a86ff", quote: "First Config. Not the last.", handle: "@alex" },
  { bg: "#7B61FF", quote: "Drop your card.", handle: "@drops" },
  { bg: "#F24822", quote: "Config 2025 — we were here.", handle: "@wei" },
  { bg: "#1ABCFE", quote: "Infinite possibilities.", handle: "@aisha" },
  { bg: "#111111", quote: "The future is collaborative.", handle: "@leena" },
  { bg: "#FFCD29", quote: "Pixel perfect.", handle: "@raj" },
  { bg: "#F5F0E8", quote: "Design without borders.", handle: "@taylor" },
  { bg: "#0FA958", quote: "Keep building.", handle: "@jordan" },
  { bg: "#8338ec", quote: "Bold moves only.", handle: "@sam" },
  { bg: "#ff006e", quote: "Innovate or stagnate.", handle: "@zoe" },
  { bg: "#3a86ff", quote: "Dream big. Build bigger.", handle: "@mia" },
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

const TUNNEL_SIZES: [number, number][] = Array(24).fill([110, 157]);

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

const MOBILE_HEIGHTS = Array(24).fill(457);
const CARD_W = 320;
const PHONE_W = 390;
const PHONE_H = 640;

const SCATTER_POS: { x: number; y: number; r: number; s: number }[] = [
  { x: -50, y: 20, r: -8, s: 0.7 }, { x: 80, y: -10, r: 3, s: 0.9 }, { x: 200, y: 10, r: -4, s: 0.6 },
  { x: -20, y: 160, r: 5, s: 0.8 }, { x: 120, y: 130, r: -2, s: 1.1 }, { x: 280, y: 100, r: 6, s: 0.7 },
  { x: 300, y: 240, r: -6, s: 0.5 }, { x: -40, y: 300, r: 4, s: 0.9 }, { x: 100, y: 280, r: -5, s: 1.0 },
  { x: 230, y: 350, r: 2, s: 0.6 }, { x: 50, y: 390, r: -7, s: 0.8 }, { x: 180, y: 420, r: 3, s: 1.2 },
  { x: -10, y: 480, r: -3, s: 0.7 }, { x: 140, y: 530, r: 5, s: 0.5 }, { x: 290, y: 500, r: -4, s: 0.9 },
  { x: 30, y: 560, r: 2, s: 0.6 }, { x: 220, y: 180, r: -1, s: 1.0 }, { x: 310, y: 380, r: 7, s: 0.8 },
  { x: 160, y: 200, r: -5, s: 0.7 }, { x: 260, y: 60, r: 4, s: 0.6 }, { x: 340, y: 300, r: -3, s: 0.5 },
  { x: 0, y: 250, r: -2, s: 0.9 }, { x: 350, y: 150, r: 6, s: 0.7 }, { x: 70, y: 450, r: -8, s: 0.8 },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function isLightBg(bg: string) {
  return bg === "#FFCD29" || bg === "#F5F0E8";
}

// ── Card Creator Modal (imported from AddCardModal) ──────────────────────

const CONFETTI_COLORS = ["#7B61FF", "#F24822", "#1ABCFE", "#FFCD29", "#fff", "#7B61FF", "#F24822"];

// ── Desktop Tunnel View ───────────────────────────────────────────────────────

function DesktopView({ onAdd, onCardSelect, onCardTheme, onMyDrop, onScan, hasDrops }: { onAdd: () => void; onCardSelect: (index: number) => void; onCardTheme?: (themeId: string) => void; onMyDrop?: () => void; onScan?: () => void; hasDrops?: boolean }) {
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
  const [zoom, setZoom] = useState(0.82);
  const [autoPlay, setAutoPlay] = useState(true);
  const spreadRef = useRef(spread);
  const depthGapRef = useRef(depthGap);
  const zoomRef = useRef(zoom);
  spreadRef.current = spread;
  depthGapRef.current = depthGap;
  zoomRef.current = zoom;
  const autoPlayRef = useRef(false);
  autoPlayRef.current = autoPlay;
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
            const themeImg = CARD_THEMES[(l * CARDS_DATA.length + i) % CARD_THEMES.length];
            el.style.cssText = `position:absolute;border-radius:10px;overflow:hidden;user-select:none;will-change:transform,filter,opacity;backface-visibility:hidden;display:flex;flex-direction:column;justify-content:space-between;width:${w}px;height:${h}px;background:url(/cards/card-${themeImg}.png) center/cover no-repeat;left:${bx + xOff}px;top:${by + yOff}px;box-shadow:0 8px 32px rgba(0,0,0,0.35);font-family:Inter,sans-serif;`;
            el.innerHTML = `
              <div style="font-size:14px;font-weight:700;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.3);line-height:1.3;padding:14px 14px 0;flex:1;display:flex;align-items:center">${data.quote}</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.7);padding:0 14px 14px">${data.handle}</div>
            `;
            el.dataset.cardIndex = String(logicalIdx);
            el.addEventListener("mouseenter", () => { s.hoveredIndex = logicalIdx; });
            el.addEventListener("mouseleave", () => { s.hoveredIndex = null; });
            el.addEventListener("click", () => {
              if (s.mode === "scatter") {
                onCardSelect(logicalIdx % CARDS_DATA.length);
                onCardTheme?.(CARD_THEMES[(l * CARDS_DATA.length + i) % CARD_THEMES.length]);
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
        // compute current position from spread + normalized coords
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
        el.style.transform = `translate3d(${rx}px,${ry}px,${z}px) scale(${finalScale}) rotate(${rot}deg)`;
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
      // hide all, then show relevant center copies
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
      // wrap panY for infinite vertical scroll
      if (s.panY > vh * 0.5) { s.panY -= vh; s.tPanY -= vh; }
      if (s.panY < -vh * 0.5) { s.panY += vh; s.tPanY += vh; }
      s.scrollZ += (s.targetScrollZ - s.scrollZ) * 0.04;
      if (autoPlayRef.current) s.targetScrollZ -= 0.2;
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
          top.el.style.transform = `translate3d(${s.dragCurX}px,${Math.abs(s.dragCurX) * .05}px,0) rotate(${rot}deg) scale(1)`;
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
            top.el.style.transform = `translateX(${dir * 500}px) rotate(${dir * 20}deg) scale(0.9)`;
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
    <div ref={wrapRef} className="relative w-full h-full overflow-hidden select-none" style={{ background: "#000000" }}>
      {/* 3D stage */}
      <div className="absolute inset-0" style={{ perspective: "1000px", transformStyle: "preserve-3d" }}>
        <div ref={canvasRef} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }} />
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

      {/* Center FAB — Liquid Metal */}
      {/* Center FAB */}
      <button onClick={hasDrops ? () => onMyDrop?.() : onAdd}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 z-[100] transition-all hover:scale-105 active:scale-95"
        style={{
          height: 52, paddingInline: 24,
          borderRadius: 26,
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          color: "#fff",
          fontFamily: "Inter,sans-serif",
          fontSize: 14,
          fontWeight: 500,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2), 0 0 0 0.5px rgba(255,255,255,0.08)",
        }}>
        {hasDrops ? <Layers size={16} color="#fff" /> : <Plus size={16} color="#fff" />}
        {hasDrops ? "My Drop" : "Create your drops"}
      </button>

      {/* Controls button — bottom left */}
      <button onClick={() => setShowControls(p => !p)}
        className="absolute bottom-8 left-4 flex items-center justify-center gap-2 z-[100] transition-all hover:scale-105 active:scale-95"
        style={{
          width: 52, height: 52,
          borderRadius: 26,
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2), 0 0 0 0.5px rgba(255,255,255,0.08)",
        }}>
        <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3"/>
          <line x1="4.5" y1="7" x2="13.5" y2="7" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3"/>
          <line x1="4.5" y1="11" x2="13.5" y2="11" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3"/>
          <line x1="7" y1="4.5" x2="7" y2="13.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3"/>
          <line x1="11" y1="4.5" x2="11" y2="13.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3"/>
        </svg>
      </button>

      {/* Controls popup */}
      {showControls && (
        <>
          <div className="fixed inset-0 z-[199]" onClick={() => setShowControls(false)} />
          <div className="fixed bottom-24 left-4 z-[200] rounded-2xl p-4 w-56"
            style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-[11px] font-medium text-white/50 mb-3 uppercase tracking-wider">Tunnel Controls</p>

            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-white/40 mb-1">
                <span>Spread</span><span>{spread.toFixed(2)}</span>
              </div>
              <input type="range" min={0.2} max={1.2} step={0.01} value={spread}
                onChange={e => setSpread(Number(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{ background: "rgba(255,255,255,0.12)", accentColor: "rgba(255,255,255,0.5)" }} />
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-white/40 mb-1">
                <span>Depth</span><span>{depthGap}px</span>
              </div>
              <input type="range" min={80} max={400} step={10} value={depthGap}
                onChange={e => setDepthGap(Number(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{ background: "rgba(255,255,255,0.12)", accentColor: "rgba(255,255,255,0.5)" }} />
            </div>

            <div className="mb-1">
              <div className="flex justify-between text-[10px] text-white/40 mb-1">
                <span>Zoom</span><span>{zoom.toFixed(2)}x</span>
              </div>
              <input type="range" min={0.6} max={2.5} step={0.01} value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{ background: "rgba(255,255,255,0.12)", accentColor: "rgba(255,255,255,0.5)" }} />
            </div>
          </div>
        </>
      )}

      {/* Play/Pause button — bottom right */}
      <button onClick={() => setAutoPlay(p => !p)}
        className="absolute bottom-8 right-4 flex items-center justify-center z-[100] transition-all hover:scale-105 active:scale-95"
        style={{
          width: 52, height: 52,
          borderRadius: 26,
          background: autoPlay ? "rgba(123,97,255,0.12)" : "rgba(255,255,255,0.12)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: autoPlay ? "0 0 20px rgba(123,97,255,0.15)" : "0 8px 32px rgba(0,0,0,0.2), 0 0 0 0.5px rgba(255,255,255,0.08)",
        }}>
        {autoPlay ? (
          <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <rect x="3.5" y="2" width="3" height="12" rx="1" fill="rgba(255,255,255,0.8)"/>
            <rect x="9.5" y="2" width="3" height="12" rx="1" fill="rgba(255,255,255,0.8)"/>
          </svg>
        ) : (
          <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <path d="M4 2l10 6-10 6V2z" fill="rgba(255,255,255,0.7)"/>
          </svg>
        )}
      </button>
    </div>
  );
}

// ── Mobile Stack View ─────────────────────────────────────────────────────────

function MobileView({ onAdd, onCardSelect, onCardTheme, onMyDrop, hasDrops }: { onAdd: () => void; onCardSelect?: (i: number) => void; onCardTheme?: (themeId: string) => void; onMyDrop?: () => void; hasDrops?: boolean }) {
  const [mode, setMode] = useState<"stack" | "carousel" | "scatter" | "feed">("stack");
  const [scrollPos, setScrollPos] = useState(0);
  const [scrollPosX, setScrollPosX] = useState(0);
  const [panX, setPanX] = useState(0);
  const [anim, setAnim] = useState(false);
  const [animPhase, setAnimPhase] = useState(0);
  const rafRef = useRef<number>(0);

  // Long press → overlay
  const [overlayCard, setOverlayCard] = useState<number | null>(null);
  const [overlayFlipped, setOverlayFlipped] = useState(false);
  const [overlayClosing, setOverlayClosing] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // pinch state
  const [scatterScale, setScatterScale] = useState(1);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef(1);
  const pinchTriggeredRef = useRef(false);

  // gyro
  const gyro = useGyroTilt();

  // viewport dimensions
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const STACK_PITCH = 50;
  const CAROUSEL_PITCH = 60;

  // snap helper for both axes
  const snapToNearest = (from: number, setter: (v: number) => void) => {
    const total = CARDS_DATA.length;
    const nearest = Math.round(from);
    const start = from;
    const diff = nearest - start;
    const dur = 300;
    if (Math.abs(diff) < 0.01) {
      let p = nearest;
      if (p < 0) p += total;
      if (p >= total) p -= total;
      if (p !== nearest) setter(p);
      return;
    }
    const t0 = performance.now();
    const animate = (now: number) => {
      const dt = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - dt, 3);
      setter(start + diff * e);
      if (dt < 1) rafRef.current = requestAnimationFrame(animate);
      else {
        let p = start + diff;
        if (p < 0) p += total;
        if (p >= total) p -= total;
        setter(p);
      }
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
  };

  const drag = useRef({ active: false, startX: 0, startY: 0, baseScroll: 0, baseScrollX: 0, baseScrollF: 0 });
  const tap = useRef({ count: 0, timer: null as ReturnType<typeof setTimeout> | null });
  const pan = useRef({ active: false, lastX: 0 });

  // generic transition effect
  useEffect(() => {
    if (anim) {
      setAnimPhase(1);
      const id = requestAnimationFrame(() => {
        setAnimPhase(2);
      });
      setTimeout(() => { setAnim(false); setAnimPhase(0); }, 700);
      return () => cancelAnimationFrame(id);
    } else {
      setAnimPhase(0);
    }
  }, [anim]);

  const [scrollFeed, setScrollFeed] = useState(0);

  const toggleMode = () => {
    cancelAnimationFrame(rafRef.current);
    setAnim(true);
    setScatterScale(1);
    if (mode === "stack") {
      setScrollPosX(scrollPos);
      setMode("carousel");
    } else if (mode === "carousel") {
      setScrollPos(scrollPosX);
      setScrollFeed(Math.round(scrollPosX));
      setMode("feed");
    } else if (mode === "feed") {
      setAnim(false);
      setMode("stack");
      setScrollPos(Math.round(scrollFeed));
      setScrollFeed(0);
    } else {
      setAnim(false);
      setMode("stack");
      setScatterScale(1);
      setScrollPos(0);
    }
  };

  const handleClick = () => {
    const t = tap.current;
    t.count++;
    if (t.timer) clearTimeout(t.timer);
    t.timer = setTimeout(() => {
      if (t.count >= 2) toggleMode();
      t.count = 0;
    }, 280);
  };

  function getTouchDistance(touches: TouchList) {
    const [a, b] = [touches[0], touches[1]];
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      cancelAnimationFrame(rafRef.current);
      pinchStartDistanceRef.current = getTouchDistance(e.touches);
      pinchStartScaleRef.current = scatterScale;
      pinchTriggeredRef.current = false;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistanceRef.current) {
      const currentDist = getTouchDistance(e.touches);
      const diff = currentDist - pinchStartDistanceRef.current;
      if (mode === "carousel") {
        if (diff < -20 && !pinchTriggeredRef.current) {
          pinchTriggeredRef.current = true;
          setAnim(true);
          setMode("scatter");
          setPanX(0);
          setScatterScale(1);
        }
        return;
      }
      if (mode === "scatter") {
        const nextScale = Math.min(1.4, Math.max(0.7, pinchStartScaleRef.current + diff / 300));
        setScatterScale(nextScale);
        if (diff > 20 && !pinchTriggeredRef.current) {
          pinchTriggeredRef.current = true;
          cancelAnimationFrame(rafRef.current);
          setAnim(false);
          setMode("stack");
          setScatterScale(1);
          setScrollPos(0);
        }
      }
      return;
    }
    if (e.touches.length === 1) {
      if (pinchStartDistanceRef.current !== null) return;
      const touch = e.touches[0];
      if (mode === "scatter") {
        pan.current = { active: true, lastX: touch.clientX };
        return;
      }
      if (!drag.current.active) {
        drag.current = {
          active: true, startX: touch.clientX, startY: touch.clientY,
          baseScroll: scrollPos, baseScrollX: scrollPosX, baseScrollF: scrollFeed,
        };
      }
      if (mode === "stack") {
        const dy = touch.clientY - drag.current.startY;
        cancelAnimationFrame(rafRef.current);
        setScrollPos(drag.current.baseScroll - dy / STACK_PITCH);
      } else if (mode === "carousel") {
        const dx = touch.clientX - drag.current.startX;
        const dy = touch.clientY - drag.current.startY;
        // up/down maps to carousel left/right: up→prev(left), down→next(right)
        const axis = Math.abs(dx) > Math.abs(dy) ? dx : -dy;
        cancelAnimationFrame(rafRef.current);
        setScrollPosX(drag.current.baseScrollX - axis / 60);
      }
    }
  };

  const onTouchEnd = () => {
    if (pinchStartDistanceRef.current !== null) {
      pinchStartDistanceRef.current = null;
      pinchTriggeredRef.current = false;
      drag.current.active = false;
      pan.current.active = false;
      return;
    }
    if (mode === "scatter") { pan.current.active = false; return; }
    if (!drag.current.active) return;
    drag.current.active = false;
    if (mode === "stack") snapToNearest(scrollPos, setScrollPos);
    else if (mode === "carousel") snapToNearest(scrollPosX, setScrollPosX);
    else if (mode === "feed") snapToNearest(scrollFeed, setScrollFeed);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (mode === "scatter") { pan.current = { active: true, lastX: e.clientX }; return; }
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, baseScroll: scrollPos, baseScrollX: scrollPosX, baseScrollF: scrollFeed };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (mode === "scatter" && pan.current.active) {
      setPanX(p => p + (e.clientX - pan.current.lastX));
      pan.current.lastX = e.clientX;
      return;
    }
    if (!drag.current.active) return;
    if (mode === "stack") {
      const dy = e.clientY - drag.current.startY;
      cancelAnimationFrame(rafRef.current);
      setScrollPos(drag.current.baseScroll - dy / STACK_PITCH);
    } else if (mode === "carousel") {
      const dx = e.clientX - drag.current.startX;
      cancelAnimationFrame(rafRef.current);
      setScrollPosX(drag.current.baseScrollX - dx / CAROUSEL_PITCH);
    } else if (mode === "feed") {
      const dy = e.clientY - drag.current.startY;
      cancelAnimationFrame(rafRef.current);
      setScrollFeed(drag.current.baseScrollF - dy / 250);
    }
  };

  const onPointerUp = () => {
    if (mode === "scatter") { pan.current.active = false; return; }
    if (!drag.current.active) return;
    drag.current.active = false;
    if (mode === "stack") snapToNearest(scrollPos, setScrollPos);
    else if (mode === "carousel") snapToNearest(scrollPosX, setScrollPosX);
    else if (mode === "feed") snapToNearest(scrollFeed, setScrollFeed);
  };

  const getStyle = (i: number): React.CSSProperties => {
    const h = MOBILE_HEIGHTS[i];
    const baseX = (vp.w - CARD_W) / 2;
    const baseY = (vp.h - h) / 2 - 90;
    const card = CARDS_DATA[i];
    const total = CARDS_DATA.length;

    const base: React.CSSProperties = {
      position: "absolute",
      width: CARD_W,
      height: h,
      background: `url(/cards/card-${CARD_THEMES[i % CARD_THEMES.length]}.png) center/cover no-repeat`,
      borderRadius: 14,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
      fontFamily: "Inter,sans-serif",
    };

    // ── Feed mode (vertical scroll, card centered, infinite) ──
    if (mode === "feed") {
      const FEED_GAP = 16;
      const cardH = MOBILE_HEIGHTS[i] || 457;
      // Infinite scroll: find closest virtual copy
      const copies = [i, i + total, i - total];
      const closest = copies.reduce((a, b) => Math.abs(b - scrollFeed) < Math.abs(a - scrollFeed) ? b : a);
      const rel = closest - scrollFeed;
      const yPos = rel * (cardH + FEED_GAP);
      const startY = (vp.h - cardH) / 2 - 70;
      const dist = Math.abs(rel);
      const scale = dist < 0.5 ? 1 : Math.max(0.85, 1 - (dist - 0.5) * 0.08);
      const op = dist < 1 ? 1 : Math.max(0.3, 1 - (dist - 1) * 0.3);
      return {
        position: "absolute",
        width: CARD_W,
        height: cardH,
        background: `url(/cards/card-${CARD_THEMES[i % CARD_THEMES.length]}.png) center/cover no-repeat`,
        borderRadius: 14,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        fontFamily: "Inter,sans-serif",
        left: baseX,
        top: startY,
        transform: `translateY(${yPos}px) scale(${scale})`,
        transition: drag.current.active ? "none" : "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)",
        opacity: op,
        zIndex: dist < 0.5 ? 50 : Math.max(5, 50 - dist * 5),
        pointerEvents: (dist < 0.5 ? "auto" : "none") as React.CSSProperties["pointerEvents"],
      };
    }

    // ── Scatter mode ──
    if (mode === "scatter") {
      const p = SCATTER_POS[i % SCATTER_POS.length];
      const cardScale = p.s * scatterScale;
      const nearestCard = Math.round(scrollPos);
      const depthDist = Math.min(Math.abs(i - nearestCard), 6);
      const depthDelay = animPhase === 2 ? (depthDist * 50 + "ms") : "0ms";
      const isAnim = animPhase === 2;

      // carousel offset for phase 1 starting position
      const cxCopies = [i, i + total, i - total];
      const cxClosest = cxCopies.reduce((a, b) => Math.abs(b - scrollPosX) < Math.abs(a - scrollPosX) ? b : a);
      const cxRel = cxClosest - scrollPosX;
      const cxOff = cxRel * CAROUSEL_PITCH;
      const cxScale = 1 + (0.5 - Math.min(Math.abs(cxRel), 0.5)) * 0.05;

      return {
        ...base,
        left: p.x,
        top: p.y,
        transform: animPhase === 1
          ? "translateX(" + cxOff + "px) scale(" + cxScale + ")"
          : [
              "translateX(" + (panX + gyro.offsetX) + "px)",
              "translateY(" + gyro.offsetY + "px)",
              "scale(" + cardScale + ")",
              "rotate(" + p.r + "deg)",
            ].join(" "),
        transformOrigin: "center center",
        opacity: 1,
        zIndex: 10 + i,
        visibility: "visible",
        pointerEvents: "auto",
        transition: isAnim
          ? "transform 700ms cubic-bezier(.4,0,.2,1), left 700ms cubic-bezier(.4,0,.2,1), top 700ms cubic-bezier(.4,0,.2,1)"
          : "none",
        transitionDelay: depthDelay,
      };
    }

    // ── Carousel mode ──
    if (mode === "carousel") {
      const copies = [i, i + total, i - total];
      const closest = copies.reduce((a, b) => Math.abs(b - scrollPosX) < Math.abs(a - scrollPosX) ? b : a);
      const rel = closest - scrollPosX;
      const dist = Math.abs(rel);
      const xOff = rel * CAROUSEL_PITCH;
      const depthDelay = animPhase === 2 ? (dist * 40 + "ms") : "0ms";
      const isAnim = animPhase === 2;

      // stack offset used for phase 1 starting position
      const stackCopies = [i, i + total, i - total];
      const stackClosest = stackCopies.reduce((a, b) => Math.abs(b - scrollPos) < Math.abs(a - scrollPos) ? b : a);
      const stackRel = stackClosest - scrollPos;
      const stackYOff = stackRel * STACK_PITCH;

      if (dist < 0.5) {
        const s = 1 + (0.5 - dist) * 0.05;
        return {
          ...base, left: baseX, top: baseY,
          transform: animPhase === 1
            ? "translateY(" + stackYOff + "px)"
            : "translateX(" + xOff + "px) scale(" + s + ")",
          opacity: 1, zIndex: 50, visibility: "visible", pointerEvents: "auto",
          transition: isAnim ? "transform 700ms cubic-bezier(.4,0,.2,1)" : "none",
          transitionDelay: depthDelay,
        };
      }
      if (dist < 1) {
        const t = (dist - 0.5) * 2;
        const s = 1.025 - t * 0.15;
        return {
          ...base, left: baseX, top: baseY,
          transform: animPhase === 1
            ? "translateY(" + stackYOff + "px) scale(" + s + ")"
            : "translateX(" + xOff + "px) scale(" + s + ")",
          opacity: 1 - t * 0.2, zIndex: 46, visibility: "visible", pointerEvents: "none",
          transition: isAnim ? "transform 700ms cubic-bezier(.4,0,.2,1)" : "none",
          transitionDelay: depthDelay,
        };
      }
      if (dist < 1.5) {
        const t = (dist - 1) * 2;
        const s = 0.875 - t * 0.06;
        return {
          ...base, left: baseX, top: baseY,
          transform: animPhase === 1
            ? "translateY(" + stackYOff + "px) scale(" + s + ")"
            : "translateX(" + xOff + "px) scale(" + s + ")",
          opacity: 0.8 - t * 0.2, zIndex: 42, visibility: "visible", pointerEvents: "none",
          transition: isAnim ? "transform 700ms cubic-bezier(.4,0,.2,1)" : "none",
          transitionDelay: depthDelay,
        };
      }
      if (dist < 2.5) {
        const t = (dist - 1.5) / 1;
        const s = Math.max(0.815 - t * 0.06, 0.7);
        return {
          ...base, left: baseX, top: baseY,
          transform: animPhase === 1
            ? "translateY(" + stackYOff + "px) scale(" + s + ")"
            : "translateX(" + xOff + "px) scale(" + s + ")",
          opacity: Math.max(0.6 - t * 0.2, 0.1),
          filter: "blur(0.5px)", zIndex: 38, visibility: "visible", pointerEvents: "none",
          transition: isAnim ? "transform 700ms cubic-bezier(.4,0,.2,1)" : "none",
          transitionDelay: depthDelay,
        };
      }
      return { ...base, visibility: "hidden", opacity: 0, zIndex: 5, pointerEvents: "none" };
    }

    // ── Stack mode ──
    const copies = [i, i + total, i - total];
    const closest = copies.reduce((a, b) => Math.abs(b - scrollPos) < Math.abs(a - scrollPos) ? b : a);
    const rel = closest - scrollPos;
    const dist = Math.abs(rel);
    const yOff = rel * STACK_PITCH;

    // carousel offset for phase 1 (carousel→stack transition)
    const stCopies = [i, i + total, i - total];
    const stClosest = stCopies.reduce((a, b) => Math.abs(b - scrollPosX) < Math.abs(a - scrollPosX) ? b : a);
    const stRel = stClosest - scrollPosX;
    const stXOff = stRel * CAROUSEL_PITCH;

    const isAnim = animPhase === 2;
    const startPos = animPhase === 1 ? "translateX(" + stXOff + "px) " : "";
    const endPos = "translateY(" + yOff + "px) ";

    if (dist < 0.5) {
      const scale = 1 + (0.5 - dist) * 0.06;
      return {
        ...base, left: baseX, top: baseY,
        transform: animPhase === 1
          ? "translateX(" + stXOff + "px)"
          : [
              "perspective(900px)",
              "rotateX(" + gyro.rotateX + "deg)",
              "rotateY(" + gyro.rotateY + "deg)",
              "translateY(" + yOff + "px)",
              "scale(" + scale + ")",
            ].join(" "),
        opacity: 1, zIndex: 50, visibility: "visible", pointerEvents: "auto",
        transition: isAnim ? "transform 700ms cubic-bezier(.4,0,.2,1)" : "none",
      };
    }
    if (dist < 1) {
      const t = (dist - 0.5) * 2;
      const s = 1.03 - t * 0.1;
      return {
        ...base, left: baseX, top: baseY,
        transform: animPhase === 1
          ? "translateX(" + stXOff + "px) scale(" + s + ")"
          : "translateY(" + yOff + "px) scale(" + s + ")",
        opacity: 1 - t * 0.2,
        zIndex: 46, visibility: "visible", pointerEvents: "none",
        transition: isAnim ? "transform 700ms cubic-bezier(.4,0,.2,1)" : "none",
      };
    }
    if (dist < 1.5) {
      const t = (dist - 1) * 2;
      const s = 0.93 - t * 0.06;
      return {
        ...base, left: baseX, top: baseY,
        transform: animPhase === 1
          ? "translateX(" + stXOff + "px) scale(" + s + ")"
          : "translateY(" + yOff + "px) scale(" + s + ")",
        opacity: 0.8 - t * 0.2,
        zIndex: 42, visibility: "visible", pointerEvents: "none",
        transition: isAnim ? "transform 700ms cubic-bezier(.4,0,.2,1)" : "none",
      };
    }
    if (dist < 2) {
      const t = (dist - 1.5) * 2;
      const s = 0.87 - t * 0.05;
      return {
        ...base, left: baseX, top: baseY,
        transform: animPhase === 1
          ? "translateX(" + stXOff + "px) scale(" + s + ")"
          : "translateY(" + yOff + "px) scale(" + s + ")",
        opacity: 0.6 - t * 0.2,
        filter: "blur(0.5px)",
        zIndex: 38, visibility: "visible", pointerEvents: "none",
        transition: isAnim ? "transform 700ms cubic-bezier(.4,0,.2,1)" : "none",
      };
    }
    if (dist < 3) {
      const t = (dist - 2) / 1;
      const s = Math.max(0.82 - t * 0.08, 0.7);
      return {
        ...base, left: baseX, top: baseY,
        transform: animPhase === 1
          ? "translateX(" + stXOff + "px) scale(" + s + ")"
          : "translateY(" + yOff + "px) scale(" + s + ")",
        opacity: Math.max(0.4 - t * 0.15, 0.1),
        filter: "blur(1px)",
        zIndex: 34, visibility: "visible", pointerEvents: "none",
        transition: isAnim ? "transform 700ms cubic-bezier(.4,0,.2,1)" : "none",
      };
    }
    return { ...base, visibility: "hidden", opacity: 0, zIndex: 5, pointerEvents: "none" };
  };

  return (
    <div className="relative w-screen h-[100dvh] min-h-[100dvh] overflow-hidden bg-black select-none" style={{ fontFamily: "Inter,sans-serif" }}>
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-5 pt-4 z-[200] pointer-events-none">
        <span />
      </div>

      <div
        className="absolute inset-0 flex items-center justify-center pb-[60px]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleClick}
        style={{ touchAction: "none" }}
      >
        <div className="relative flex h-[520px] w-full items-center justify-center">
          {CARDS_DATA.map((card, i) => (
            <div
              key={i}
              style={getStyle(i)}
              onClick={mode === "scatter" || mode === "feed" ? (e) => { e.stopPropagation(); onCardSelect?.(i); onCardTheme?.(CARD_THEMES[i % CARD_THEMES.length]); } : undefined}
              onPointerDown={(e) => {
                const startX = e.clientX;
                const startY = e.clientY;
                const onMove = (ev: PointerEvent) => {
                  if (Math.abs(ev.clientX - startX) > 5 || Math.abs(ev.clientY - startY) > 5) {
                    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
                    window.removeEventListener("pointermove", onMove);
                    window.removeEventListener("pointerup", onUp);
                  }
                };
                const onUp = () => {
                  if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
                  window.removeEventListener("pointermove", onMove);
                  window.removeEventListener("pointerup", onUp);
                };
                window.addEventListener("pointermove", onMove);
                window.addEventListener("pointerup", onUp);
                longPressTimer.current = setTimeout(() => {
                  setOverlayCard(i);
                  setOverlayFlipped(false);
                  longPressTimer.current = null;
                  try { navigator.vibrate?.(15); } catch {}
                }, 300);
              }}
              onPointerUp={() => {
                if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
              }}
              onPointerLeave={() => {
                if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
              }}
            >
              <CardFace quote={card.quote} handle={card.handle} bg={card.bg}
                themeId={(card as any).themeId}
                dropId={(card as any).id}
                displayName={(card as any).displayName}
                profileUrl={(card as any).profileUrl}
                qrEnabled={(card as any).qrEnabled}
                userName={(card as any).userName}
                fontStyle={(card as any).fontStyle}
                type={(card as any).type}
                stickerLabel={(card as any).stickerLabel} />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={e => { e.stopPropagation(); hasDrops ? onMyDrop?.() : onAdd(); }}
        className="absolute z-[200] flex items-center justify-center gap-2 transition-transform active:scale-95 left-1/2 -translate-x-1/2"
        style={{
          bottom: 28,
          height: 52, paddingInline: 24,
          borderRadius: 26,
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          color: "#fff",
          fontSize: 14,
          fontWeight: 500,
          fontFamily: "Inter,sans-serif",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2), 0 0 0 0.5px rgba(255,255,255,0.08)",
          whiteSpace: "nowrap",
          border: "none",
        }}>
        {hasDrops ? <Layers size={16} color="#fff" /> : <Plus size={16} color="#fff" />}
        {hasDrops ? "My Drop" : "Create your drops"}
      </button>

      {/* ── Long Press Overlay ── */}
      {overlayCard !== null && CARDS_DATA[overlayCard] && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: overlayClosing ? 0 : 1 }}
          transition={{ duration: 0.35 }}
          onAnimationComplete={() => { if (overlayClosing) { setOverlayCard(null); setOverlayFlipped(false); setOverlayClosing(false); } }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(24px)" }}
          onClick={() => setOverlayClosing(true)}
        >
          <motion.div
            initial={{ scale: 0.3, rotateY: 720, opacity: 0, x: -200, filter: "blur(8px)" }}
            animate={overlayClosing ? { opacity: 0, scale: 0.8, transition: { duration: 0.2 } } : { scale: 1, rotateY: 0, opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
            style={{ width: 280, height: 400, perspective: "1000px", transformOrigin: "center center" }}
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              className="relative size-full"
              style={{ transformStyle: "preserve-3d" }}
              animate={{ rotateY: overlayFlipped ? 180 : 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Front face */}
              <div
                className="absolute inset-0 overflow-hidden rounded-[18px] flex flex-col justify-between cursor-pointer"
                style={{
                  backfaceVisibility: "hidden",
                  background: `url(/cards/card-${CARD_THEMES[overlayCard % CARD_THEMES.length]}.png) center/cover no-repeat`,
                  boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
                }}
                onClick={() => setOverlayFlipped(p => !p)}
                onPointerDown={() => {
                  let startX = 0;
                  const handleDown = (e: PointerEvent) => { startX = e.clientX; };
                  const handleMove = (e: PointerEvent) => {
                    const diff = e.clientX - startX;
                    if (diff > 15) setOverlayFlipped(true);
                    else if (diff < -15) setOverlayFlipped(false);
                  };
                  const handleUp = () => {
                    window.removeEventListener("pointerdown", handleDown);
                    window.removeEventListener("pointermove", handleMove);
                    window.removeEventListener("pointerup", handleUp);
                  };
                  window.addEventListener("pointerdown", handleDown);
                  window.addEventListener("pointermove", handleMove);
                  window.addEventListener("pointerup", handleUp);
                }}
              >
                <div className="flex-1 flex items-center p-4">
                  <p className="font-bold text-xl leading-tight break-words text-white"
                    style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                    {CARDS_DATA[overlayCard].quote}
                  </p>
                </div>
                <div className="px-3 pb-3 flex justify-between items-end">
                  <span className="text-xs font-medium text-white/80">{CARDS_DATA[overlayCard].handle}</span>
                </div>
              </div>

              {/* Back face */}
              <div
                className="absolute inset-0 overflow-hidden rounded-[18px] flex flex-col items-center justify-center gap-3 cursor-pointer"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)",
                  boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
                }}
                onClick={() => setOverlayFlipped(p => !p)}
              >
                <div className="text-5xl text-white/30">✦</div>
                <p className="text-white/60 text-xs text-center px-6">
                  {CARDS_DATA[overlayCard].quote}
                </p>
                <p className="text-white/30 text-[10px]">{CARDS_DATA[overlayCard].handle}</p>
              </div>
            </motion.div>

            {/* Flip hint */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/30 text-[10px] whitespace-nowrap">
              hold & drag left/right to flip ↻
            </div>
          </motion.div>

          {/* Close button */}
          <button
            onClick={() => setOverlayClosing(true)}
            className="absolute top-6 right-6 flex items-center justify-center rounded-full transition-opacity hover:opacity-75"
            style={{
              width: 44, height: 44,
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            }}
          >
            <X size={18} color="#fff" />
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ── Desktop Card Gallery Modal ────────────────────────────────────────────────

function CardGalleryModal({
  card,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  card: any;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [toast, setToast] = useState("");
  const isLight = card?.bg === "#FFCD29" || card?.bg === "#F5F0E8";

  const handleShare = () => {
    if (card?.id) shareDropLink(card.id);
    else shareWallLink();
    setToast("Link copied ✦");
    setTimeout(() => setToast(""), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)" }}
      onClick={onClose}
    >
      <div className="relative flex items-center gap-4" onClick={e => e.stopPropagation()}>
        {/* Prev */}
        <button onClick={onPrev}
          className="flex items-center justify-center rounded-full transition-all hover:scale-105"
          style={{ width: 44, height: 44, background: "rgba(255,255,255,0.08)" }}>
          <svg width={14} height={14} viewBox="0 0 12 12"><path d="M7 2L3 6l4 4" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none"/></svg>
        </button>

        {/* Flip card — 2x size */}
        <div style={{ perspective: "1000px" }}>
          <motion.div
            className="relative cursor-pointer"
            style={{
              width: 560, height: 800,
              transformStyle: "preserve-3d",
            }}
            initial={{ scale: 0.3, rotateY: 720, opacity: 0, x: -200, filter: "blur(10px)" }}
            animate={{ scale: 1, rotateY: flipped ? 180 : 0, opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setFlipped(p => !p)}
          >
            {/* Front */}
            <div
              className="absolute inset-0 overflow-hidden rounded-[18px] flex flex-col justify-between"
              style={{
                backfaceVisibility: "hidden",
                background: card?._themeId && CARD_THEMES.includes(card._themeId)
                  ? `url(/cards/card-${card._themeId}.png) center/cover no-repeat`
                  : card?.bg || "#7B61FF",
                boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
              }}
            >
              <div className="flex-1 flex items-center p-8">
                <p className="font-bold text-3xl leading-tight break-words"
                  style={{ color: isLight ? "#111" : "#fff", fontFamily: card?.fontStyle || undefined }}>
                  {card?.quote || ""}
                </p>
              </div>
              <div className="px-6 pb-6 flex justify-between items-end">
                <span className="text-sm font-medium" style={{ color: isLight ? "rgba(17,17,17,0.6)" : "rgba(255,255,255,0.7)" }}>
                  {card?.userName || card?.handle || ""}
                </span>
                {card?.userRole && (
                  <span className="text-xs" style={{ color: isLight ? "rgba(17,17,17,0.4)" : "rgba(255,255,255,0.4)" }}>
                    {card.userRole}
                  </span>
                )}
              </div>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 overflow-hidden rounded-[18px] flex flex-col items-center justify-center gap-4"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)",
                boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
              }}
            >
              <div className="text-6xl text-white/20">✦</div>
              <p className="text-white/50 text-base text-center px-10">{card?.quote || ""}</p>
              <p className="text-white/30 text-sm">{card?.handle || ""}</p>
            </div>
          </motion.div>
        </div>

        {/* Next */}
        <button onClick={onNext}
          className="flex items-center justify-center rounded-full transition-all hover:scale-105"
          style={{ width: 44, height: 44, background: "rgba(255,255,255,0.08)" }}>
          <svg width={14} height={14} viewBox="0 0 12 12"><path d="M5 2l4 4-4 4" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none"/></svg>
        </button>
      </div>

      {/* Share — top right */}
      <button onClick={handleShare}
        className="absolute top-5 right-16 flex items-center justify-center rounded-full"
        style={{ width: 40, height: 40, background: "rgba(255,255,255,0.08)" }}>
        <svg width={14} height={14} viewBox="0 0 14 14"><path d="M10 4L4 7l6 3V4z" fill="rgba(255,255,255,0.6)"/><circle cx="11.5" cy="2.5" r="2" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" fill="none"/><circle cx="11.5" cy="11.5" r="2" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" fill="none"/><circle cx="4" cy="7" r="2" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" fill="none"/></svg>
      </button>

      {/* Close button */}
      <button onClick={onClose}
        className="absolute top-5 right-5 flex items-center justify-center rounded-full"
        style={{ width: 40, height: 40, background: "rgba(255,255,255,0.08)" }}>
        <svg width={14} height={14} viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/></svg>
      </button>

      {/* Toast */}
      {toast && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs shadow z-[1000]"
          style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(16px)", color: "#fff" }}>
          {toast}
        </motion.div>
      )}
    </motion.div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [showModal, setShowModal] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [selectedCardThemeId, setSelectedCardThemeId] = useState<string | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Preload card theme images
  useEffect(() => {
    if (imagesLoaded) return;
    let loaded = 0;
    const total = CARD_THEMES.length;
    CARD_THEMES.forEach(t => {
      const img = new Image();
      img.onload = img.onerror = () => { loaded++; if (loaded >= total) setImagesLoaded(true); };
      img.src = `/cards/card-${t}.png`;
    });
  }, [imagesLoaded]);

  // onboarding gate
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem(ONBOARDING_KEY) === "true");
  const [animated, setAnimated] = useState(() => localStorage.getItem("drops_animated") === "true");

  // new screens
  const [showMyDropHub, setShowMyDropHub] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showOnboardingMenu, setShowOnboardingMenu] = useState(false);
  const [qrPreviewCard, setQrPreviewCard] = useState<UserCard | null>(null);

  // card state
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [remoteCards, setRemoteCards] = useState<UserCard[]>([]);
  const [newCardId, setNewCardId] = useState<string | null>(null);
  const [deviceId] = useState(() => getDeviceId());

  // seed sample data on ?seed
  useEffect(() => {
    if (window.location.search.includes("seed")) {
      const samples: UserCard[] = [
        { id: 'samp-001', bg: '#7B61FF', quote: 'Config 2025 was unreal!', handle: '@designer', type: 'text', accentColor: '#7B61FF', cardSkin: 'heatmap', fontStyle: 'Inter, system-ui, sans-serif', userName: 'Alex', userRole: 'Designer', themeId: 'heatmap', displayName: 'Alex Rivera', profileUrl: 'https://twitter.com/alexdesigns', qrEnabled: true },
        { id: 'samp-002', bg: '#F24822', quote: 'Best community ever', handle: '@jun', type: 'sticker', stickerLabel: '✦', accentColor: '#F24822', cardSkin: 'holographic', userName: 'Jun', userRole: 'Developer', themeId: 'holographic', displayName: 'Jun Kim', profileUrl: 'https://github.com/junkim', qrEnabled: true },
        { id: 'samp-003', bg: '#1ABCFE', quote: 'Pixel perfect ✦', handle: '@maya', type: 'text', accentColor: '#1ABCFE', cardSkin: 'frosted_glow', fontStyle: 'Georgia, serif', userName: 'Maya', userRole: 'PM', themeId: 'frosted_glow', displayName: 'Maya Chen', profileUrl: 'https://linkedin.com/in/mayachen', qrEnabled: true },
      ];
      const existing = JSON.parse(localStorage.getItem(CARDS_KEY) || '[]');
      localStorage.setItem(CARDS_KEY, JSON.stringify([...existing, ...samples]));
      // seed friends
      const FRIENDS_KEY = 'drops_friends';
      const friendSamples = [
        { id: 'fr-s01', device_id: 'seed', friend_drop_id: 'ext-001', friend_name: 'Sarah M.', friend_handle: '@sarah_m', friend_profile_url: 'https://twitter.com/sarahm', friend_avatar_url: '', created_at: new Date().toISOString() },
        { id: 'fr-s02', device_id: 'seed', friend_drop_id: 'ext-002', friend_name: 'Carlos UX', friend_handle: '@carlos_ux', friend_profile_url: 'https://dribbble.com/carlos', friend_avatar_url: '', created_at: new Date().toISOString() },
      ];
      const ef = JSON.parse(localStorage.getItem(FRIENDS_KEY) || '[]');
      localStorage.setItem(FRIENDS_KEY, JSON.stringify([...ef, ...friendSamples]));
      window.history.replaceState(null, '', '/');
      window.location.reload();
    }
  }, []);

  // load drops on mount
  useEffect(() => {
    const stored = localStorage.getItem(CARDS_KEY);
    if (stored) {
      try { setUserCards(JSON.parse(stored)); } catch {}
    }
    getDrops().then(cards => {
      if (cards.length > 0) setRemoteCards(cards);
    });
  }, []);

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
        setSelectedCardIndex(i => i !== null ? (i + 1) % combinedCards.length : null);
      }
      if (e.key === "ArrowLeft") {
        setSelectedCardIndex(i => i !== null ? (i - 1 + combinedCards.length) % combinedCards.length : null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCardIndex, remoteCards.length, userCards.length]);

  const combinedCards = [...CARDS_DATA, ...remoteCards, ...userCards].map((u, idx) => ({
    bg: u.bg,
    quote: u.type === "sticker" ? u.stickerLabel || u.quote : u.quote,
    handle: u.handle,
    id: (u as any).id || `seed-${idx}`,
    userName: (u as any).userName,
    userRole: (u as any).userRole,
    themeId: (u as any).themeId || CARD_THEMES[idx % CARD_THEMES.length],
    fontStyle: (u as any).fontStyle,
  }));

  const handlePost = async (card: UserCard) => {
    // try Supabase first, fall back to localStorage
    const input = {
      type: card.type,
      text_content: card.quote,
      caption: card.handle,
      accent_color: card.accentColor,
      mood_badge: card.moodBadge,
      card_skin: card.cardSkin,
      card_size: card.cardSize,
      font_style: card.fontStyle,
      text_align: card.textAlign,
      sticker_label: card.stickerLabel,
      user_name: card.userName,
      user_role: card.userRole,
      theme_id: card.themeId,
    };
    const result = await createDrop(input);
    if (result) {
      setUserCards(prev => {
        const updated = [...prev, result];
        localStorage.setItem(CARDS_KEY, JSON.stringify(updated));
        return updated;
      });
      setNewCardId(result.id);
      setTimeout(() => setNewCardId(null), 3000);
    }
  };

  // bypass — reset state for testing
  const isBypass = typeof window !== "undefined" && (window.location.pathname === "/bypass" || window.location.search.includes("bypass"));
  if (isBypass) {
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.removeItem(CARDS_KEY);
    window.history.replaceState(null, "", "/");
    window.location.reload();
  }

  // onboarding gate — must check before admin
  const isAdmin = typeof window !== "undefined" && (window.location.pathname === "/admin" || window.location.hash === "#admin");
  if (isAdmin) {
    return <AdminPanel onClose={() => { window.history.replaceState(null, "", "/"); }} />;
  }
  if (!onboarded) {
    return <Onboarding onComplete={() => setOnboarded(true)} />;
  }

  if (!imagesLoaded) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black" style={{ fontFamily: "Inter,sans-serif" }}>
        <div className="text-center">
          <div className="text-4xl text-white/20 mb-4">✦</div>
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/60 animate-spin mx-auto" />
          <p className="text-white/30 text-xs mt-4">Loading drops…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full" style={{ fontFamily: "Inter, sans-serif", background: "#000000" }}>
      {isMobile
        ? <MobileView key={userCards.length} onAdd={() => setShowModal(true)} onCardSelect={(i) => setSelectedCardIndex(i)} onCardTheme={(t) => setSelectedCardThemeId(t)} hasDrops={userCards.length > 0} onMyDrop={() => setShowMyDropHub(true)} />
        : <DesktopView key={userCards.length} onAdd={() => setShowModal(true)} onCardSelect={(i) => setSelectedCardIndex(i)} onCardTheme={(t) => setSelectedCardThemeId(t)} hasDrops={userCards.length > 0} onMyDrop={() => setShowMyDropHub(true)} onScan={() => setShowQrScanner(true)} />
      }

      {/* Mobile menu bar */}
      {isMobile && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] flex gap-2">
          {[
            { icon: <Layers size={14} />, label: "My Drop", onClick: () => setShowMyDropHub(true) },
            { icon: <QrCode size={14} />, label: "Scan", onClick: () => setShowQrScanner(true) },
            { icon: <Users size={14} />, label: "Connect", onClick: () => setShowMyDropHub(true) },
            { icon: <HelpCircle size={14} />, label: "Help", onClick: () => setShowOnboardingMenu(true) },
          ].map((btn, i) => (
            <button key={i} onClick={btn.onClick}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-medium transition-all hover:scale-105"
              style={{
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
                color: "rgba(255,255,255,0.7)",
                border: "none",
              }}>
              {btn.icon} {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* QR on hash — auto-open when ?drop=XXX */}
      {isMobile && (() => {
        const params = new URLSearchParams(window.location.search);
        const dropId = params.get("drop");
        if (dropId) {
          getDropById(dropId).then(card => {
            if (card) setTimeout(() => setQrPreviewCard(card), 500);
          });
        }
        return null;
      })()}

      <AnimatePresence>
        {showModal && (
          <AddCardModal onClose={() => setShowModal(false)} onPost={handlePost} cardCount={userCards.length} />
        )}
      </AnimatePresence>

      {selectedCardIndex !== null && combinedCards[selectedCardIndex] && (
        <CardGalleryModal
          card={{ ...combinedCards[selectedCardIndex], _themeId: selectedCardThemeId }}
          index={selectedCardIndex}
          total={combinedCards.length}
          onClose={() => { setSelectedCardIndex(null); setSelectedCardThemeId(null); }}
          onPrev={() => setSelectedCardIndex(i => i !== null ? (i - 1 + combinedCards.length) % combinedCards.length : null)}
          onNext={() => setSelectedCardIndex(i => i !== null ? (i + 1) % combinedCards.length : null)}
        />
      )}

      {/* New screens */}
      {showMyDropHub && <MyDropHub onClose={() => setShowMyDropHub(false)} onAddCard={() => { setShowMyDropHub(false); setShowModal(true); }} />}
      {showQrScanner && <QrScanner onClose={() => setShowQrScanner(false)} />}

      {/* QR Preview overlay (standalone card flip) */}
      {qrPreviewCard && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(24px)" }}
          onClick={() => setQrPreviewCard(null)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative"
            style={{ width: 240, height: 340 }}
            onClick={e => e.stopPropagation()}
          >
            <CardFace
              quote={qrPreviewCard.quote}
              handle={qrPreviewCard.handle}
              bg={qrPreviewCard.bg}
              themeId={qrPreviewCard.themeId}
              dropId={qrPreviewCard.id}
              displayName={qrPreviewCard.displayName}
              profileUrl={qrPreviewCard.profileUrl}
              qrEnabled={qrPreviewCard.qrEnabled ?? true}
              userName={qrPreviewCard.userName}
              fontStyle={qrPreviewCard.fontStyle}
              type={qrPreviewCard.type}
            />
          </motion.div>
          <button onClick={() => setQrPreviewCard(null)}
            className="absolute top-6 right-6 flex items-center justify-center rounded-full"
            style={{ width: 40, height: 40, background: "rgba(255,255,255,0.1)" }}>
            <X size={16} color="#fff" />
          </button>
        </motion.div>
      )}

      {/* Onboarding help menu — reuse Onboarding component with reopen mode */}
      {showOnboardingMenu && (
        <Onboarding onComplete={() => setShowOnboardingMenu(false)} reopen />
      )}

      <Toast />
    </div>
  );
}
