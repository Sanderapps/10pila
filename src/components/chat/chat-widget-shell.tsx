"use client";

import dynamic from "next/dynamic";

export const ChatWidgetShell = dynamic(
  () => import("@/components/chat-widget").then((module) => module.ChatWidget),
  { ssr: false }
);
