import fs from "node:fs";
import path from "node:path";
import { catalogProducts } from "../src/lib/catalog/products";
import { catalogPromptBatches, catalogMediaPrompts, homeMediaPrompts } from "../src/lib/catalog/media-prompts";
import { resolveHomePosterPath, resolveProductAssetPath } from "../src/lib/catalog/media";
import { slugify } from "../src/lib/utils/slug";

const cwd = process.cwd();

const products = catalogProducts.map((product) => {
  const slug = slugify(product.name);
  const promptEntry = catalogMediaPrompts.find((item) => item.slug === slug);
  const existingAsset = resolveProductAssetPath(slug, cwd);

  return {
    name: product.name,
    slug,
    category: product.category,
    priceCents: product.promotionalCents ?? product.priceCents,
    description: product.description,
    expectedFile: `${slug}.webp`,
    expectedPublicPath: `/catalog/products/${slug}.webp`,
    expectedFilePath: `public/catalog/products/${slug}.webp`,
    existingAsset,
    status: existingAsset ? "present" : "missing",
    prompt: promptEntry?.imagePrompt ?? ""
  };
});

const home = homeMediaPrompts.map((item) => ({
  slug: item.slug,
  title: item.title,
  expectedPublicPath: item.posterPath,
  expectedFilePath: `public${item.posterPath}`,
  existingAsset: resolveHomePosterPath(item.slug, cwd),
  status: resolveHomePosterPath(item.slug, cwd) ? "present" : "missing",
  purpose:
    item.slug === "hero-achados-tech"
      ? "hero principal da home"
      : item.slug === "promo-ate-9-90"
        ? "bloco promocional de achados ate R$ 9,90"
        : item.slug === "promo-ate-19-90"
          ? "bloco promocional de achados ate R$ 19,90"
          : item.slug === "indique-e-ganhe-10"
            ? "campanha de indicacao"
            : item.slug === "social-drops-e-novidades"
              ? "bloco social e novidades"
              : item.slug === "bugigangas-uteis"
                ? "bloco comercial de bugigangas uteis"
                : "bloco destaque da home",
  recommendedSize: item.slug === "hero-achados-tech" ? "1600x900" : "1600x900",
  prompt: item.prompt
}));

const batches = catalogPromptBatches.map((batch) => ({
  name: batch.name,
  products: batch.products.map((product) => ({
    slug: product.slug,
    name: product.name,
    expectedPublicPath: product.imagePath,
    expectedFilePath: `public${product.imagePath}`,
    prompt: product.imagePrompt
  }))
}));

const output = {
  generatedAt: new Date().toISOString(),
  conventions: {
    productImages: {
      format: "WEBP",
      resolution: "1200x1200",
      path: "public/catalog/products/<slug>.webp"
    },
    homePosters: {
      format: "WEBP",
      resolution: "1600x900",
      path: "public/home/posters/<slug>.webp"
    }
  },
  summary: {
    totalProducts: products.length,
    presentProductAssets: products.filter((item) => item.status === "present").length,
    missingProductAssets: products.filter((item) => item.status === "missing").length,
    presentHomeAssets: home.filter((item) => item.status === "present").length,
    missingHomeAssets: home.filter((item) => item.status === "missing").length
  },
  existingFiles: {
    products: products.filter((item) => item.status === "present").map((item) => item.expectedFilePath),
    home: home.filter((item) => item.status === "present").map((item) => item.expectedFilePath)
  },
  missingFiles: {
    products: products.filter((item) => item.status === "missing").map((item) => item.expectedFilePath),
    home: home.filter((item) => item.status === "missing").map((item) => item.expectedFilePath)
  },
  products,
  home,
  batches
};

const target = path.join(cwd, "docs", "static-media-manifest.json");
fs.writeFileSync(target, JSON.stringify(output, null, 2));
console.log(`Manifesto estatico salvo em ${target}`);
