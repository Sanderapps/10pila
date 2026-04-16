"use client";

import { getProviders, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { StatusMessage } from "@/components/status-message";

type FieldErrors = Record<string, string>;

function callbackUrl() {
  if (typeof window === "undefined") {
    return "/";
  }

  const requested = new URLSearchParams(window.location.search).get("callbackUrl");

  if (!requested || !requested.startsWith("/")) {
    return "/";
  }

  return requested;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string) {
  if (password.length < 8) {
    return "Use pelo menos 8 caracteres.";
  }

  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Use letras e numeros na senha.";
  }

  return "";
}

function GoogleButton({ disabledText }: { disabledText: string }) {
  const [googleReady, setGoogleReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProviders().then((providers) => {
      setGoogleReady(Boolean(providers?.google));
    });
  }, []);

  async function onGoogleLogin() {
    if (!googleReady) {
      return;
    }

    setLoading(true);
    await signIn("google", { callbackUrl: callbackUrl() });
  }

  return (
    <div className="grid gap-2">
      <button
        className="btn secondary min-h-11"
        disabled={!googleReady || loading}
        onClick={onGoogleLogin}
        type="button"
      >
        {loading ? "Abrindo Google..." : "Entrar com Google"}
      </button>
      {!googleReady ? <p className="text-xs text-[var(--muted)]">{disabledText}</p> : null}
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});
    setSuccess("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const nextFieldErrors: FieldErrors = {};

    if (!isValidEmail(email)) {
      nextFieldErrors.email = "Digite um email valido.";
    }

    if (!password) {
      nextFieldErrors.password = "Digite sua senha.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError("Nao deu para entrar ainda.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: callbackUrl()
    });

    setLoading(false);

    if (result?.error) {
      setError("Email ou senha nao conferem. Revise os dados e tenta de novo.");
      return;
    }

    setSuccess("Login aprovado. Redirecionando...");
    router.push(result?.url ?? callbackUrl());
    router.refresh();
  }

  return (
    <form className="panel grid gap-4 p-5" noValidate onSubmit={onSubmit}>
      <GoogleButton disabledText="Google fica ativo quando GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET forem configurados." />
      <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
        <span className="h-px flex-1 bg-[var(--line)]" />
        ou entra com email
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>
      <label className="label">
        Email
        <input
          autoComplete="email"
          className="input"
          name="email"
          placeholder="voce@email.com"
          type="email"
        />
        {fieldErrors.email ? <span className="text-xs text-[var(--danger)]">{fieldErrors.email}</span> : null}
      </label>
      <label className="label">
        Senha
        <input
          autoComplete="current-password"
          className="input"
          name="password"
          placeholder="Sua senha"
          type="password"
        />
        {fieldErrors.password ? (
          <span className="text-xs text-[var(--danger)]">{fieldErrors.password}</span>
        ) : null}
      </label>
      <StatusMessage
        fieldErrors={fieldErrors}
        message={error}
        title={error ? "Acesso travado" : undefined}
        variant="error"
      />
      <StatusMessage message={success} variant="success" />
      <button className="btn min-h-11" disabled={loading} type="submit">
        {loading ? "Validando acesso..." : "Entrar"}
      </button>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});
    setSuccess("");

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const nextFieldErrors: FieldErrors = {};
    const passwordError = validatePassword(password);

    if (name.length < 2) {
      nextFieldErrors.name = "Informe seu nome com pelo menos 2 caracteres.";
    }

    if (!isValidEmail(email)) {
      nextFieldErrors.email = "Digite um email valido.";
    }

    if (passwordError) {
      nextFieldErrors.password = passwordError;
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError("Revise o cadastro antes de criar a conta.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      setFieldErrors(data.fieldErrors ?? {});
      setError(data.error ?? "Nao deu para criar a conta agora.");
      setLoading(false);
      return;
    }

    setSuccess("Conta criada. Entrando no 10PILA...");
    await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: callbackUrl()
    });

    setLoading(false);
    router.push(callbackUrl());
    router.refresh();
  }

  return (
    <form className="panel grid gap-4 p-5" noValidate onSubmit={onSubmit}>
      <GoogleButton disabledText="Cadastro pelo Google fica ativo quando as credenciais Google forem configuradas." />
      <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
        <span className="h-px flex-1 bg-[var(--line)]" />
        ou cria com email
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>
      <label className="label">
        Nome
        <input autoComplete="name" className="input" name="name" placeholder="Seu nome" />
        {fieldErrors.name ? <span className="text-xs text-[var(--danger)]">{fieldErrors.name}</span> : null}
      </label>
      <label className="label">
        Email
        <input
          autoComplete="email"
          className="input"
          name="email"
          placeholder="voce@email.com"
          type="email"
        />
        {fieldErrors.email ? <span className="text-xs text-[var(--danger)]">{fieldErrors.email}</span> : null}
      </label>
      <label className="label">
        Senha
        <input
          autoComplete="new-password"
          className="input"
          name="password"
          placeholder="Minimo 8 caracteres, letras e numeros"
          type="password"
        />
        {fieldErrors.password ? (
          <span className="text-xs text-[var(--danger)]">{fieldErrors.password}</span>
        ) : null}
      </label>
      <p className="text-xs text-[var(--muted)]">
        Ainda nao fazemos verificacao real por email. A base esta pronta para essa etapa depois.
      </p>
      <StatusMessage
        fieldErrors={fieldErrors}
        message={error}
        title={error ? "Cadastro precisa de ajuste" : undefined}
        variant="error"
      />
      <StatusMessage message={success} variant="success" />
      <button className="btn min-h-11" disabled={loading} type="submit">
        {loading ? "Criando sua conta..." : "Criar conta"}
      </button>
    </form>
  );
}
