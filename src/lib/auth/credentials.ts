import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { logInfo, logWarn } from "@/lib/utils/ops-log";

export type CredentialCheckCode =
  | "MISSING_FIELDS"
  | "USER_NOT_FOUND"
  | "SOCIAL_ONLY"
  | "INVALID_PASSWORD"
  | "EMAIL_NOT_VERIFIED";

type CredentialCheckFailure = {
  ok: false;
  code: CredentialCheckCode;
  message: string;
};

type CredentialCheckSuccess = {
  ok: true;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: "USER" | "ADMIN";
    emailVerified: Date | null;
  };
};

export type CredentialCheckResult = CredentialCheckFailure | CredentialCheckSuccess;

export async function validateCredentialLogin(email: string, password: string): Promise<CredentialCheckResult> {
  const normalizedEmail = email.toLowerCase().trim();

  if (!normalizedEmail || !password) {
    return {
      ok: false,
      code: "MISSING_FIELDS",
      message: "Email e senha sao obrigatorios."
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      passwordHash: true
    }
  });

  if (!user) {
    logWarn("auth.credentials.user_missing", { email: normalizedEmail });
    return {
      ok: false,
      code: "USER_NOT_FOUND",
      message: "Email ou senha nao conferem."
    };
  }

  if (!user.passwordHash) {
    logWarn("auth.credentials.user_missing_or_social_only", { email: normalizedEmail });
    return {
      ok: false,
      code: "SOCIAL_ONLY",
      message: "Essa conta usa login social. Entre com Google ou Facebook."
    };
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    logWarn("auth.credentials.invalid_password", {
      userId: user.id,
      email: normalizedEmail
    });
    return {
      ok: false,
      code: "INVALID_PASSWORD",
      message: "Email ou senha nao conferem."
    };
  }

  if (!user.emailVerified) {
    logWarn("auth.credentials.email_not_verified", {
      userId: user.id,
      email: normalizedEmail
    });
    return {
      ok: false,
      code: "EMAIL_NOT_VERIFIED",
      message: "Confirme seu email antes de entrar."
    };
  }

  logInfo("auth.credentials.authorized", {
    userId: user.id,
    role: user.role
  });

  return {
    ok: true,
    user
  };
}
