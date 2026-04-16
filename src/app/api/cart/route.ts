import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const addSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).max(99).default(1)
});

const updateSchema = z.object({
  itemId: z.string(),
  quantity: z.number().int().min(1).max(99)
});

const deleteSchema = z.object({
  itemId: z.string()
});

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  }

  const items = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  }

  const parsed = addSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Item invalido." }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId }
  });

  if (!product?.active || product.stock <= 0) {
    return NextResponse.json({ error: "Produto indisponivel." }, { status: 400 });
  }

  const currentItem = await prisma.cartItem.findUnique({
    where: {
      userId_productId: {
        userId: user.id,
        productId: product.id
      }
    },
    select: { quantity: true }
  });
  const nextQuantity = (currentItem?.quantity ?? 0) + parsed.data.quantity;

  if (nextQuantity > product.stock) {
    return NextResponse.json(
      { error: `Estoque disponivel: ${product.stock}. Ajusta a quantidade e bora.` },
      { status: 400 }
    );
  }

  const item = await prisma.cartItem.upsert({
    where: {
      userId_productId: {
        userId: user.id,
        productId: product.id
      }
    },
    update: {
      quantity: { increment: parsed.data.quantity }
    },
    create: {
      userId: user.id,
      productId: product.id,
      quantity: parsed.data.quantity
    }
  });

  return NextResponse.json({ item });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  }

  const parsed = updateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Quantidade invalida." }, { status: 400 });
  }

  const cartItem = await prisma.cartItem.findFirst({
    where: { id: parsed.data.itemId, userId: user.id },
    include: { product: true }
  });

  if (!cartItem) {
    return NextResponse.json({ error: "Item nao encontrado." }, { status: 404 });
  }

  if (!cartItem.product.active || parsed.data.quantity > cartItem.product.stock) {
    return NextResponse.json(
      { error: `Estoque disponivel: ${cartItem.product.stock}.` },
      { status: 400 }
    );
  }

  const item = await prisma.cartItem.update({
    where: { id: cartItem.id },
    data: { quantity: parsed.data.quantity }
  });

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Login obrigatorio." }, { status: 401 });
  }

  const parsed = deleteSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Item invalido." }, { status: 400 });
  }

  await prisma.cartItem.deleteMany({
    where: { id: parsed.data.itemId, userId: user.id }
  });

  return NextResponse.json({ ok: true });
}
