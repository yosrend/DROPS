import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, SkipForward, X } from "lucide-react";
import { ONBOARDING_KEY } from "../data/defaults";

const SCREENS = [
  {
    icon: "✦",
    title: "DROPS",
    subtitle: "Interactive card wall",
    desc: "Drop a card into a playful spatial canvas. Leave your mark and be part of the wall.",
  },
  {
    icon: "✎",
    title: "Create & Customize",
    subtitle: "Your style",
    desc: "Design your drop — pick a theme, font, color, and sticker. Make it yours.",
  },
  {
    icon: "👆",
    title: "Explore with gestures",
    subtitle: "Stack · Carousel · Feed",
    desc: "Double tap to switch views. Scroll, drag, and pan to explore every card.",
  },
  {
    icon: "↻",
    title: "Flip to QR",
    subtitle: "Connect instantly",
    desc: "Tap any card to see its QR code. Scan to connect with the creator.",
  },
  {
    icon: "📷",
    title: "Scan & Connect",
    subtitle: "Build your network",
    desc: "Scan someone's QR to add them as a friend. Your connections, your wall.",
  },
  {
    icon: "↗",
    title: "Share",
    subtitle: "Spread the word",
    desc: "Share your wall or individual drops. Let others discover your mark.",
  },
];

interface OnboardingProps {
  onComplete: () => void;
  reopen?: boolean;
}

export default function Onboarding({ onComplete, reopen }: OnboardingProps) {
  const [step, setStep] = useState(0);

  const handleComplete = () => {
    if (!reopen) localStorage.setItem(ONBOARDING_KEY, "true");
    onComplete();
  };

  const screen = SCREENS[step];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center select-none"
      style={{ fontFamily: "Inter, sans-serif", background: "rgba(0,0,0,0.92)", backdropFilter: "blur(20px)" }}>
      <div className="relative w-full max-w-[400px] mx-auto px-6" style={{ height: "min(480px, 80vh)" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col items-center justify-center text-center h-full"
          >
            <div className="mb-6 w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              {screen.icon}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{screen.title}</h1>
            <p className="text-sm font-medium text-white/50 mb-4 uppercase tracking-[.08em]">{screen.subtitle}</p>
            <p className="text-sm text-white/40 leading-relaxed max-w-[300px]">{screen.desc}</p>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
          {SCREENS.map((_, i) => (
            <div
              key={i}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                background: i === step ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.15)",
                width: i === step ? 20 : 8,
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-1">
          {step < SCREENS.length - 1 ? (
            <>
              <button
                onClick={handleComplete}
                className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors py-2"
              >
                <SkipForward size={14} /> Skip
              </button>
              <button
                onClick={() => setStep(s => s + 1)}
                className="h-12 px-6 rounded-2xl text-sm font-medium flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(16px)", color: "#fff" }}
              >
                Next <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors py-2"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="h-12 px-7 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
                style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(16px)", color: "#fff" }}
              >
                {reopen ? "Close" : "Get Started"}
              </button>
            </>
          )}
        </div>

        {/* Close for reopen mode */}
        {reopen && (
          <button onClick={handleComplete}
            className="absolute top-0 right-0 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <X size={14} color="rgba(255,255,255,0.6)" />
          </button>
        )}
      </div>
    </div>
  );
}
