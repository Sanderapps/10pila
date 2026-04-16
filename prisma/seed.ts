import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { catalogProducts } from "../src/lib/catalog/products";
import { resolveProductImageUrl } from "../src/lib/catalog/media";
import { slugify } from "../src/lib/utils/slug";

const prisma = new PrismaClient();

const products = catalogProducts.map((product) => ({
  ...product,
  imageUrl: resolveProductImageUrl(product.name, product.category, slugify(product.name))
}));

const coupons = [
  {
    code: "BEMVINDO10",
    type: "PERCENT" as const,
    value: 10,
    minOrderCents: 3000,
    firstPurchaseOnly: true
  },
  {
    code: "MENOS20",
    type: "FIXED" as const,
    value: 2000,
    minOrderCents: 6000,
    firstPurchaseOnly: false
  },
  {
    code: "FRETEGRATIS",
    type: "FREE_SHIPPING" as const,
    value: null,
    minOrderCents: 4500,
    firstPurchaseOnly: false
  },
  {
    code: "TESTEFRETE",
    type: "FREE_SHIPPING" as const,
    value: null,
    minOrderCents: 100,
    firstPurchaseOnly: false
  }
];

async function syncProducts() {
  const seededSlugs = new Set(products.map((product) => slugify(product.name)));

  for (const product of products) {
    const slug = slugify(product.name);
    const existing = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, stock: true }
    });

    if (existing) {
      const stockDelta = product.stock - existing.stock;

      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: product.name,
          description: product.description,
          imageUrl: product.imageUrl,
          category: product.category,
          specifications: product.specifications,
          priceCents: product.priceCents,
          promotionalCents: product.promotionalCents,
          stock: product.stock,
          active: true,
          featured: product.featured
        }
      });

      if (stockDelta !== 0) {
        await prisma.inventoryMovement.create({
          data: {
            productId: existing.id,
            type: "ADJUSTMENT",
            quantity: stockDelta,
            note: "Ajuste de estoque pelo seed do catalogo"
          }
        });
      }

      continue;
    }

    const saved = await prisma.product.create({
      data: {
        ...product,
        slug
      }
    });

    await prisma.inventoryMovement.create({
      data: {
        productId: saved.id,
        type: "SEED",
        quantity: product.stock,
        note: "Estoque inicial do seed"
      }
    });
  }

  const staleProducts = await prisma.product.findMany({
    where: {
      slug: { notIn: Array.from(seededSlugs) }
    },
    select: { id: true, slug: true }
  });

  for (const staleProduct of staleProducts) {
    const references = await prisma.orderItem.count({
      where: { productId: staleProduct.id }
    });

    if (references > 0) {
      await prisma.product.update({
        where: { id: staleProduct.id },
        data: {
          active: false,
          featured: false
        }
      });
      continue;
    }

    await prisma.inventoryMovement.deleteMany({
      where: { productId: staleProduct.id }
    });
    await prisma.cartItem.deleteMany({
      where: { productId: staleProduct.id }
    });
    await prisma.product.delete({
      where: { id: staleProduct.id }
    });
  }
}

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL ?? "admin@10pila.local";
  const password = process.env.ADMIN_SEED_PASSWORD ?? "change-me-before-deploy";

  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: {
      email,
      name: "Admin 10PILA",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(password, 12)
    }
  });

  await syncProducts();

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: coupon,
      create: coupon
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
