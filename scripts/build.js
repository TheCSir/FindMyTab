const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const src = path.join(root, "src");
const out = path.join(root, "dist");

// Files to include in the extension bundle
const files = [
  "manifest.json",
  "popup/popup.html",
  "popup/popup.css",
  "popup/popup.js",
  "options/options.html",
  "options/options.css",
  "options/options.js",
  "shared/defaults.js",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png",
];

// Clean output directory
if (fs.existsSync(out)) {
  fs.rmSync(out, { recursive: true });
}

// Copy files
let copied = 0;
for (const file of files) {
  const srcFile = path.join(src, file);
  const dstFile = path.join(out, file);

  if (!fs.existsSync(srcFile)) {
    console.error("  MISSING: " + file);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(dstFile), { recursive: true });
  fs.copyFileSync(srcFile, dstFile);
  copied++;
}

// Verify manifest references
const manifest = JSON.parse(fs.readFileSync(path.join(out, "manifest.json"), "utf8"));
const refs = [
  manifest.action.default_popup,
  ...Object.values(manifest.action.default_icon || {}),
  ...Object.values(manifest.icons || {}),
  manifest.options_ui.page,
];

for (const ref of [...new Set(refs)]) {
  if (!fs.existsSync(path.join(out, ref))) {
    console.error("  Manifest references missing file: " + ref);
    process.exit(1);
  }
}

console.log("Build complete: " + copied + " files -> dist/");
console.log("Load the dist/ folder in chrome://extensions with Developer Mode enabled.");
