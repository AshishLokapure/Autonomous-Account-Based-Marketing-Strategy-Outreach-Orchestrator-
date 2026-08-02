"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket } from "lucide-react";

export function RunCampaignButton() {
  const [hovered, setHovered] = useState(false);

  const label = hovered ? "Start AI Marketing Campaign" : "Run Campaign";

  return (
    <motion.button
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      aria-label={label}
      whileHover={{ scale: 1.05, boxShadow: "0 18px 50px rgba(37,99,235,0.6)" }}
      whileTap={{ scale: 0.97 }}
      style={{
        position: "fixed",
        right: 28,
        bottom: 28,
        height: 64,
        width: 220,
        border: 0,
        borderRadius: 18,
        background: "linear-gradient(135deg, #2563eb, #4f46e5)",
        boxShadow: "0 14px 40px rgba(37,99,235,0.45)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        cursor: "pointer",
        zIndex: 50,
        overflow: "hidden",
        fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif",
      }}
    >
      {/* Pulse ring */}
      <motion.span
        style={{
          position: "absolute", inset: 0, borderRadius: 18,
          border: "2px solid rgba(255,255,255,0.35)",
          pointerEvents: "none",
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
      />

      <Rocket size={20} />

      <AnimatePresence mode="wait">
        <motion.span
          key={label}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          style={{ fontSize: 14, fontWeight: 800, letterSpacing: -0.3 }}
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
