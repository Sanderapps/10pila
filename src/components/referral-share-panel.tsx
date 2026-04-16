"use client";

import { useState } from "react";
import { StatusMessage } from "@/components/status-message";

type ReferralSharePanelProps = {
  code: string;
  referralLink: string;
};

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function ReferralSharePanel({
  code,
  referralLink
}: ReferralSharePanelProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function handleCopy(value: string, nextMessage: string) {
    try {
      await copyText(value);
      setError("");
      setMessage(nextMessage);
    } catch {
      setMessage("");
      setError("Nao consegui copiar agora. Tenta de novo.");
    }
  }

  async function handleShare() {
    if (!canShare) {
      return;
    }

    try {
      await navigator.share({
        title: "10PILA",
        text: `Entra pelo meu link e garimpa uns achados na 10PILA: ${referralLink}`,
        url: referralLink
      });
      setError("");
      setMessage("Link pronto para compartilhar.");
    } catch {
      // usuario cancelou ou share nao completou; sem erro visual agressivo
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <p className="text-sm font-bold text-[var(--accent)]">seu codigo</p>
        <div className="surface grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="grid gap-1">
            <strong className="text-2xl tracking-[0.18em] text-[var(--foreground)]">{code}</strong>
            <span className="text-xs text-[var(--muted)]">Use no cadastro ou manda o link pronto.</span>
          </div>
          <button
            className="btn secondary min-h-10 px-3"
            onClick={() => void handleCopy(code, "Codigo copiado.")}
            type="button"
          >
            Copiar codigo
          </button>
        </div>
      </div>

      <div className="surface grid gap-3 p-4">
        <div className="grid gap-1">
          <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">link de indicacao</span>
          <p className="break-all text-sm text-[#69B7FF]">{referralLink}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn min-h-10 px-3"
            onClick={() => void handleCopy(referralLink, "Link copiado.")}
            type="button"
          >
            Copiar link
          </button>
          {canShare ? (
            <button className="btn secondary min-h-10 px-3" onClick={() => void handleShare()} type="button">
              Compartilhar
            </button>
          ) : null}
        </div>
      </div>

      {error ? <StatusMessage message={error} variant="error" /> : null}
      {message ? <StatusMessage message={message} variant="success" /> : null}
    </div>
  );
}
