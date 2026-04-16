CREATE TYPE "AIProvider" AS ENUM ('GROQ', 'GEMINI', 'OPENROUTER');

CREATE TYPE "AIAssistantMode" AS ENUM ('SALES', 'SUPPORT', 'BALANCED');

CREATE TABLE "ChatAssistantConfig" (
    "id" TEXT NOT NULL,
    "singletonKey" TEXT NOT NULL DEFAULT 'default',
    "primaryProvider" "AIProvider" NOT NULL DEFAULT 'GEMINI',
    "fallbackProvider1" "AIProvider",
    "fallbackProvider2" "AIProvider",
    "groqModel" TEXT,
    "geminiModel" TEXT,
    "openRouterModel" TEXT,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.35,
    "maxOutputTokens" INTEGER NOT NULL DEFAULT 360,
    "assistantMode" "AIAssistantMode" NOT NULL DEFAULT 'SALES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatAssistantConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChatAssistantConfig_singletonKey_key" ON "ChatAssistantConfig"("singletonKey");
