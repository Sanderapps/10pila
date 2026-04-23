import type { Metadata } from "next";
import { Header } from "@/components/header";
import { ChatWidgetShell } from "@/components/chat/chat-widget-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "10PILA",
  description: "Importados tech com estoque proprio e checkout sem enrolacao.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <Header />
        {children}
        <ChatWidgetShell />
      </body>
    </html>
  );
}
