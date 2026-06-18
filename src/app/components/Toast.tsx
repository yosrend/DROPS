import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface ToastData {
  id: number;
  message: string;
}

let toastId = 0;
let addToastFn: ((msg: string) => void) | null = null;

export function showToast(message: string) {
  addToastFn?.(message);
}

export default function Toast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    addToastFn = (msg: string) => {
      const id = ++toastId;
      setToasts(prev => [...prev, { id, message: msg }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500);
    };
    return () => { addToastFn = null; };
  }, []);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="px-5 py-3 rounded-2xl text-sm font-medium whitespace-nowrap"
            style={{
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              color: "#fff",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(255,255,255,0.08)",
            }}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
