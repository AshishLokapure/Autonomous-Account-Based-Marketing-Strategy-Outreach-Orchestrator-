"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, CheckCircle2, Loader2 } from "lucide-react";
import { CampaignModal } from "./campaign-modal";

type BtnState = "idle" | "running" | "done";

export function RunCampaignButton() {
  const [state, setState] = useState<BtnState>("idle");
  const [modalOpen, setModalOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  function handleClick() {
    if (state !== "idle") return;
    setState("running");
    setModalOpen(true);
  }

  function handleModalClose() {
    setModalOpen(false);
    setState("done");
    // Reset back to idle after 4s so user can re-run
    setTimeout(() => setState("idle"), 4000);
  }

  const label = state === "idle"
    ? (hovered ? "Start AI Marketing Campaign" : "Run Campaign")
    : state === "running" ? "Running Campaign..." : "Campaign Completed";

  return (
    <>
      <motion.button
        onClick={handleClick}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        disabled={state === "running"}
        aria-label={label}
        animate={state === "idle" ? "idle" : state === "running" ? "running" : "done"}
        variants={{
          idle: {
            scale: 1,
            boxShadow: "0 14px 40px rgba(37,99,235,0.45)",
          },
          running: {
            scale: 1,
            boxShadow: "0 14px 40px rgba(37,99,235,0.3)",
          },
          done: {
            scale: 1,
            boxShadow: "0 14px 40px rgba(22,163,74,0.45)",
          },
        }}
        whileHover={state === "idle" ? { scale: 1.05, boxShadow: "0 18px 50px rgba(37,99,235,0.6)" } : {}}
        whileTap={state === "idle" ? { scale: 0.97 } : {}}
        style={{
          position: "fixed",
          right: 28,
          bottom: 28,
          height: 64,
          width: 220,
          border: 0,
          borderRadius: 18,
          background: state === "done"
            ? "linear-gradient(135deg, #16a34a, #15803d)"
            : "linear-gradient(135deg, #2563eb, #4f46e5)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          cursor: state === "running" ? "not-allowed" : "pointer",
          zIndex: 50,
          overflow: "hidden",
          fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif",
        }}
      >
        {/* Pulse ring — only in idle */}
        {state === "idle" && (
          <motion.span
            style={{
              position: "absolute", inset: 0, borderRadius: 18,
              border: "2px solid rgba(255,255,255,0.35)",
              pointerEvents: "none",
            }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          />
        )}

        {/* Icon */}
        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.span key="rocket" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <Rocket size={20} />
            </motion.span>
          )}
          {state === "running" && (
            <motion.span key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }} style={{ display: "flex" }}>
                <Loader2 size={20} />
              </motion.span>
            </motion.span>
          )}
          {state === "done" && (
            <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
              <CheckCircle2 size={20} />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Label */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <AnimatePresence mode="wait">
            <motion.span
              key={label}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              style={{ fontSize: 14, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1 }}
            >
              {label}
            </motion.span>
          </AnimatePresence>
        </div>
      </motion.button>

      <AnimatePresence>
        {modalOpen && <CampaignModal onClose={handleModalClose} />}
      </AnimatePresence>
    </>
  );
}
