import {
  AIAssistantMode,
  AIProvider,
  Prisma,
  type ChatAssistantConfig
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const DEFAULT_CHAT_CONFIG = {
  primaryProvider: AIProvider.GEMINI,
  fallbackProvider1: AIProvider.GROQ,
  fallbackProvider2: AIProvider.OPENROUTER,
  groqModel: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview",
  openRouterModel: process.env.OPENROUTER_MODEL || "google/gemma-3-12b-it:free",
  temperature: 0.32,
  maxOutputTokens: 360,
  assistantMode: AIAssistantMode.SALES
} satisfies Omit<ChatAssistantConfig, "id" | "singletonKey" | "createdAt" | "updatedAt">;

export type StoredChatConfig = Omit<ChatAssistantConfig, "id" | "singletonKey" | "createdAt" | "updatedAt">;

function defaultConfigRecord(): ChatAssistantConfig {
  const now = new Date();

  return {
    id: "default-chat-config",
    singletonKey: "default",
    ...DEFAULT_CHAT_CONFIG,
    createdAt: now,
    updatedAt: now
  };
}

export async function getChatAssistantConfig(): Promise<ChatAssistantConfig> {
  try {
    return await prisma.chatAssistantConfig.upsert({
      where: { singletonKey: "default" },
      update: {},
      create: {
        singletonKey: "default",
        ...DEFAULT_CHAT_CONFIG
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return defaultConfigRecord();
    }

    throw error;
  }
}

export function providerOrder(config: StoredChatConfig) {
  return [
    config.primaryProvider,
    config.fallbackProvider1,
    config.fallbackProvider2
  ].filter((value, index, list): value is AIProvider => Boolean(value) && list.indexOf(value) === index);
}

export function modelForProvider(provider: AIProvider, config: StoredChatConfig) {
  if (provider === AIProvider.GROQ) {
    return config.groqModel || DEFAULT_CHAT_CONFIG.groqModel;
  }

  if (provider === AIProvider.OPENROUTER) {
    return config.openRouterModel || DEFAULT_CHAT_CONFIG.openRouterModel;
  }

  return config.geminiModel || DEFAULT_CHAT_CONFIG.geminiModel;
}

export function assistantModeLabel(mode: AIAssistantMode) {
  if (mode === AIAssistantMode.AMIGAVEL) {
    return "amigavel";
  }

  if (mode === AIAssistantMode.SUPPORT) {
    return "suporte";
  }

  if (mode === AIAssistantMode.BALANCED) {
    return "equilibrado";
  }

  return "vendas";
}
