import fs from "node:fs";
import path from "node:path";
import type { CatalogProduct } from "./products";
import { catalogPlaceholderDataUrl } from "./visuals";

const PRODUCT_IMAGE_EXTENSIONS = ["webp", "png", "jpg", "jpeg", "avif"] as const;
const HERO_MEDIA_EXTENSIONS = ["webp", "png", "jpg", "jpeg", "avif"] as const;

function publicAssetExists(assetPath: string, workspaceRoot = process.cwd()) {
  return fs.existsSync(path.join(workspaceRoot, "public", assetPath.replace(/^\//, "")));
}

export function productImageCandidates(slug: string) {
  return PRODUCT_IMAGE_EXTENSIONS.map((extension) => `/catalog/products/${slug}.${extension}`);
}

export function resolveProductAssetPath(slug: string, workspaceRoot = process.cwd()) {
  return productImageCandidates(slug).find((candidate) => publicAssetExists(candidate, workspaceRoot)) ?? null;
}

export function resolveProductImageUrl(
  name: string,
  category: string,
  slug: string,
  workspaceRoot = process.cwd()
) {
  return resolveProductAssetPath(slug, workspaceRoot) ?? catalogPlaceholderDataUrl(name, category);
}

export function resolveHomePosterPath(slug: string, workspaceRoot = process.cwd()) {
  return (
    HERO_MEDIA_EXTENSIONS.map((extension) => `/home/posters/${slug}.${extension}`).find((candidate) =>
      publicAssetExists(candidate, workspaceRoot)
    ) ?? null
  );
}

export function resolveHomeVideoPath(slug: string, workspaceRoot = process.cwd()) {
  return ["/home/video/" + slug + ".mp4", "/home/video/" + slug + ".webm"].find((candidate) =>
    publicAssetExists(candidate, workspaceRoot)
  ) ?? null;
}

function specSummary(specifications: Record<string, string>) {
  return Object.entries(specifications)
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}

export function buildProductImagePrompt(product: CatalogProduct & { slug: string }) {
  return [
    "Use case: product-mockup",
    "Asset type: ecommerce catalog product image",
    `Primary request: hero image for "${product.name}"`,
    "Scene/backdrop: premium dark-commerce set, matte graphite surface, controlled neon reflections, clean studio mood, no clutter",
    `Subject: ${product.name}, a low-cost useful tech find, shown clearly and honestly as the hero object`,
    "Style/medium: photorealistic product photography, polished ecommerce lighting, realistic scale, no cartoon look",
    "Composition/framing: centered or slightly offset object, enough breathing room for crop reuse in cards and product page, strong silhouette, 4:3 friendly",
    "Lighting/mood: soft key light, cyan and green accent rim lights, subtle shadow, premium but accessible",
    "Color palette: dark graphite, black, controlled cyan, green neon accents, no purple dominance",
    `Materials/textures: highlight the real object materials; ${specSummary(product.specifications)}`,
    `Constraints: the product must match this description: ${product.description}`,
    "Avoid: text, watermark, logos, extra accessories not implied by the product, hands, humans, fake brand markings, cluttered background"
  ].join("\n");
}

export function buildProductVideoPrompt(product: CatalogProduct & { slug: string }) {
  return [
    `8-second looping promo clip for "${product.name}"`,
    "Show the object floating or resting in a clean dark-commerce set with subtle camera drift",
    "Use soft cyan and green highlights, realistic materials, short reveal passes, no text overlay",
    "End state must loop cleanly back to the first frame",
    "No people, no voice, no aggressive particles, no exaggerated gaming aesthetic"
  ].join(". ");
}

export const homeKeyframePrompts = [
  {
    slug: "hero-achados-tech",
    title: "Hero principal",
    posterPath: "/home/posters/hero-achados-tech.webp",
    videoPath: "/home/video/hero-achados-tech.mp4",
    prompt: [
      "Use case: stylized-concept",
      "Asset type: homepage hero poster",
      "Primary request: a cinematic composition of low-cost tech finds laid out like an irresistible drop",
      "Scene/backdrop: dark premium commerce scene with matte surfaces, subtle reflections, layered gadgets for mesa, celular, mochila and USB utility",
      "Style/medium: photorealistic 3D or polished product-art hybrid, premium but accessible",
      "Composition/framing: wide hero layout with negative space for title on the left, focal cluster on the right",
      "Lighting/mood: controlled neon cyan and green glows, soft dramatic vignette, energetic but clean",
      "Color palette: black, graphite, cyan, green, tiny touches of warm light only where needed",
      "Avoid: text, logos baked into the image, purple-heavy palette, clutter, anime, exaggerated gamer setup"
    ].join("\n")
  },
  {
    slug: "promo-ate-9-90",
    title: "Faixa achados ate R$ 9,90",
    posterPath: "/home/posters/promo-ate-9-90.webp",
    videoPath: "/home/video/promo-ate-9-90.mp4",
    prompt: [
      "Use case: product-mockup",
      "Asset type: home promo strip poster",
      "Primary request: a small cluster of ultra-cheap useful tech finds with a punchy impulse-buy energy",
      "Scene/backdrop: dark shelf or floating layout, clean composition, compact inexpensive accessories",
      "Style/medium: polished ecommerce campaign still",
      "Composition/framing: horizontal banner with room for copy",
      "Lighting/mood: quick energetic highlights, credible textures, no visual noise",
      "Avoid: text, labels in image, premium luxury vibe, clutter"
    ].join("\n")
  }
];
