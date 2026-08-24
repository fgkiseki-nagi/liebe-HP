import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(toolsDir, '..');
const outputDir = path.join(rootDir, 'dist');

const publicFiles = [
  '404.html',
  '_headers',
  'index.html',
  'llms.txt',
  'robots.txt',
  'script.js',
  'sitemap.xml',
  'styles.css',
];

const publicDirectories = [
  'about',
  'access',
  'area',
  'assets',
  'column',
  'contact',
  'facilities',
  'faq',
  'group',
  'home-care',
  'partners',
  'privacy',
];

function shouldSkip(name) {
  return name === '.DS_Store' || name.startsWith('._');
}

function copyEntry(source, destination) {
  const stat = fs.lstatSync(source);
  if (stat.isSymbolicLink()) {
    throw new Error(`Refusing to publish symbolic link: ${path.relative(rootDir, source)}`);
  }
  if (stat.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });
    for (const entry of fs.readdirSync(source).sort()) {
      if (shouldSkip(entry)) continue;
      copyEntry(path.join(source, entry), path.join(destination, entry));
    }
    return;
  }
  if (!stat.isFile()) {
    throw new Error(`Unsupported public entry: ${path.relative(rootDir, source)}`);
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

if (path.dirname(outputDir) !== rootDir || path.basename(outputDir) !== 'dist') {
  throw new Error(`Unsafe output directory: ${outputDir}`);
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const relativePath of [...publicFiles, ...publicDirectories]) {
  const source = path.join(rootDir, relativePath);
  if (!fs.existsSync(source)) throw new Error(`Required public entry is missing: ${relativePath}`);
  copyEntry(source, path.join(outputDir, relativePath));
}

const builtFiles = [];
function inventory(directory, relative = '') {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const nextRelative = path.join(relative, entry.name);
    if (entry.isDirectory()) inventory(path.join(directory, entry.name), nextRelative);
    else if (entry.isFile()) builtFiles.push(nextRelative);
  }
}
inventory(outputDir);

const htmlCount = builtFiles.filter((file) => file.endsWith('.html')).length;
if (htmlCount !== 27) throw new Error(`Expected 27 HTML files in dist, found ${htmlCount}`);

const totalBytes = builtFiles.reduce(
  (sum, relativePath) => sum + fs.statSync(path.join(outputDir, relativePath)).size,
  0,
);

console.log(
  `Built ${builtFiles.length} public files (${htmlCount} HTML, ${totalBytes.toLocaleString('en-US')} bytes) in dist/.`,
);
