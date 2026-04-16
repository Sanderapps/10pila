import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { answerFromStoreData } from "@/lib/chat/assistant";
import { prisma } from "@/lib/db/prisma";

const chatSchema = z.object({
  sessionId: z.string().nullable().optional(),
  message: z.string().min(1).max(1000)
});

export async function POST(request: Request) {
  const parsed = chatSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Mensagem invalida." }, { status: 400 });
  }

  const user = await getCurrentUser();
  const session =
    parsed.data.sessionId
      ? await prisma.chatSession.findFirst({
          where: {
            id: parsed.data.sessionId,
            OR: [{ userId: user?.id }, { userId: null }]
          }
        })
      : await prisma.chatSession.create({ data: { userId: user?.id } });

  if (!session) {
    return NextResponse.json({ error: "Sessao de chat invalida." }, { status: 404 });
  }

  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: "user",
      content: parsed.data.message
    }
  });

  const reply = await answerFromStoreData(parsed.data.message, user?.id);

  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: "assistant",
      content: reply
    }
  });

  return NextResponse.json({ sessionId: session.id, reply });
}
