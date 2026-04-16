import fs from "node:fs";
import path from "node:path";
import { catalogMediaPrompts, homeMediaPrompts } from "../src/lib/catalog/media-prompts";

const output = {
  generatedAt: new Date().toISOString(),
  products: catalogMediaPrompts,
  home: homeMediaPrompts
};

const target = path.join(process.cwd(), "docs", "media-manifest.json");
fs.writeFileSync(target, JSON.stringify(output, null, 2));

console.log(`Manifesto salvo em ${target}`);
