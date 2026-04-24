import { NextResponse } from "next/server";
import { z } from "zod";
import { emailVerificationConfigured, resendEmailVerification } from "@/lib/auth/email-verification";

const resendSchema = z.object({
  email: z.string().trim().email("Informe um email valido.")
});

export async function POST(request: Request) {
  if (!emailVerificationConfigured()) {
    return NextResponse.json(
      { error: "A confirmacao de email ainda nao esta configurada no ambiente." },
      { status: 503 }
    );
  }

  const parsed = resendSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Informe um email valido para reenviar a confirmacao.",
        fieldErrors: Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join("."), issue.message]))
      },
      { status: 400 }
    );
  }

  try {
    const result = await resendEmailVerification(parsed.data.email, request);

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    if (result.code === "ALREADY_VERIFIED") {
      return NextResponse.json({ message: "Esse email ja foi confirmado. Voce ja pode entrar." });
    }

    return NextResponse.json({ message: "Se essa conta existir e ainda estiver pendente, mandamos um novo link." });
  } catch {
    return NextResponse.json(
      { error: "Nao deu para reenviar agora. Tenta de novo em instantes." },
      { status: 500 }
    );
  }
}
