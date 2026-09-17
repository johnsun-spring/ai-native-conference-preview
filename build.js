#!/usr/bin/env node

/**
 * Build script: minifies CSS and JS files in-place using clean-css and terser.
 * Targets both the root site and the ai-native-conference-2025/ subdirectory.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import CleanCSS from 'clean-css';
import { minify as terserMinify } from 'terser';

const cssFiles = [
  'css/normalize.css',
  'css/webflow.css',
  'css/aibf-conference.webflow.css',
  'css/cookie-consent.css',
  'ai-native-conference-2025/css/normalize.css',
  'ai-native-conference-2025/css/webflow.css',
  'ai-native-conference-2025/css/ai-native-conference-site.webflow.css',
];

const jsFiles = [
  'js/content-loader.js',
  'js/cookie-consent.js',
  'js/webflow.js',
  'ai-native-conference-2025/js/webflow.js',
];

const cleanCSS = new CleanCSS({ level: 2, returnPromise: true });

async function minifyCSS(filePath) {
  if (!existsSync(filePath)) {
    console.warn(`  skipped (not found): ${filePath}`);
    return;
  }
  const source = await readFile(filePath, 'utf8');
  const result = await cleanCSS.minify(source);
  if (result.errors.length) {
    throw new Error(`CSS errors in ${filePath}: ${result.errors.join(', ')}`);
  }
  const saved = source.length - result.styles.length;
  const pct = ((saved / source.length) * 100).toFixed(1);
  await writeFile(filePath, result.styles, 'utf8');
  console.log(`  ${filePath} (saved ${pct}%)`);
}

async function minifyJS(filePath) {
  if (!existsSync(filePath)) {
    console.warn(`  skipped (not found): ${filePath}`);
    return;
  }
  const source = await readFile(filePath, 'utf8');
  const result = await terserMinify(source, { compress: true, mangle: true });
  if (!result.code) {
    throw new Error(`Terser produced no output for ${filePath}`);
  }
  const saved = source.length - result.code.length;
  const pct = ((saved / source.length) * 100).toFixed(1);
  await writeFile(filePath, result.code, 'utf8');
  console.log(`  ${filePath} (saved ${pct}%)`);
}

async function main() {
  console.log('Minifying CSS...');
  for (const file of cssFiles) {
    await minifyCSS(file);
  }

  console.log('Minifying JS...');
  for (const file of jsFiles) {
    await minifyJS(file);
  }

  console.log('Build complete.');
}

main().catch((err) => {
  console.error('Build failed:', err.message);
  process.exit(1);
});
