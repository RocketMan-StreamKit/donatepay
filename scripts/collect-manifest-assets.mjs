/**
 * Copies installable addon files into a release directory based on manifest.json.
 * Includes built index.js from dist/ when present.
 */
import fs from 'fs';
import path from 'path';

const outDir = process.argv[2] || 'release';
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

/** @type {Set<string>} */
const files = new Set(['manifest.json']);

if (manifest.icon) {
  files.add(manifest.icon);
}
if (manifest.web) {
  files.add(manifest.web);
}
if (Array.isArray(manifest.web_contents)) {
  for (const entry of manifest.web_contents) {
    files.add(entry);
  }
}
if (manifest.overlay) {
  if (manifest.overlay.audio) {
    files.add(manifest.overlay.audio);
  }
  if (manifest.overlay.video) {
    files.add(manifest.overlay.video);
  }
}

fs.mkdirSync(outDir, { recursive: true });

if (fs.existsSync('dist/index.js')) {
  fs.copyFileSync('dist/index.js', path.join(outDir, 'index.js'));
}

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required file: ${file}`);
    process.exit(1);
  }
  const dest = path.join(outDir, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(file, dest);
  console.log(`Copied ${file}`);
}

console.log(`Release assets collected in ${outDir}/`);
