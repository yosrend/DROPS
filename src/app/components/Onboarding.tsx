import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, SkipForward, Sparkles, MousePointer2, Sticker } from "lucide-react";
import { ONBOARDING_KEY } from "../data/defaults";

const SCREENS = [
  {
    icon: <Sparkles size={40} color="#7B61FF" />,
    title: "DROPS ✦",
    subtitle: "Interactive card wall",
    desc: "Leave your mark at Config 2025. Drop a card into a playful spatial canvas.",
  },
  {
    icon: <MousePointer2 size={40} color="#7B61FF" />,
    title: "Explore the wall",
    subtitle: "Scroll, drag, pinch",
    desc: "Scroll to browse cards. Hold and drag to pan. Pinch to switch between views. Tap cards to see details.",
  },
  {
    icon: <Sticker size={40} color="#7B61FF" />,
    title: "Drop your card",
    subtitle: "Up to 2 cards",
    desc: "Use text, photo, GIF, or sticker. Add your mark and be part of the wall.",
  },
];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    onComplete();
  };

  const screen = SCREENS[step];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white select-none"
      style={{ fontFamily: "Inter, sans-serif" }}>
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
            <div className="mb-6 w-20 h-20 rounded-2xl bg-purple-50 flex items-center justify-center">
              {screen.icon}
            </div>
            <h1 className="text-3xl font-bold text-[#111] mb-2">{screen.title}</h1>
            <p className="text-sm font-medium text-[#7B61FF] mb-4 uppercase tracking-[.08em]">{screen.subtitle}</p>
            <p className="text-sm text-[rgba(17,17,17,0.5)] leading-relaxed max-w-[300px]">{screen.desc}</p>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
          {SCREENS.map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                background: i === step ? "#7B61FF" : "rgba(17,17,17,0.12)",
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
                className="flex items-center gap-1 text-xs text-[rgba(17,17,17,0.35)] hover:text-[rgba(17,17,17,0.6)] transition-colors py-2"
              >
                <SkipForward size={14} /> Skip
              </button>
              <button
                onClick={() => {
                  if (step === SCREENS.length - 1) handleComplete();
                  else setStep(s => s + 1);
                }}
                className="h-12 px-6 rounded-2xl text-sm font-semibold flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                style={{ background: "#7B61FF", color: "#fff" }}
              >
                Next <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1 text-xs text-[rgba(17,17,17,0.35)] hover:text-[rgba(17,17,17,0.6)] transition-colors py-2"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="h-12 px-7 rounded-2xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                style={{ background: "#7B61FF", color: "#fff" }}
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
