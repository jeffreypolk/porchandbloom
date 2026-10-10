// Converts originals in ../OriginalImages into web-sized WebP files in ../images/work.
// Usage (from the tools folder): npm run photos
// Re-running skips photos that are already converted; pass --force to redo them all.

import { readdir, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "OriginalImages");
const OUT = path.join(root, "images", "work");
const WIDTHS = [800, 1600];
const QUALITY = 80;
const EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);
const force = process.argv.includes("--force");

// "My Porch Photo.PNG" -> "my-porch-photo"
const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

async function isUpToDate(srcFile, outFile) {
  try {
    return (await stat(outFile)).mtimeMs >= (await stat(srcFile)).mtimeMs;
  } catch {
    return false;
  }
}

await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter((f) =>
  EXTENSIONS.has(path.extname(f).toLowerCase())
);

if (files.length === 0) {
  console.log(`No photos found in ${SRC}`);
  process.exit(0);
}

for (const file of files) {
  const srcFile = path.join(SRC, file);
  const slug = slugify(path.parse(file).name);
  const srcSize = (await stat(srcFile)).size;

  for (const width of WIDTHS) {
    const outFile = path.join(OUT, `${slug}-${width}.webp`);
    if (!force && (await isUpToDate(srcFile, outFile))) {
      console.log(`skip  ${path.basename(outFile)}`);
      continue;
    }

    // rotate() applies the phone's EXIF orientation; metadata (including GPS) is stripped by default.
    const info = await sharp(srcFile)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(outFile);

    console.log(
      `done  ${path.basename(outFile)}  ${info.width}x${info.height}  ${kb(srcSize)} -> ${kb(info.size)}`
    );
  }
}
