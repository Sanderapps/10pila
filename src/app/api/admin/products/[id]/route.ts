import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/auth/api";
import { prisma } from "@/lib/db/prisma";
import { decimalStringToCents } from "@/lib/utils/money";
import { slugify } from "@/lib/utils/slug";

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  imageUrl: z.string().url(),
  price: z.string().min(1),
  promotionalPrice: z.string().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireApiAdmin();

  if (response) {
    return response;
  }

  const { id } = await params;
  const parsed = productSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Produto invalido." }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl,
      priceCents: decimalStringToCents(parsed.data.price),
      promotionalCents: parsed.data.promotionalPrice
        ? decimalStringToCents(parsed.data.promotionalPrice)
        : null,
      active: parsed.data.active ?? true,
      featured: parsed.data.featured ?? false
    }
  });

  return NextResponse.json({ product });
}
