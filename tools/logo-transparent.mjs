// Turns the white-background logo PNGs into transparent, trimmed PNGs so they
// sit cleanly on the site's cream backgrounds.
//
// Usage (from /tools):  npm run logos
//
// The logos are a single ink color on white, so each pixel is
// alpha * INK + (1 - alpha) * WHITE. We solve for alpha per pixel and repaint
// it in the pure ink color, which keeps the antialiased edges smooth.

import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const IMAGES = path.resolve(here, "../images");

const INK = [90, 93, 19]; // #5A5D13
const JOBS = [
  ["newlogo.png", "logo-wordmark.png"],
  ["newlogo_tagline.png", "logo-full.png"],
];

for (const [src, out] of JOBS) {
  const { data, info } = await sharp(path.join(IMAGES, src))
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    let a = 0;
    for (let c = 0; c < 3; c++) {
      a = Math.max(a, (255 - data[i + c]) / (255 - INK[c]));
    }
    rgba[j] = INK[0];
    rgba[j + 1] = INK[1];
    rgba[j + 2] = INK[2];
    rgba[j + 3] = Math.round(Math.min(1, a) * 255);
  }

  const result = await sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim()
    .png({ compressionLevel: 9 })
    .toFile(path.join(IMAGES, out));

  console.log(`${src} -> ${out} (${result.width}x${result.height})`);
}
