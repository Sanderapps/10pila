"use client";

import { motion } from "framer-motion";
import { useId } from "react";

type AssistantMascotProps = {
  compact?: boolean;
  onClick?: () => void;
  thinking?: boolean;
  open?: boolean;
};

export function AssistantMascot({
  compact = false,
  onClick,
  thinking = false,
  open = false
}: AssistantMascotProps) {
  const id = useId();
  const shellId = `${id}-shell`;
  const screenId = `${id}-screen`;
  const glowId = `${id}-glow`;
  const panelId = `${id}-panel`;
  const neonId = `${id}-neon`;
  const shadowId = `${id}-shadow`;
  const Wrapper = onClick ? motion.button : motion.div;
  const triggerStateClass = onClick
    ? `${open ? "assistant-mascot-open" : "assistant-mascot-closed"} ${thinking ? "assistant-mascot-thinking" : ""}`
    : "";
  const sizeClass = compact
    ? "assistant-mascot-svg h-14 w-14"
    : "assistant-mascot-svg h-28 w-28 drop-shadow-[0_24px_44px_rgba(0,0,0,0.48)]";

  return (
    <Wrapper
      animate={
        compact
          ? undefined
          : open
            ? {
                y: [0, -1.5, 0],
                rotate: [0, 0.8, 0, -0.8, 0],
                scale: [0.98, 1, 0.98]
              }
            : {
                y: [0, -3, 0],
                rotate: [0, -1.6, 0, 1.2, 0]
              }
      }
      aria-label={onClick ? (open ? "Fechar chat da IA 10PILA" : "Abrir chat da IA 10PILA") : undefined}
      className={
        onClick
          ? `assistant-mascot-trigger ${triggerStateClass} group relative block h-24 w-24 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-2)]`
          : "relative block"
      }
      onClick={onClick}
      transition={
        compact
          ? undefined
          : {
              duration: open ? 2.8 : 4.8,
              repeat: Infinity,
              repeatDelay: open ? 1.2 : 3.2,
              ease: "easeInOut"
            }
      }
      type={onClick ? "button" : undefined}
      whileHover={onClick ? { y: -4, scale: 1.04 } : undefined}
      whileTap={onClick ? { scale: 0.9, rotate: -3 } : undefined}
    >
      <svg
        aria-hidden="true"
        className={sizeClass}
        viewBox="0 0 180 180"
      >
        <defs>
          <linearGradient id={shellId} x1="34" x2="138" y1="24" y2="134">
            <stop offset="0" stopColor="#3d4652" />
            <stop offset="0.56" stopColor="#202832" />
            <stop offset="1" stopColor="#111820" />
          </linearGradient>
          <linearGradient id={screenId} x1="56" x2="124" y1="42" y2="96">
            <stop offset="0" stopColor="#04141a" />
            <stop offset="0.5" stopColor="#071019" />
            <stop offset="1" stopColor="#081118" />
          </linearGradient>
          <linearGradient id={glowId} x1="0" x2="1">
            <stop offset="0" stopColor="#3df5a5" />
            <stop offset="1" stopColor="#55c8ff" />
          </linearGradient>
          <linearGradient id={panelId} x1="68" x2="111" y1="108" y2="122">
            <stop offset="0" stopColor="#143033" />
            <stop offset="1" stopColor="#0d1618" />
          </linearGradient>
          <filter id={neonId}>
            <feGaussianBlur result="blur" stdDeviation="2.4" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={shadowId} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="12" floodColor="#000" floodOpacity="0.42" stdDeviation="12" />
          </filter>
        </defs>

        <motion.g
          animate={compact ? undefined : { y: [0, -1.5, 0], rotate: [0, -2.4, 0, 1.6, 0] }}
          filter={`url(#${shadowId})`}
          style={{ originX: "50%", originY: "56%" }}
          transition={{ duration: 4.6, repeat: Infinity, repeatDelay: 3.6, ease: "easeInOut" }}
        >
          <motion.path
            animate={
              thinking
                ? { opacity: [0.45, 1, 0.45], pathLength: [0.55, 1, 0.55] }
                : compact
                  ? undefined
                  : { opacity: [0.38, 0.68, 0.38] }
            }
            d="M79 143c0 9 5 13 11 13s11-4 11-13"
            fill="none"
            filter={`url(#${neonId})`}
            stroke={`url(#${glowId})`}
            strokeLinecap="round"
            strokeWidth="6"
            transition={{ duration: thinking ? 0.8 : 1.4, repeat: Infinity, ease: "easeInOut" }}
          />

          <rect
            fill={`url(#${shellId})`}
            height="34"
            rx="15"
            stroke="#6d7b8d"
            strokeWidth="2"
            width="56"
            x="62"
            y="102"
          />
          <rect
            fill={`url(#${panelId})`}
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
            stroke="#6d7b8d"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <path
            d="M110 118c7 3 13 8 17 16"
            stroke="#6d7b8d"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <circle cx="49" cy="137" fill="#26313d" r="6.5" stroke="#6d7b8d" strokeWidth="2" />
          <circle cx="131" cy="137" fill="#26313d" r="6.5" stroke="#6d7b8d" strokeWidth="2" />

          <rect
            fill={`url(#${shellId})`}
            height="94"
            rx="34"
            stroke="#7f8ea1"
            strokeWidth="3"
            width="104"
            x="38"
            y="24"
          />
          <rect
            fill={`url(#${screenId})`}
            height="52"
            rx="20"
            stroke="rgba(85,200,255,0.48)"
            strokeWidth="2"
            width="72"
            x="54"
            y="45"
          />

          <path d="M90 16v12" stroke="#8191a5" strokeLinecap="round" strokeWidth="3" />
          <motion.circle
            animate={
              thinking
                ? { opacity: [0.35, 1, 0.35], r: [4.5, 6.2, 4.5] }
                : { opacity: [0.45, 0.9, 0.45], r: [4.5, 5.2, 4.5] }
            }
            cx="90"
            cy="12"
            fill="#3df5a5"
            filter={`url(#${neonId})`}
            r="4.5"
            transition={{ duration: thinking ? 0.65 : 2.2, repeat: Infinity, ease: "easeInOut" }}
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
              filter={`url(#${neonId})`}
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
              filter={`url(#${neonId})`}
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
                ? { d: ["M75 84h30", "M71 85q19 12 38 0", "M75 84h30"] }
                : { d: ["M71 84q19 12 38 0", "M72 85q18 10 36 0", "M71 84q19 12 38 0"] }
            }
            d="M71 84q19 12 38 0"
            fill="none"
            filter={`url(#${neonId})`}
            stroke={`url(#${glowId})`}
            strokeLinecap="round"
            strokeWidth="3.2"
            transition={{ duration: thinking ? 1.1 : 4.6, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.path
            animate={thinking ? { opacity: [0.35, 0.8, 0.35] } : { opacity: [0.22, 0.42, 0.22] }}
            d="M90 111l4 9h8l-7 4 2 8-7-4-7 4 2-8-7-4h8l4-9Z"
            fill={`url(#${glowId})`}
            opacity="0.28"
            transition={{ duration: thinking ? 1 : 2.8, repeat: Infinity, ease: "easeInOut" }}
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
