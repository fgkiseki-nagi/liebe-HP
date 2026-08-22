import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(toolsDir, '..');
const config = JSON.parse(fs.readFileSync(path.join(rootDir, 'site.config.json'), 'utf8'));
const baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl : `${config.baseUrl}/`;
const basePath = new URL(baseUrl).pathname;
const ignored = new Set(['.git', 'liebeHP', 'references', 'partials', 'tools']);

function walk(dir, relative = '') {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name) || entry.name.startsWith('._')) continue;
    const absolute = path.join(dir, entry.name);
    const nextRelative = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute, nextRelative));
    else if (entry.isFile()) files.push(nextRelative);
  }
  return files;
}

function count(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'));
  return match ? match[1] : null;
}

function stripQuery(value) {
  return value.split('?')[0];
}

function decode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function resolveLocal(reference, sourceRelative) {
  if (!reference || /^(?:mailto:|tel:|data:|javascript:)/i.test(reference)) return null;

  let value = reference;
  let fromSiteRoot = false;
  if (/^https?:\/\//i.test(value)) {
    if (!value.startsWith(baseUrl)) return null;
    value = value.slice(baseUrl.length);
    fromSiteRoot = true;
  } else if (value.startsWith('/')) {
    if (!value.startsWith(basePath)) return null;
    value = value.slice(basePath.length);
    fromSiteRoot = true;
  }

  const [rawPath, rawFragment = ''] = value.split('#', 2);
  const fragment = decode(rawFragment);
  const cleanPath = decode(stripQuery(rawPath));
  const sourceDir = fromSiteRoot ? '.' : path.dirname(sourceRelative);
  let targetRelative = cleanPath
    ? path.normalize(path.join(sourceDir, cleanPath))
    : sourceRelative;

  if (targetRelative.startsWith('..')) return { invalidTraversal: true, reference };
  let targetAbsolute = path.join(rootDir, targetRelative);
  if (fs.existsSync(targetAbsolute) && fs.statSync(targetAbsolute).isDirectory()) {
    targetRelative = path.join(targetRelative, 'index.html');
    targetAbsolute = path.join(rootDir, targetRelative);
  } else if (cleanPath.endsWith('/')) {
    targetRelative = path.join(targetRelative, 'index.html');
    targetAbsolute = path.join(rootDir, targetRelative);
  }

  return { fragment, reference, targetAbsolute, targetRelative };
}

const allFiles = walk(rootDir);
const htmlFiles = allFiles.filter((file) => file.endsWith('.html')).sort();
const errors = [];
const titles = new Map();
const descriptions = new Map();
let inlineStyles = 0;
let checkedReferences = 0;

const spritePath = path.join(rootDir, 'assets', 'icons', 'sprite.svg');
const spriteSource = fs.existsSync(spritePath) ? fs.readFileSync(spritePath, 'utf8') : '';
const spriteIds = new Set([...spriteSource.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));

for (const relativePath of htmlFiles) {
  const source = fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
  const prefix = `${relativePath}:`;
  const route = relativePath === 'index.html' ? '' : relativePath.replace(/index\.html$/, '').split(path.sep).join('/');
  const expectedUrl = new URL(route, baseUrl).href;
  const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicateIds.length) errors.push(`${prefix} duplicate id(s): ${duplicateIds.join(', ')}`);

  if (count(source, /<main\b/g) !== 1) errors.push(`${prefix} expected exactly one <main>`);
  if (count(source, /<h1\b/g) !== 1) errors.push(`${prefix} expected exactly one <h1>`);
  const summaryBlocks = source.match(/<summary\b[^>]*>[\s\S]*?<\/summary>/gi) || [];
  if (summaryBlocks.some((summary) => /<h[1-6]\b/i.test(summary))) {
    errors.push(`${prefix} heading element is nested inside <summary>`);
  }

  const title = source.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  if (!title) errors.push(`${prefix} missing <title>`);
  else {
    if (titles.has(title)) errors.push(`${prefix} duplicate title also used by ${titles.get(title)}`);
    titles.set(title, relativePath);
  }

  const description = source.match(/<meta name="description" content="([^"]+)"/i)?.[1]?.trim();
  if (!description) errors.push(`${prefix} missing meta description`);
  else {
    if (descriptions.has(description)) errors.push(`${prefix} duplicate description also used by ${descriptions.get(description)}`);
    descriptions.set(description, relativePath);
  }

  const canonicalCount = count(source, /<link\s+rel="canonical"/g);
  const canonical = source.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
  if (relativePath !== '404.html') {
    if (canonicalCount !== 1) errors.push(`${prefix} expected exactly one canonical URL`);
    else if (canonical !== expectedUrl) errors.push(`${prefix} canonical URL should be ${expectedUrl}`);
  }

  const ogUrl = source.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i)?.[1];
  if (ogUrl !== expectedUrl) errors.push(`${prefix} og:url should be ${expectedUrl}`);

  for (const img of source.match(/<img\b[^>]*>/gi) || []) {
    if (attribute(img, 'alt') === null) errors.push(`${prefix} image is missing alt attribute: ${img.slice(0, 100)}`);
    if (!attribute(img, 'width') || !attribute(img, 'height')) {
      errors.push(`${prefix} image is missing intrinsic width/height: ${img.slice(0, 100)}`);
    }
  }

  for (const script of source.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(script[1]);
    } catch (error) {
      errors.push(`${prefix} invalid JSON-LD: ${error.message}`);
    }
  }

  inlineStyles += count(source, /\sstyle="/g);

  for (const match of source.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const reference = match[1];
    const resolved = resolveLocal(reference, relativePath);
    if (!resolved) continue;
    checkedReferences += 1;
    if (resolved.invalidTraversal) {
      errors.push(`${prefix} reference escapes site root: ${reference}`);
      continue;
    }
    if (!fs.existsSync(resolved.targetAbsolute)) {
      errors.push(`${prefix} missing local target: ${reference}`);
      continue;
    }
    if (resolved.fragment) {
      const targetSource = fs.readFileSync(resolved.targetAbsolute, 'utf8');
      const escaped = resolved.fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(`\\bid="${escaped}"`).test(targetSource)) {
        errors.push(`${prefix} missing fragment #${resolved.fragment} in ${resolved.targetRelative}`);
      }
    }
  }

  for (const use of source.matchAll(/<use href="[^"]*sprite\.svg#([^"]+)"\/>/g)) {
    if (!spriteIds.has(use[1])) errors.push(`${prefix} icon symbol does not exist: ${use[1]}`);
  }
}

if (!spriteSource) errors.push('assets/icons/sprite.svg is missing');
if (spriteIds.size === 0) errors.push('assets/icons/sprite.svg has no symbols');

if (errors.length) {
  console.error(`Site check failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Site check passed: ${htmlFiles.length} HTML files, ${checkedReferences} local references, ${spriteIds.size} icon symbols.`);
console.log(`Informational: ${inlineStyles} inline style attribute(s) remain.`);
