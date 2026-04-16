"use client";

import { motion } from "framer-motion";

type AssistantMascotProps = {
  compact?: boolean;
  onClick?: () => void;
  thinking?: boolean;
};

export function AssistantMascot({
  compact = false,
  onClick,
  thinking = false
}: AssistantMascotProps) {
  const Wrapper = onClick ? motion.button : motion.div;
  const sizeClass = compact ? "h-14 w-14" : "h-28 w-28 drop-shadow-[0_24px_44px_rgba(0,0,0,0.48)]";

  return (
    <Wrapper
      animate={
        compact
          ? undefined
          : {
              y: [0, -3, 0],
              rotate: [0, -1.6, 0, 1.2, 0]
            }
      }
      aria-label={onClick ? "Abrir chat da IA 10PILA" : undefined}
      className={
        onClick
          ? "group relative block h-24 w-24 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-2)]"
          : "relative block"
      }
      onClick={onClick}
      transition={
        compact
          ? undefined
          : {
              duration: 4.8,
              repeat: Infinity,
              repeatDelay: 3.2,
              ease: "easeInOut"
            }
      }
      type={onClick ? "button" : undefined}
      whileTap={onClick ? { scale: 0.97 } : undefined}
    >
      <svg
        aria-hidden="true"
        className={sizeClass}
        viewBox="0 0 180 180"
      >
        <defs>
          <linearGradient id="bot-shell" x1="34" x2="138" y1="24" y2="134">
            <stop offset="0" stopColor="#242b33" />
            <stop offset="0.56" stopColor="#13171d" />
            <stop offset="1" stopColor="#0a0d12" />
          </linearGradient>
          <linearGradient id="bot-screen" x1="56" x2="124" y1="42" y2="96">
            <stop offset="0" stopColor="#04141a" />
            <stop offset="0.5" stopColor="#071019" />
            <stop offset="1" stopColor="#081118" />
          </linearGradient>
          <linearGradient id="bot-glow" x1="0" x2="1">
            <stop offset="0" stopColor="#3df5a5" />
            <stop offset="1" stopColor="#55c8ff" />
          </linearGradient>
          <linearGradient id="bot-panel" x1="68" x2="111" y1="108" y2="122">
            <stop offset="0" stopColor="#143033" />
            <stop offset="1" stopColor="#0d1618" />
          </linearGradient>
          <filter id="bot-neon">
            <feGaussianBlur result="blur" stdDeviation="2.4" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="bot-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="12" floodColor="#000" floodOpacity="0.42" stdDeviation="12" />
          </filter>
        </defs>

        <motion.g
          animate={compact ? undefined : { y: [0, -1.5, 0], rotate: [0, -2.4, 0, 1.6, 0] }}
          filter="url(#bot-shadow)"
          style={{ originX: "50%", originY: "56%" }}
          transition={{ duration: 4.6, repeat: Infinity, repeatDelay: 3.6, ease: "easeInOut" }}
        >
          <motion.path
            animate={
              thinking
                ? { opacity: [0.45, 0.95, 0.45] }
                : compact
                  ? undefined
                  : { opacity: [0.38, 0.68, 0.38] }
            }
            d="M79 143c0 9 5 13 11 13s11-4 11-13"
            fill="none"
            filter="url(#bot-neon)"
            stroke="url(#bot-glow)"
            strokeLinecap="round"
            strokeWidth="6"
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />

          <rect
            fill="url(#bot-shell)"
            height="34"
            rx="15"
            stroke="#313946"
            strokeWidth="2"
            width="56"
            x="62"
            y="102"
          />
          <rect
            fill="url(#bot-panel)"
            height="12"
            rx="5"
            stroke="rgba(85,200,255,0.42)"
            strokeWidth="1.5"
            width="20"
            x="80"
            y="113"
          />

          <path
            d="M70 118c-7 3-13 8-17 16"
            stroke="#46505d"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <path
            d="M110 118c7 3 13 8 17 16"
            stroke="#46505d"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <circle cx="49" cy="137" fill="#1d242d" r="6.5" stroke="#46505d" strokeWidth="2" />
          <circle cx="131" cy="137" fill="#1d242d" r="6.5" stroke="#46505d" strokeWidth="2" />

          <rect
            fill="url(#bot-shell)"
            height="94"
            rx="34"
            stroke="#39424d"
            strokeWidth="2.5"
            width="104"
            x="38"
            y="24"
          />
          <rect
            fill="url(#bot-screen)"
            height="52"
            rx="20"
            stroke="rgba(85,200,255,0.18)"
            strokeWidth="2"
            width="72"
            x="54"
            y="45"
          />

          <path d="M90 16v12" stroke="#4a5563" strokeLinecap="round" strokeWidth="3" />
          <motion.circle
            animate={thinking ? { opacity: [0.35, 1, 0.35] } : { opacity: [0.45, 0.9, 0.45] }}
            cx="90"
            cy="12"
            fill="#3df5a5"
            filter="url(#bot-neon)"
            r="4.5"
            transition={{ duration: thinking ? 0.75 : 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <path d="M54 39c10-8 21-12 36-12 15 0 27 4 36 12" opacity="0.1" stroke="#fff" strokeWidth="2" />

          <motion.g
            animate={
              thinking
                ? { x: [0, 1.5, -1.5, 0], y: [0, -0.4, 0.4, 0] }
                : { scaleY: [1, 1, 0.14, 1, 1] }
            }
            style={{ originX: "40%", originY: "50%" }}
            transition={{
              duration: thinking ? 0.9 : 4.8,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: thinking ? 0 : 2.8
            }}
          >
            <rect
              fill="#55f0c0"
              filter="url(#bot-neon)"
              height="16"
              rx="7"
              width="17"
              x="66"
              y="60"
            />
          </motion.g>
          <motion.g
            animate={
              thinking
                ? { x: [0, -1.5, 1.5, 0], y: [0, 0.4, -0.4, 0] }
                : { scaleY: [1, 1, 0.14, 1, 1] }
            }
            style={{ originX: "60%", originY: "50%" }}
            transition={{
              duration: thinking ? 0.9 : 4.8,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: thinking ? 0 : 2.8,
              delay: thinking ? 0.12 : 0
            }}
          >
            <rect
              fill="#55c8ff"
              filter="url(#bot-neon)"
              height="16"
              rx="7"
              width="17"
              x="97"
              y="60"
            />
          </motion.g>

          <motion.path
            animate={
              thinking
                ? { d: ["M76 84h28", "M74 86q16 7 32 0", "M76 84h28"] }
                : undefined
            }
            d="M74 86q16 7 32 0"
            fill="none"
            filter="url(#bot-neon)"
            stroke="url(#bot-glow)"
            strokeLinecap="round"
            strokeWidth="3.2"
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.path
            animate={compact ? undefined : { opacity: [0.15, 0.34, 0.15] }}
            d="M55 93c11 5 23 8 35 8 13 0 26-3 35-8"
            fill="none"
            stroke="#55c8ff"
            strokeLinecap="round"
            strokeOpacity="0.35"
            strokeWidth="1.8"
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.g>
      </svg>
    </Wrapper>
  );
}
