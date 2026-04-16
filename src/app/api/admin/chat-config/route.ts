import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/api";
import { chatConfigInputSchema, zodFieldErrors } from "@/lib/admin/chat-config-input";
import { getChatAssistantConfig } from "@/lib/chat/config";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const { response } = await requireApiAdmin();

  if (response) {
    return response;
  }

  const config = await getChatAssistantConfig();
  return NextResponse.json({ config });
}

export async function PATCH(request: Request) {
  const { response } = await requireApiAdmin();

  if (response) {
    return response;
  }

  const parsed = chatConfigInputSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Configuracao invalida.", fieldErrors: zodFieldErrors(parsed.error) },
      { status: 400 }
    );
  }

  try {
    const config = await prisma.chatAssistantConfig.upsert({
      where: { singletonKey: "default" },
      update: {
        primaryProvider: parsed.data.primaryProvider,
        fallbackProvider1: parsed.data.fallbackProvider1 ?? null,
        fallbackProvider2: parsed.data.fallbackProvider2 ?? null,
        groqModel: parsed.data.groqModel || null,
        geminiModel: parsed.data.geminiModel || null,
        openRouterModel: parsed.data.openRouterModel || null,
        temperature: parsed.data.temperature,
        maxOutputTokens: parsed.data.maxOutputTokens,
        assistantMode: parsed.data.assistantMode
      },
      create: {
        singletonKey: "default",
        primaryProvider: parsed.data.primaryProvider,
        fallbackProvider1: parsed.data.fallbackProvider1 ?? null,
        fallbackProvider2: parsed.data.fallbackProvider2 ?? null,
        groqModel: parsed.data.groqModel || null,
        geminiModel: parsed.data.geminiModel || null,
        openRouterModel: parsed.data.openRouterModel || null,
        temperature: parsed.data.temperature,
        maxOutputTokens: parsed.data.maxOutputTokens,
        assistantMode: parsed.data.assistantMode
      }
    });

    return NextResponse.json({ config });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return NextResponse.json(
        { error: "A migration do assistente ainda nao foi aplicada. Rode prisma deploy antes de salvar." },
        { status: 503 }
      );
    }

    throw error;
  }
}
