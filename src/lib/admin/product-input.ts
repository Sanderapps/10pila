import { Prisma } from "@prisma/client";
import { z } from "zod";
import { decimalStringToCents } from "@/lib/utils/money";
import { slugify } from "@/lib/utils/slug";

function isValidImagePath(value: string) {
  if (value.startsWith("/")) {
    return /^\/[A-Za-z0-9/_\-\.]+$/.test(value);
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export const productInputSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome."),
  slug: z.string().trim().optional(),
  description: z.string().trim().min(10, "Descreva melhor o produto."),
  imageUrl: z
    .string()
    .trim()
    .refine(isValidImagePath, "Informe uma URL valida ou um caminho local como /catalog/products/item.webp."),
  category: z.string().trim().optional(),
  specifications: z.string().optional(),
  price: z.string().trim().min(1, "Informe o preco."),
  promotionalPrice: z.string().optional(),
  stock: z.string().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional()
});

export const productCreateInputSchema = productInputSchema.extend({
  stock: z.string().trim().min(1, "Informe o estoque inicial.")
});

export function parseSpecifications(input?: string) {
  const lines = String(input ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  return Object.fromEntries(
    lines.map((line) => {
      const [key, ...value] = line.split(":");
      return [key.trim(), value.join(":").trim() || "sim"];
    })
  ) as Prisma.InputJsonObject;
}

export function productDataFromInput(input: z.infer<typeof productInputSchema>) {
  const slug = input.slug ? slugify(input.slug) : slugify(input.name);

  return {
    name: input.name,
    slug,
    description: input.description,
    imageUrl: input.imageUrl,
    category: input.category || null,
    specifications: parseSpecifications(input.specifications) ?? Prisma.JsonNull,
    priceCents: decimalStringToCents(input.price),
    promotionalCents: input.promotionalPrice
      ? decimalStringToCents(input.promotionalPrice)
      : null,
    active: input.active ?? true,
    featured: input.featured ?? false
  };
}

export function zodFieldErrors(error: z.ZodError) {
  return Object.fromEntries(error.issues.map((issue) => [issue.path.join("."), issue.message]));
}
