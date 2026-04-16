import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/api";
import { chatTestInputSchema } from "@/lib/admin/chat-config-input";
import { answerFromStoreData } from "@/lib/chat/assistant";

export async function POST(request: Request) {
  const { user, response } = await requireApiAdmin();

  if (response) {
    return response;
  }

  const parsed = chatTestInputSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Teste invalido." }, { status: 400 });
  }

  const answer = await answerFromStoreData({
    message: parsed.data.message,
    pathname: parsed.data.pathname,
    userId: user?.id
  });

  return NextResponse.json({ answer });
}
