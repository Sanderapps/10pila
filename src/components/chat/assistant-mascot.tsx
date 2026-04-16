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
        className={compact ? "h-14 w-14" : "h-24 w-24 drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]"}
        viewBox="0 0 160 160"
      >
        <defs>
          <linearGradient id="bot-shell" x1="20" x2="120" y1="28" y2="124">
            <stop offset="0" stopColor="#20262d" />
            <stop offset="1" stopColor="#0d1014" />
          </linearGradient>
          <linearGradient id="bot-screen" x1="48" x2="112" y1="42" y2="90">
            <stop offset="0" stopColor="#04161a" />
            <stop offset="1" stopColor="#081118" />
          </linearGradient>
          <linearGradient id="bot-glow" x1="0" x2="1">
            <stop offset="0" stopColor="#3df5a5" />
            <stop offset="1" stopColor="#55c8ff" />
          </linearGradient>
          <filter id="bot-neon">
            <feGaussianBlur result="blur" stdDeviation="2.2" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <motion.g
          animate={compact ? undefined : { y: [0, -1.5, 0], rotate: [0, -2, 0, 1.6, 0] }}
          style={{ originX: "50%", originY: "54%" }}
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
            d="M70 125c0 8 5 12 10 12s10-4 10-12"
            fill="none"
            filter="url(#bot-neon)"
            stroke="url(#bot-glow)"
            strokeLinecap="round"
            strokeWidth="6"
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />

          <rect
            fill="url(#bot-shell)"
            height="32"
            rx="14"
            stroke="#2d353f"
            strokeWidth="2"
            width="54"
            x="53"
            y="89"
          />
          <rect
            fill="#0d1618"
            height="10"
            rx="5"
            stroke="rgba(85,200,255,0.45)"
            strokeWidth="1.5"
            width="18"
            x="71"
            y="100"
          />

          <rect
            fill="url(#bot-shell)"
            height="84"
            rx="30"
            stroke="#39424d"
            strokeWidth="2.5"
            width="92"
            x="34"
            y="20"
          />
          <rect
            fill="url(#bot-screen)"
            height="46"
            rx="18"
            stroke="rgba(85,200,255,0.18)"
            strokeWidth="2"
            width="64"
            x="48"
            y="38"
          />
          <path
            d="M80 16v10"
            stroke="#4a5563"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <motion.circle
            animate={thinking ? { opacity: [0.35, 1, 0.35] } : { opacity: [0.45, 0.9, 0.45] }}
            cx="80"
            cy="12"
            fill="#3df5a5"
            filter="url(#bot-neon)"
            r="4.5"
            transition={{ duration: thinking ? 0.75 : 2.2, repeat: Infinity, ease: "easeInOut" }}
          />

          <path
            d="M47 88c-5 4-9 7-13 12"
            stroke="#46505d"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <path
            d="M113 88c5 4 9 7 13 12"
            stroke="#46505d"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <circle cx="31" cy="103" fill="#1d242d" r="6" stroke="#46505d" strokeWidth="2" />
          <circle cx="129" cy="103" fill="#1d242d" r="6" stroke="#46505d" strokeWidth="2" />

          <motion.g
            animate={thinking ? { x: [0, 1.5, -1.5, 0] } : { scaleY: [1, 1, 0.16, 1, 1] }}
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
              height="14"
              rx="6"
              width="15"
              x="60"
              y="52"
            />
          </motion.g>
          <motion.g
            animate={thinking ? { x: [0, -1.5, 1.5, 0] } : { scaleY: [1, 1, 0.16, 1, 1] }}
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
              height="14"
              rx="6"
              width="15"
              x="85"
              y="52"
            />
          </motion.g>

          <motion.path
            animate={thinking ? { d: ["M68 74h24", "M66 75q14 6 28 0", "M68 74h24"] } : undefined}
            d="M66 75q14 6 28 0"
            fill="none"
            filter="url(#bot-neon)"
            stroke="url(#bot-glow)"
            strokeLinecap="round"
            strokeWidth="3.2"
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.g>
      </svg>
    </Wrapper>
  );
}
