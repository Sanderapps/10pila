import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/auth/api";
import { adjustStock } from "@/lib/inventory/stock";

const inventorySchema = z.object({
  productId: z.string(),
  quantity: z.number().int(),
  note: z.string().optional()
});

export async function POST(request: Request) {
  const { response } = await requireApiAdmin();

  if (response) {
    return response;
  }

  const parsed = inventorySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Ajuste invalido." }, { status: 400 });
  }

  try {
    await adjustStock(parsed.data.productId, parsed.data.quantity, parsed.data.note);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha no estoque." },
      { status: 400 }
    );
  }
}
