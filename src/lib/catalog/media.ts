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
    "Asset type: square ecommerce product image",
    `Primary request: realistic product photo for "${product.name}"`,
    "Scene/backdrop: clean dark-commerce backdrop, matte graphite base, subtle studio reflections, no clutter",
    `Subject: ${product.name}, shown alone as the clear hero object for a product card and product page`,
    "Style/medium: realistic ecommerce photography, polished but honest, no cartoon look, no exaggerated luxury styling",
    "Composition/framing: square 1:1, product centered, strong silhouette, enough negative space for mobile crop, focus total no produto",
    "Lighting/mood: modern studio lighting, strong readable contrast, soft key light, controlled cyan and green rim accents",
    "Color palette: black, graphite, neutral metallics, controlled cyan and green accents, no purple dominance",
    `Materials/textures: highlight the real object materials; ${specSummary(product.specifications)}`,
    `Constraints: the product must match this description: ${product.description}`,
    "Avoid: text, logo, watermark, people, hands, packaging, cables or accessories not implied by the item, fake brand markings, messy background, blurred subject"
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
  },
  {
    slug: "promo-ate-19-90",
    title: "Faixa achados ate R$ 19,90",
    posterPath: "/home/posters/promo-ate-19-90.webp",
    videoPath: "/home/video/promo-ate-19-90.mp4",
    prompt: [
      "Use case: product-mockup",
      "Asset type: home promo strip poster",
      "Primary request: a richer cluster of low-cost useful tech finds, still cheap, still impulse-friendly, with slightly broader variety than the ultra-cheap strip",
      "Scene/backdrop: clean dark-commerce scene, compact gadgets for celular, cabos, mesa and USB utility, no clutter",
      "Style/medium: polished ecommerce campaign still, realistic and sellable",
      "Composition/framing: wide horizontal banner with negative space for HTML copy overlay",
      "Lighting/mood: controlled cyan and green highlights, honest textures, contrast strong enough for mobile",
      "Avoid: text inside image, luxury premium mood, chaotic shelf, gamer excess, fake brands"
    ].join("\n")
  },
  {
    slug: "indique-e-ganhe-10",
    title: "Campanha de indicacao",
    posterPath: "/home/posters/indique-e-ganhe-10.webp",
    videoPath: "/home/video/indique-e-ganhe-10.mp4",
    prompt: [
      "Use case: campaign-poster",
      "Asset type: referral campaign banner",
      "Primary request: friendly ecommerce campaign art that suggests sharing useful cheap gadgets with a friend and earning a reward",
      "Scene/backdrop: dark clean background with two or three small tech finds arranged like a share-worthy gift cluster",
      "Style/medium: polished promo still, realistic product-forward composition, no people",
      "Composition/framing: horizontal banner with generous negative space for headline and CTA in HTML",
      "Lighting/mood: inviting, energetic, neon controlled, commercial but not loud",
      "Avoid: text baked in image, coins exploding, casino vibe, cartoon mascots, clutter"
    ].join("\n")
  },
  {
    slug: "social-drops-e-novidades",
    title: "Bloco social",
    posterPath: "/home/posters/social-drops-e-novidades.webp",
    videoPath: "/home/video/social-drops-e-novidades.mp4",
    prompt: [
      "Use case: social-commerce poster",
      "Asset type: social follow banner",
      "Primary request: a lively dark-commerce composition suggesting new drops, tiny useful gadgets and social discovery",
      "Scene/backdrop: compact desk-like arrangement with several cheap tech finds, subtle glow paths implying feed and discovery, no explicit app logos",
      "Style/medium: polished ecommerce editorial still, clean and mobile-friendly",
      "Composition/framing: wide banner with a visually stronger right side and clean breathing room for copy",
      "Lighting/mood: cyan and green accents, punchy but controlled, high readability on dark background",
      "Avoid: text in image, screenshots of social apps, people, chaotic collage, template look"
    ].join("\n")
  },
  {
    slug: "bugigangas-uteis",
    title: "Bloco bugigangas uteis",
    posterPath: "/home/posters/bugigangas-uteis.webp",
    videoPath: "/home/video/bugigangas-uteis.mp4",
    prompt: [
      "Use case: category-promo poster",
      "Asset type: utility gadgets campaign poster",
      "Primary request: a clean arrangement of tiny useful tech gadgets that feel cheap, clever and instantly buyable",
      "Scene/backdrop: matte graphite surface with compact helpers for mesa, mochila, cabos and celular, arranged neatly",
      "Style/medium: realistic ecommerce still with subtle art direction",
      "Composition/framing: horizontal poster with room for HTML headline on one side",
      "Lighting/mood: clean modern light, soft reflections, controlled neon accents, honest retail energy",
      "Avoid: text baked in image, luxury setup vibe, oversized gaming gear, clutter, people"
    ].join("\n")
  },
  {
    slug: "drop-da-semana",
    title: "Drop da semana",
    posterPath: "/home/posters/drop-da-semana.webp",
    videoPath: "/home/video/drop-da-semana.mp4",
    prompt: [
      "Use case: weekly-drop poster",
      "Asset type: featured drop banner",
      "Primary request: an eye-catching but clean composition of a few standout cheap tech finds selected as the week's drop",
      "Scene/backdrop: dark premium-commerce scene with a tighter curated cluster of 3 to 5 impulse-buy gadgets",
      "Style/medium: realistic campaign still, sharp product edges, subtle editorial polish",
      "Composition/framing: hero-like horizontal composition, product cluster offset to leave copy room",
      "Lighting/mood: stronger contrast, modern studio glow, retail urgency without looking spammy",
      "Avoid: text in image, sale stickers baked in, aggressive gamer effects, messy staging"
    ].join("\n")
  }
];
