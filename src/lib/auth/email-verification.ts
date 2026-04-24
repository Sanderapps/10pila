import crypto from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { logError, logInfo, logWarn } from "@/lib/utils/ops-log";

const EMAIL_VERIFICATION_PREFIX = "verify-email:";
const DEFAULT_TTL_HOURS = 24;

function verificationTtlHours() {
  const value = Number(process.env.EMAIL_VERIFICATION_TTL_HOURS ?? DEFAULT_TTL_HOURS);

  if (Number.isFinite(value) && value > 0) {
    return value;
  }

  return DEFAULT_TTL_HOURS;
}

function verificationIdentifier(email: string) {
  return `${EMAIL_VERIFICATION_PREFIX}${email.toLowerCase().trim()}`;
}

function appUrl(request?: Request) {
  return (
    process.env.APP_URL?.replace(/\/$/, "") ??
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (request ? new URL(request.url).origin : "http://localhost:3000")
  );
}

export function emailVerificationConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

async function sendVerificationEmail({
  email,
  name,
  token,
  request
}: {
  email: string;
  name?: string | null;
  token: string;
  request?: Request;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    throw new Error("Email verification is not configured.");
  }

  const verifyUrl = `${appUrl(request)}/auth/verify-email?token=${encodeURIComponent(token)}`;
  const displayName = name?.trim() || "voce";
  const replyTo = process.env.RESEND_REPLY_TO?.trim();
  const payload = {
    from,
    to: [email],
    subject: "Confirme seu email na 10PILA",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#f7fbff;background:#0b0f14;padding:32px">
        <div style="max-width:560px;margin:0 auto;background:#111821;border:1px solid #243140;border-radius:16px;padding:32px">
          <p style="margin:0 0 12px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#7aa2c2">10PILA</p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#f7fbff">Confirme seu email</h1>
          <p style="margin:0 0 20px;color:#d6e0eb">Oi, ${displayName}. Falta um passo rapido para liberar seu login por email e senha.</p>
          <p style="margin:0 0 24px">
            <a href="${verifyUrl}" style="display:inline-block;background:#3df5a5;color:#04130d;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:10px">
              Confirmar email
            </a>
          </p>
          <p style="margin:0 0 12px;color:#a9b7c7">Se o botao nao abrir, use este link:</p>
          <p style="margin:0;word-break:break-all;color:#7aa2c2">${verifyUrl}</p>
          <p style="margin:24px 0 0;color:#7f8c99;font-size:13px">Esse link expira em ${verificationTtlHours()} horas.</p>
        </div>
      </div>
    `,
    text: `Oi, ${displayName}. Confirme seu email na 10PILA: ${verifyUrl}. Esse link expira em ${verificationTtlHours()} horas.`,
    ...(replyTo ? { reply_to: replyTo } : {})
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend error ${response.status}: ${body}`);
  }
}

export async function issueEmailVerification({
  email,
  name,
  request
}: {
  email: string;
  name?: string | null;
  request?: Request;
}) {
  const normalizedEmail = email.toLowerCase().trim();
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + verificationTtlHours() * 60 * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: { identifier: verificationIdentifier(normalizedEmail) }
  });

  await prisma.verificationToken.create({
    data: {
      identifier: verificationIdentifier(normalizedEmail),
      token,
      expires
    }
  });

  try {
    await sendVerificationEmail({
      email: normalizedEmail,
      name,
      token,
      request
    });

    logInfo("auth.email_verification.sent", {
      email: normalizedEmail,
      expiresAt: expires.toISOString()
    });
  } catch (error) {
    logError("auth.email_verification.send_failed", {
      email: normalizedEmail,
      message: error instanceof Error ? error.message : "unknown"
    });
    throw error;
  }
}

export async function verifyEmailToken(token: string) {
  const record = await prisma.verificationToken.findUnique({
    where: { token }
  });

  if (!record || !record.identifier.startsWith(EMAIL_VERIFICATION_PREFIX)) {
    return { ok: false as const, code: "INVALID", email: null };
  }

  const email = record.identifier.slice(EMAIL_VERIFICATION_PREFIX.length);

  if (record.expires.getTime() < Date.now()) {
    await prisma.verificationToken.delete({ where: { token } });
    return { ok: false as const, code: "EXPIRED", email };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true }
  });

  if (!user) {
    await prisma.verificationToken.delete({ where: { token } });
    return { ok: false as const, code: "INVALID", email };
  }

  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() }
    });
  }

  await prisma.verificationToken.deleteMany({
    where: { identifier: verificationIdentifier(email) }
  });

  logInfo("auth.email_verification.verified", {
    userId: user.id,
    email
  });

  return { ok: true as const, email };
}

export async function resendEmailVerification(email: string, request?: Request) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      passwordHash: true
    }
  });

  if (!user) {
    logWarn("auth.email_verification.resend_missing_user", { email: normalizedEmail });
    return { ok: true as const, code: "SENT_IF_POSSIBLE" };
  }

  if (!user.passwordHash) {
    return { ok: false as const, code: "SOCIAL_ONLY", message: "Essa conta usa login social. Entre com Google ou Facebook." };
  }

  if (user.emailVerified) {
    return { ok: true as const, code: "ALREADY_VERIFIED" };
  }

  await issueEmailVerification({
    email: user.email,
    name: user.name,
    request
  });

  return { ok: true as const, code: "RESENT" };
}
