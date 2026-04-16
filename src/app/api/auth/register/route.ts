import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome com pelo menos 2 caracteres."),
  email: z.string().trim().email("Informe um email valido."),
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .regex(/[A-Za-z]/, "A senha precisa ter pelo menos uma letra.")
    .regex(/[0-9]/, "A senha precisa ter pelo menos um numero.")
});

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json());

  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      parsed.error.issues.map((issue) => [issue.path.join("."), issue.message])
    );

    return NextResponse.json(
      { error: "Revise os dados do cadastro.", fieldErrors },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return NextResponse.json(
      { error: "Este email ja esta em uso. Entre com senha ou use Google.", fieldErrors: { email: "Este email ja tem cadastro." } },
      { status: 409 }
    );
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 12)
    },
    select: { id: true, email: true, name: true }
  });

  return NextResponse.json({ user }, { status: 201 });
}
