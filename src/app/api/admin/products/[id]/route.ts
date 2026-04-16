import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/api";
import {
  productDataFromInput,
  productInputSchema,
  zodFieldErrors
} from "@/lib/admin/product-input";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireApiAdmin();

  if (response) {
    return response;
  }

  const { id } = await params;
  const parsed = productInputSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Produto invalido.", fieldErrors: zodFieldErrors(parsed.error) },
      { status: 400 }
    );
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: productDataFromInput(parsed.data)
    });

    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error && error.message.includes("Unique") ? "Slug ja esta em uso." : "Falha ao atualizar produto." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireApiAdmin();

  if (response) {
    return response;
  }

  const { id } = await params;
  const orderItems = await prisma.orderItem.count({ where: { productId: id } });

  if (orderItems > 0) {
    const product = await prisma.product.update({
      where: { id },
      data: { active: false }
    });

    return NextResponse.json({
      product,
      mode: "deactivated",
      message: "Produto possui pedidos e foi inativado."
    });
  }

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true, mode: "deleted" });
}
