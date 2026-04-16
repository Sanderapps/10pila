"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { StatusMessage } from "@/components/status-message";

type ConfigValues = {
  primaryProvider: string;
  fallbackProvider1: string | null;
  fallbackProvider2: string | null;
  groqModel: string | null;
  geminiModel: string | null;
  openRouterModel: string | null;
  temperature: number;
  maxOutputTokens: number;
  assistantMode: string;
};

const PROVIDERS = [
  { value: "GEMINI", label: "Gemini" },
  { value: "GROQ", label: "Groq" },
  { value: "OPENROUTER", label: "OpenRouter free" }
] as const;

const MODES = [
  { value: "SALES", label: "vendas" },
  { value: "SUPPORT", label: "suporte" },
  { value: "BALANCED", label: "equilibrado" },
  { value: "AMIGAVEL", label: "amigavel" }
] as const;

export function AssistantConfigForm({ initialConfig }: { initialConfig: ConfigValues }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [testReply, setTestReply] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const form = new FormData(event.currentTarget);
    const payload = {
      primaryProvider: String(form.get("primaryProvider") ?? "GEMINI"),
      fallbackProvider1: String(form.get("fallbackProvider1") ?? "") || null,
      fallbackProvider2: String(form.get("fallbackProvider2") ?? "") || null,
      groqModel: String(form.get("groqModel") ?? "").trim() || null,
      geminiModel: String(form.get("geminiModel") ?? "").trim() || null,
      openRouterModel: String(form.get("openRouterModel") ?? "").trim() || null,
      temperature: Number(form.get("temperature") ?? "0.32"),
      maxOutputTokens: Number(form.get("maxOutputTokens") ?? "360"),
      assistantMode: String(form.get("assistantMode") ?? "SALES")
    };

    const response = await fetch("/api/admin/chat-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Falha ao salvar configuracao.");
      return;
    }

    setSuccess("Configuracao do PilaBot salva.");
    router.refresh();
  }

  async function runTest() {
    setTesting(true);
    setError("");
    setTestReply("");
    const response = await fetch("/api/admin/chat-config/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "manda o link do suporte de celular",
        pathname: "/produtos/suporte-dobravel-pop"
      })
    });
    const data = await response.json();
    setTesting(false);

    if (!response.ok) {
      setError(data.error ?? "Falha ao testar assistente.");
      return;
    }

    setTestReply(String(data.answer?.reply ?? ""));
  }

  return (
    <section className="panel grid gap-4 p-5">
      <div className="grid gap-1">
        <p className="eyebrow">PilaBot</p>
        <h2 className="text-2xl font-bold">Configuracao do assistente</h2>
        <p className="text-sm text-[var(--muted)]">
          Escolha o provedor principal, a fila de fallback e o jeito de responder do PilaBot sem expor tecnologia ao cliente final.
        </p>
      </div>

      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="label">
            Provedor principal
            <select className="input" defaultValue={initialConfig.primaryProvider} name="primaryProvider">
              {PROVIDERS.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </label>
          <label className="label">
            Fallback 1
            <select className="input" defaultValue={initialConfig.fallbackProvider1 ?? ""} name="fallbackProvider1">
              <option value="">sem fallback</option>
              {PROVIDERS.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </label>
          <label className="label">
            Fallback 2
            <select className="input" defaultValue={initialConfig.fallbackProvider2 ?? ""} name="fallbackProvider2">
              <option value="">sem fallback</option>
              {PROVIDERS.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="label">
            Modelo Groq
            <input className="input" defaultValue={initialConfig.groqModel ?? ""} name="groqModel" />
          </label>
          <label className="label">
            Modelo Gemini
            <input className="input" defaultValue={initialConfig.geminiModel ?? ""} name="geminiModel" />
          </label>
          <label className="label">
            Modelo OpenRouter
            <input className="input" defaultValue={initialConfig.openRouterModel ?? ""} name="openRouterModel" />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="label">
            Temperatura
            <input
              className="input"
              defaultValue={initialConfig.temperature}
              max="1"
              min="0"
              name="temperature"
              step="0.01"
              type="number"
            />
          </label>
          <label className="label">
            Limite de resposta
            <input
              className="input"
              defaultValue={initialConfig.maxOutputTokens}
              max="800"
              min="120"
              name="maxOutputTokens"
              step="10"
              type="number"
            />
          </label>
          <label className="label">
            Modo do assistente
            <select className="input" defaultValue={initialConfig.assistantMode} name="assistantMode">
              {MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <StatusMessage
          message={success || error}
          variant={error ? "error" : success ? "success" : "info"}
        />

        <div className="flex flex-wrap gap-3">
          <button className="btn" disabled={loading} type="submit">
            {loading ? "Salvando..." : "Salvar configuracao"}
          </button>
          <button className="btn secondary" disabled={testing} onClick={runTest} type="button">
            {testing ? "Testando..." : "Testar assistente"}
          </button>
        </div>
      </form>

      {testReply ? (
        <div className="rounded-lg border border-[var(--line)] bg-black/20 p-4 text-sm text-[var(--muted)]">
          <p className="mb-2 text-xs font-black uppercase text-[var(--accent)]">Resposta de teste</p>
          <p>{testReply}</p>
        </div>
      ) : null}
    </section>
  );
}
