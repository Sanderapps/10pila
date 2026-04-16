import { catalogProducts } from "./products";
import { buildProductImagePrompt, buildProductVideoPrompt, homeKeyframePrompts } from "./media";
import { slugify } from "../utils/slug";

export const catalogMediaPrompts = catalogProducts.map((product) => {
  const slug = slugify(product.name);

  return {
    slug,
    name: product.name,
    imagePath: `/catalog/products/${slug}.webp`,
    imagePrompt: buildProductImagePrompt({ ...product, slug }),
    videoPath: `/catalog/video/${slug}.mp4`,
    videoPrompt: buildProductVideoPrompt({ ...product, slug })
  };
});

export const homeMediaPrompts = homeKeyframePrompts;

export const catalogPromptBatches = [
  {
    name: "cabos-e-adaptadores",
    categories: ["Cabos e Adaptadores"]
  },
  {
    name: "celular-e-mobile",
    categories: ["Acessórios de Celular"]
  },
  {
    name: "mesa-e-setup-leve",
    categories: ["Organização de Mesa", "Itens Curiosos de Setup", "Suporte e Fixação"]
  },
  {
    name: "iluminacao-e-usb",
    categories: ["Iluminação Pequena", "Utilidades USB"]
  },
  {
    name: "limpeza-e-ferramentas",
    categories: ["Limpeza Tech", "Mini Ferramentas Tech"]
  },
  {
    name: "notebook-e-tablet",
    categories: ["Acessórios de Notebook"]
  },
  {
    name: "viagem-e-carro",
    categories: ["Viagem e Escritório", "Carro e Viagem"]
  },
  {
    name: "teste-e-excecoes",
    categories: ["Teste"]
  }
].map((batch) => ({
  ...batch,
  products: catalogMediaPrompts.filter((product) => {
    const original = catalogProducts.find((item) => slugify(item.name) === product.slug);
    return original ? batch.categories.includes(original.category) : false;
  })
}));
