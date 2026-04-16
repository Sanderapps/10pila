import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { slugify } from "../src/lib/utils/slug";

const prisma = new PrismaClient();

const products = [
  {
    name: "Mini Projetor Galaxy Pocket",
    description:
      "Projetor compacto para transformar qualquer parede em cinema improvisado de respeito.",
    imageUrl:
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=80",
    priceCents: 29990,
    promotionalCents: 24990,
    stock: 12,
    category: "Projetores",
    specifications: { resolucao: "720p", conexao: "HDMI/USB", uso: "cinema compacto" },
    featured: true
  },
  {
    name: "Teclado Mecânico Neon Switch",
    description:
      "Teclado mecânico compacto com RGB, switches táteis e vibe setup gamer sem exagero.",
    imageUrl:
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1200&q=80",
    priceCents: 18990,
    promotionalCents: null,
    stock: 18,
    category: "Setup",
    specifications: { layout: "compacto", iluminacao: "RGB", switch: "tatil" },
    featured: true
  },
  {
    name: "Fone Bluetooth Bass Drop",
    description:
      "Fone sem fio com cancelamento passivo, bateria longa e grave para aguentar o corre.",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    priceCents: 15990,
    promotionalCents: 12990,
    stock: 25,
    category: "Audio",
    specifications: { conexao: "Bluetooth", bateria: "longa duracao", isolamento: "passivo" },
    featured: true
  },
  {
    name: "Hub USB-C Mega Dock",
    description:
      "Hub USB-C com HDMI, leitor de cartão e portas extras para notebook parar de sofrer.",
    imageUrl:
      "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=1200&q=80",
    priceCents: 11990,
    promotionalCents: null,
    stock: 20,
    category: "Acessorios",
    specifications: { portas: "USB-C/HDMI", uso: "notebook", extras: "leitor de cartao" },
    featured: false
  },
  {
    name: "Power Bank Turbo 20000",
    description:
      "Bateria portátil de 20000 mAh para manter celular, fone e caos sob controle.",
    imageUrl:
      "https://images.pexels.com/photos/4526415/pexels-photo-4526415.jpeg?auto=compress&cs=tinysrgb&w=1200",
    priceCents: 14990,
    promotionalCents: 11990,
    stock: 16,
    category: "Energia",
    specifications: { capacidade: "20000 mAh", uso: "celular e acessorios", carregamento: "turbo" },
    featured: false
  },
  {
    name: "Mouse Gamer Zero Lag",
    description:
      "Mouse leve com sensor preciso, botões laterais e pegada confortável para trabalho e gameplay.",
    imageUrl:
      "https://images.unsplash.com/photo-1613141412501-9012977f1969?auto=format&fit=crop&w=1200&q=80",
    priceCents: 9990,
    promotionalCents: null,
    stock: 30,
    category: "Setup",
    specifications: { sensor: "preciso", botoes: "laterais", pegada: "leve" },
    featured: false
  }
];

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

  for (const product of products) {
    const slug = slugify(product.name);
    const existing = await prisma.product.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (existing) {
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
          featured: product.featured
        }
      });
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
