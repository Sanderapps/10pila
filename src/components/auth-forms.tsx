"use client";

import Link from "next/link";
import { ClientSafeProvider, getProviders, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { StatusMessage } from "@/components/status-message";

type FieldErrors = Record<string, string>;

type SocialProvider = ClientSafeProvider & {
  id: "google" | "facebook";
};

type PasswordChecks = {
  minLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
};

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

function getPasswordChecks(password: string): PasswordChecks {
  return {
    minLength: password.length >= 8,
    hasLetter: /[A-Za-z]/.test(password),
    hasNumber: /[0-9]/.test(password)
  };
}

function validatePassword(password: string) {
  const checks = getPasswordChecks(password);

  if (!checks.minLength) {
    return "Use pelo menos 8 caracteres.";
  }

  if (!checks.hasLetter) {
    return "Use pelo menos 1 letra na senha.";
  }

  if (!checks.hasNumber) {
    return "Use pelo menos 1 numero na senha.";
  }

  return "";
}

function providerLabel(id: string) {
  if (id === "google") {
    return "Google";
  }

  if (id === "facebook") {
    return "Facebook";
  }

  return id;
}

function providerDisabledText(id: string) {
  if (id === "google") {
    return "Google fica ativo quando GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET forem configurados.";
  }

  if (id === "facebook") {
    return "Facebook fica ativo quando AUTH_FACEBOOK_ID e AUTH_FACEBOOK_SECRET forem configurados.";
  }

  return "";
}

function PasswordInput({
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  label
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  error?: string;
  label: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="label">
      {label}
      <div className="relative">
        <input
          autoComplete={autoComplete}
          className="input pr-24"
          name={name}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={visible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          className="absolute right-2 top-1/2 min-h-9 -translate-y-1/2 rounded-md border border-[var(--line)] px-3 text-xs font-bold text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--foreground)]"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {error ? <span className="text-xs text-[var(--danger)]">{error}</span> : null}
    </label>
  );
}

function PasswordChecklist({
  password,
  touched,
  confirmPassword,
  confirmTouched
}: {
  password: string;
  touched: boolean;
  confirmPassword?: string;
  confirmTouched?: boolean;
}) {
  const checks = useMemo(() => getPasswordChecks(password), [password]);
  const shouldShow = touched || password.length > 0;
  const confirmActive = typeof confirmPassword === "string" && (confirmTouched || confirmPassword.length > 0);

  if (!shouldShow && !confirmActive) {
    return null;
  }

  const rows = [
    { ok: checks.minLength, label: "Minimo de 8 caracteres" },
    { ok: checks.hasLetter, label: "Pelo menos 1 letra" },
    { ok: checks.hasNumber, label: "Pelo menos 1 numero" }
  ];

  return (
    <div className="grid gap-2 rounded-lg border border-[var(--line)] bg-black/20 p-3 text-sm">
      <p className="text-xs font-bold uppercase text-[var(--muted)]">Senha em tempo real</p>
      <div className="grid gap-1">
        {rows.map((row) => (
          <p className="flex items-center gap-2" key={row.label}>
            <span aria-hidden="true" className={row.ok ? "text-[var(--accent)]" : "text-[var(--muted)]"}>
              {row.ok ? "✓" : "○"}
            </span>
            <span className={row.ok ? "text-[var(--foreground)]" : "text-[var(--muted)]"}>{row.label}</span>
          </p>
        ))}
        {typeof confirmPassword === "string" && confirmActive ? (
          <p className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={confirmPassword === password && confirmPassword.length > 0 ? "text-[var(--accent)]" : "text-[var(--muted)]"}
            >
              {confirmPassword === password && confirmPassword.length > 0 ? "✓" : "○"}
            </span>
            <span
              className={
                confirmPassword === password && confirmPassword.length > 0 ? "text-[var(--foreground)]" : "text-[var(--muted)]"
              }
            >
              Senhas conferem
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SocialProviders({ mode }: { mode: "login" | "register" }) {
  const [providers, setProviders] = useState<SocialProvider[]>([]);
  const [loadingProvider, setLoadingProvider] = useState<string>("");

  useEffect(() => {
    getProviders().then((available) => {
      const socialProviders = Object.values(available ?? {}).filter(
        (provider): provider is SocialProvider =>
          provider.id === "google" || provider.id === "facebook"
      );
      setProviders(socialProviders);
    });
  }, []);

  async function onProviderLogin(providerId: SocialProvider["id"]) {
    setLoadingProvider(providerId);
    await signIn(providerId, { callbackUrl: callbackUrl() });
  }

  const ready = new Set(providers.map((provider) => provider.id));
  const expected: Array<SocialProvider["id"]> = ["google", "facebook"];

  return (
    <div className="grid gap-2">
      {expected.map((providerId) => {
        const active = ready.has(providerId);
        const label = providerLabel(providerId);
        const action = mode === "login" ? "Entrar" : "Continuar";

        return (
          <button
            key={providerId}
            className="btn secondary min-h-11"
            disabled={!active || loadingProvider.length > 0}
            onClick={() => onProviderLogin(providerId)}
            type="button"
          >
            {loadingProvider === providerId ? `Abrindo ${label}...` : `${action} com ${label}`}
          </button>
        );
      })}
      {expected
        .filter((providerId) => !ready.has(providerId))
        .map((providerId) => (
          <p className="text-xs text-[var(--muted)]" key={`${providerId}-hint`}>
            {providerDisabledText(providerId)}
          </p>
        ))}
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});
    setSuccess("");
    setPendingVerificationEmail("");

    const normalizedEmail = email.trim().toLowerCase();
    const nextFieldErrors: FieldErrors = {};

    if (!isValidEmail(normalizedEmail)) {
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

    const checkResponse = await fetch("/api/auth/login-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password })
    });
    const checkData = await checkResponse.json();

    if (!checkResponse.ok) {
      setLoading(false);
      setFieldErrors(checkData.fieldErrors ?? {});
      setError(checkData.error ?? "Nao deu para entrar ainda.");

      if (checkData.code === "EMAIL_NOT_VERIFIED") {
        setPendingVerificationEmail(normalizedEmail);
      }

      return;
    }

    const result = await signIn("credentials", {
      email: normalizedEmail,
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
    <form className="panel grid gap-5 p-5 md:p-6" noValidate onSubmit={onSubmit}>
      <div className="grid gap-1">
        <p className="text-sm font-bold text-[var(--foreground)]">Entrar com email</p>
        <p className="text-sm text-[var(--muted)]">Use o email e a senha cadastrados para continuar.</p>
      </div>
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
        {fieldErrors.email ? <span className="text-xs text-[var(--danger)]">{fieldErrors.email}</span> : null}
      </label>
      <PasswordInput
        autoComplete="current-password"
        error={fieldErrors.password}
        label="Senha"
        name="password"
        onChange={setPassword}
        placeholder="Sua senha"
        value={password}
      />
      <StatusMessage
        fieldErrors={fieldErrors}
        message={error}
        title={error ? "Acesso travado" : undefined}
        variant="error"
      />
      {pendingVerificationEmail ? (
        <div className="grid gap-2 rounded-lg border border-[rgba(61,245,165,0.28)] bg-[rgba(61,245,165,0.08)] p-4 text-sm">
          <p className="font-bold text-[var(--foreground)]">Falta confirmar o email.</p>
          <p className="text-[var(--muted)]">Abra o link que mandamos ou reenvie a confirmacao agora.</p>
          <Link className="text-[var(--accent)]" href={`/auth/verify-email?email=${encodeURIComponent(pendingVerificationEmail)}`}>
            Abrir tela de confirmacao
          </Link>
        </div>
      ) : null}
      <StatusMessage message={success} variant="success" />
      <button className="btn min-h-11" disabled={loading} type="submit">
        {loading ? "Validando acesso..." : "Entrar"}
      </button>
      <div className="grid gap-3 border-t border-[var(--line)] pt-4">
        <p className="text-xs font-bold uppercase text-[var(--muted)]">Ou entre com uma conta externa</p>
        <SocialProviders mode="login" />
      </div>
    </form>
  );
}

export function RegisterForm({ initialReferralCode = "" }: { initialReferralCode?: string }) {
  const router = useRouter();
  const initialReferralFromLink = initialReferralCode.trim().length > 0;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setReferralCode(initialReferralCode);
  }, [initialReferralCode]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});
    setSuccess("");

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const referral = referralCode.trim().toUpperCase();
    const nextFieldErrors: FieldErrors = {};
    const passwordError = validatePassword(password);

    if (normalizedName.length < 2) {
      nextFieldErrors.name = "Informe seu nome com pelo menos 2 caracteres.";
    }

    if (!isValidEmail(normalizedEmail)) {
      nextFieldErrors.email = "Digite um email valido.";
    }

    if (passwordError) {
      nextFieldErrors.password = passwordError;
    }

    if (!confirmPassword) {
      nextFieldErrors.confirmPassword = "Confirme sua senha.";
    } else if (confirmPassword !== password) {
      nextFieldErrors.confirmPassword = "As senhas precisam ser iguais.";
    }

    if (referral && referral.length < 4) {
      nextFieldErrors.referralCode = "Use um codigo valido de indicacao.";
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
      body: JSON.stringify({ name: normalizedName, email: normalizedEmail, password, referralCode: referral || undefined })
    });

    const data = await response.json();

    if (!response.ok) {
      setFieldErrors(data.fieldErrors ?? {});
      setError(data.error ?? "Nao deu para criar a conta agora.");
      setLoading(false);
      return;
    }

    setSuccess("Conta criada. Agora confirme seu email para liberar o login.");
    setLoading(false);
    router.push(
      `/auth/verify-email?email=${encodeURIComponent(normalizedEmail)}${data.verificationEmail === "failed" ? "&delivery=failed" : ""}`
    );
    router.refresh();
  }

  return (
    <form className="panel grid gap-4 p-5" noValidate onSubmit={onSubmit}>
      <SocialProviders mode="register" />
      <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
        <span className="h-px flex-1 bg-[var(--line)]" />
        ou preencha os dados
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>
      <label className="label">
        Nome
        <input
          autoComplete="name"
          className="input"
          name="name"
          onChange={(event) => setName(event.target.value)}
          placeholder="Seu nome"
          value={name}
        />
        {fieldErrors.name ? <span className="text-xs text-[var(--danger)]">{fieldErrors.name}</span> : null}
      </label>
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
        {fieldErrors.email ? <span className="text-xs text-[var(--danger)]">{fieldErrors.email}</span> : null}
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <PasswordInput
            autoComplete="new-password"
            error={fieldErrors.password}
            label="Senha"
            name="password"
            onChange={(value) => {
              setPassword(value);
              setPasswordTouched(true);
            }}
            placeholder="Minimo 8 caracteres, letras e numeros"
            value={password}
          />
        </div>
        <div className="grid gap-2">
          <PasswordInput
            autoComplete="new-password"
            error={fieldErrors.confirmPassword}
            label="Confirmar senha"
            name="confirmPassword"
            onChange={(value) => {
              setConfirmPassword(value);
              setConfirmTouched(true);
            }}
            placeholder="Repita a senha"
            value={confirmPassword}
          />
        </div>
      </div>
      <PasswordChecklist
        confirmPassword={confirmPassword}
        confirmTouched={confirmTouched}
        password={password}
        touched={passwordTouched}
      />
      <div className="grid gap-3 rounded-lg border border-[var(--line)] bg-black/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="grid gap-1">
            <p className="text-sm font-bold text-[var(--foreground)]">Codigo de indicacao</p>
            <p className="text-xs text-[var(--muted)]">Opcional. Se alguem te indicou, use o codigo aqui.</p>
          </div>
          {initialReferralFromLink && referralCode ? (
            <span className="rounded-full border border-[rgba(61,245,165,0.28)] bg-[rgba(61,245,165,0.12)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
              veio pelo link
            </span>
          ) : null}
        </div>
        <label className="label">
          Codigo de indicacao
          <div className="relative">
            <input
              autoCapitalize="characters"
              autoComplete="off"
              className="input pr-24"
              maxLength={24}
              name="referralCode"
              onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
              placeholder="Ex.: ABC123"
              value={referralCode}
            />
            {referralCode ? (
              <button
                aria-label="Limpar codigo de indicacao"
                className="absolute right-2 top-1/2 min-h-9 -translate-y-1/2 rounded-md border border-[var(--line)] px-3 text-xs font-bold text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--foreground)]"
                onClick={() => {
                  setReferralCode("");
                  setFieldErrors((current) => ({ ...current, referralCode: "" }));
                }}
                type="button"
              >
                Limpar
              </button>
            ) : null}
          </div>
          {initialReferralFromLink && referralCode ? (
            <span className="text-xs text-[var(--accent)]">Codigo preenchido pelo link. Voce pode editar ou remover.</span>
          ) : (
            <span className="text-xs text-[var(--muted)]">Se nao tiver codigo, pode deixar em branco.</span>
          )}
          {fieldErrors.referralCode ? (
            <span className="text-xs text-[var(--danger)]">{fieldErrors.referralCode}</span>
          ) : null}
        </label>
      </div>
      <p className="text-xs text-[var(--muted)]">
        Use um email que voce consiga acessar. O login por senha so libera depois da confirmacao por email.
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
