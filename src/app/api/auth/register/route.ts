import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { attachReferralToNewUser } from "@/lib/commerce/referrals";
import { prisma } from "@/lib/db/prisma";
import { logError, logInfo, logWarn } from "@/lib/utils/ops-log";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome com pelo menos 2 caracteres."),
  email: z.string().trim().email("Informe um email valido."),
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .regex(/[A-Za-z]/, "A senha precisa ter pelo menos uma letra.")
    .regex(/[0-9]/, "A senha precisa ter pelo menos um numero."),
  referralCode: z.string().trim().min(4).max(24).optional().or(z.literal(""))
});

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json());

  if (!parsed.success) {
    logWarn("auth.register.invalid_payload", {
      issueCount: parsed.error.issues.length
    });
    const fieldErrors = Object.fromEntries(
      parsed.error.issues.map((issue) => [issue.path.join("."), issue.message])
    );

    return NextResponse.json(
      { error: "Revise os dados do cadastro.", fieldErrors },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const referralCode = parsed.data.referralCode?.trim().toUpperCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    logWarn("auth.register.email_conflict", { email });
    return NextResponse.json(
      { error: "Este email ja esta em uso. Entre com senha ou use Google.", fieldErrors: { email: "Este email ja tem cadastro." } },
      { status: 409 }
    );
  }

  if (referralCode) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode },
      select: { id: true, email: true }
    });

    if (!referrer || referrer.email === email) {
      logWarn("auth.register.invalid_referral", {
        email,
        referralCode
      });
      return NextResponse.json(
        {
          error: "Codigo de indicacao invalido.",
          fieldErrors: { referralCode: "Esse codigo de indicacao nao bate com uma conta valida." }
        },
        { status: 400 }
      );
    }
  }

  try {
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash: await bcrypt.hash(parsed.data.password, 12)
      },
      select: { id: true, email: true, name: true }
    });

    const referral = await attachReferralToNewUser({
      userId: user.id,
      email: user.email,
      referralCode
    });

    logInfo("auth.register.created", {
      userId: user.id,
      hasReferralCode: Boolean(referralCode),
      referralAttached: Boolean(referral)
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    logError("auth.register.failed", {
      email,
      hasReferralCode: Boolean(referralCode),
      message: error instanceof Error ? error.message : "unknown"
    });

    return NextResponse.json(
      { error: "Nao deu para criar a conta agora. Tenta de novo em instantes." },
      { status: 500 }
    );
  }
}
