import { NextResponse } from "next/server";
import { z } from "zod";
import { validateCredentialLogin } from "@/lib/auth/credentials";

const loginCheckSchema = z.object({
  email: z.string().trim().email("Informe um email valido."),
  password: z.string().min(1, "Digite sua senha.")
});

export async function POST(request: Request) {
  const parsed = loginCheckSchema.safeParse(await request.json());

  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join("."), issue.message]));
    return NextResponse.json(
      {
        error: "Nao deu para validar esse login ainda.",
        fieldErrors
      },
      { status: 400 }
    );
  }

  const result = await validateCredentialLogin(parsed.data.email, parsed.data.password);

  if (result.ok) {
    return NextResponse.json({ ok: true });
  }

  const status = result.code === "EMAIL_NOT_VERIFIED" ? 403 : 401;
  const fieldErrors =
    result.code === "SOCIAL_ONLY"
      ? { email: result.message }
      : result.code === "MISSING_FIELDS"
        ? { email: "Email e senha sao obrigatorios." }
        : undefined;

  return NextResponse.json(
    {
      error: result.message,
      code: result.code,
      fieldErrors
    },
    { status }
  );
}
