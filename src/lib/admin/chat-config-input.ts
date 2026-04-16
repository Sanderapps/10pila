import { AIAssistantMode, AIProvider } from "@prisma/client";
import { z } from "zod";

const providerField = z.nativeEnum(AIProvider).nullable().optional();

export const chatConfigInputSchema = z.object({
  primaryProvider: z.nativeEnum(AIProvider),
  fallbackProvider1: providerField,
  fallbackProvider2: providerField,
  groqModel: z.string().trim().optional(),
  geminiModel: z.string().trim().optional(),
  openRouterModel: z.string().trim().optional(),
  temperature: z.coerce.number().min(0).max(1),
  maxOutputTokens: z.coerce.number().int().min(120).max(800),
  assistantMode: z.nativeEnum(AIAssistantMode)
});

export const chatTestInputSchema = z.object({
  message: z.string().trim().min(1).max(300),
  pathname: z.string().trim().optional()
});

export function zodFieldErrors(error: z.ZodError) {
  return Object.fromEntries(error.issues.map((issue) => [issue.path.join("."), issue.message]));
}
