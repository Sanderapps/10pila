import { NextResponse } from "next/server";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { requireApiAdmin } from "@/lib/auth/api";
import { prisma } from "@/lib/db/prisma";
import { markOrderPaidAndReduceStock } from "@/lib/inventory/stock";

const statusSchema = z.object({
  orderId: z.string(),
  status: z.nativeEnum(OrderStatus)
});

export async function PATCH(request: Request) {
  const { response } = await requireApiAdmin();

  if (response) {
    return response;
  }

  const parsed = statusSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Status invalido." }, { status: 400 });
  }

  try {
    if (parsed.data.status === "PAID") {
      await markOrderPaidAndReduceStock(parsed.data.orderId);
    } else {
      await prisma.order.update({
        where: { id: parsed.data.orderId },
        data: { status: parsed.data.status }
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar o status do pedido."
      },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId }
  });

  return NextResponse.json({ order });
}
