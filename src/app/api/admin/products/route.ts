import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/api";
import {
  productCreateInputSchema,
  productDataFromInput,
  zodFieldErrors
} from "@/lib/admin/product-input";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  const { response } = await requireApiAdmin();

  if (response) {
    return response;
  }

  const parsed = productCreateInputSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Produto invalido.", fieldErrors: zodFieldErrors(parsed.error) },
      { status: 400 }
    );
  }

  const stock = Number.parseInt(parsed.data.stock ?? "0", 10);

  if (!Number.isInteger(stock) || stock < 0) {
    return NextResponse.json(
      { error: "Estoque inicial invalido.", fieldErrors: { stock: "Use zero ou um numero positivo." } },
      { status: 400 }
    );
  }

  try {
    const product = await prisma.product.create({
      data: {
        ...productDataFromInput(parsed.data),
        stock
      }
    });

    await prisma.inventoryMovement.create({
      data: {
        productId: product.id,
        type: "ADJUSTMENT",
        quantity: product.stock,
        note: "Cadastro inicial pelo admin"
      }
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error && error.message.includes("Unique") ? "Slug ja esta em uso." : "Falha ao criar produto." },
      { status: 400 }
    );
  }
}
