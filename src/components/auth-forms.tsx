"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);

    const result = await signIn("credentials", {
      email: String(form.get("email")),
      password: String(form.get("password")),
      redirect: false
    });

    setLoading(false);

    if (result?.error) {
      setError("Email ou senha invalidos.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form className="panel grid gap-4 p-5" onSubmit={onSubmit}>
      <label className="label">
        Email
        <input className="input" name="email" type="email" required />
      </label>
      <label className="label">
        Senha
        <input className="input" name="password" type="password" required />
      </label>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <button className="btn" disabled={loading} type="submit">
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name")),
        email: String(form.get("email")),
        password: String(form.get("password"))
      })
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Nao deu para criar a conta.");
      return;
    }

    await signIn("credentials", {
      email: String(form.get("email")),
      password: String(form.get("password")),
      redirect: false
    });

    router.push("/");
    router.refresh();
  }

  return (
    <form className="panel grid gap-4 p-5" onSubmit={onSubmit}>
      <label className="label">
        Nome
        <input className="input" name="name" required minLength={2} />
      </label>
      <label className="label">
        Email
        <input className="input" name="email" type="email" required />
      </label>
      <label className="label">
        Senha
        <input className="input" name="password" type="password" required minLength={8} />
      </label>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <button className="btn" disabled={loading} type="submit">
        {loading ? "Criando..." : "Criar conta"}
      </button>
    </form>
  );
}
