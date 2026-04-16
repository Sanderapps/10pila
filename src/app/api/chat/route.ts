import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { answerFromStoreData } from "@/lib/chat/assistant";
import { prisma } from "@/lib/db/prisma";

const chatSchema = z.object({
  sessionId: z.string().nullable().optional(),
  message: z.string().min(1).max(1000),
  currentProductSlug: z.string().optional(),
  pathname: z.string().optional()
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

  try {
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "user",
        content: parsed.data.message
      }
    });

    const history = await prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "desc" },
      take: 8
    });

    const answer = await answerFromStoreData({
      message: parsed.data.message,
      userId: user?.id,
      currentProductSlug: parsed.data.currentProductSlug,
      pathname: parsed.data.pathname,
      history: history.reverse().map((entry) => ({
        role: entry.role === "assistant" ? "assistant" : "user",
        content: entry.content
      }))
    });

    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "assistant",
        content: answer.reply
      }
    });

    return NextResponse.json({ sessionId: session.id, ...answer });
  } catch (error) {
    console.error("[chat] route failed", {
      message: error instanceof Error ? error.message : "unknown"
    });

    return NextResponse.json(
      {
        sessionId: session.id,
        reply: "O chat tropeçou aqui. Tenta de novo que eu volto pro balcão.",
        products: [],
        quickActions: ["ver promocoes", "mais barato"],
        source: "fallback",
        fallbackReason: "provider_error"
      },
      { status: 500 }
    );
  }
}
