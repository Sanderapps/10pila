"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { StatusMessage } from "@/components/status-message";

export function EmailVerificationPanel({
  initialEmail = "",
  mode = "default"
}: {
  initialEmail?: string;
  mode?: "default" | "compact";
}) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const normalizedEmail = useMemo(() => initialEmail.trim().toLowerCase(), [initialEmail]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Nao deu para reenviar agora.");
      return;
    }

    setSuccess(data.message ?? "Se essa conta existir, mandamos um novo link.");
  }

  return (
    <div className={`grid gap-4 ${mode === "compact" ? "rounded-lg border border-[var(--line)] bg-black/20 p-4" : "panel p-5 md:p-6"}`}>
      <div className="grid gap-1">
        <p className="text-sm font-bold text-[var(--foreground)]">Reenviar confirmacao</p>
        <p className="text-sm text-[var(--muted)]">
          {normalizedEmail
            ? `Se ${normalizedEmail} ainda estiver pendente, mandamos outro link.`
            : "Se sua conta ainda estiver pendente, mandamos outro link por email."}
        </p>
      </div>
      <form className="grid gap-3" onSubmit={onSubmit}>
        <label className="label">
          Email
          <input
            autoComplete="email"
            className="input"
            inputMode="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@email.com"
            type="email"
            value={email}
          />
        </label>
        <StatusMessage message={error} title={error ? "Reenvio travado" : undefined} variant="error" />
        <StatusMessage message={success} variant="success" />
        <button className="btn min-h-11" disabled={loading} type="submit">
          {loading ? "Reenviando..." : "Mandar novo link"}
        </button>
      </form>
      {mode === "default" ? (
        <Link className="text-sm text-[var(--accent)]" href="/auth/login">
          Voltar para login
        </Link>
      ) : null}
    </div>
  );
}
