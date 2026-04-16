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
