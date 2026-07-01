#!/usr/bin/env node

/**
 * merge-dist.mjs
 *
 * Mescla os builds de dois projetos Vite em uma única pasta dist/:
 * - dist-portal/: build do vnmax raiz (apenas interno.html + assets)
 * - web/dist/: build do React (index.html + assets + public files)
 *
 * Estratégia:
 * 1. Limpa/cria d:\vnmax\dist\
 * 2. Copia TODO conteúdo de web/dist/ para dist/
 * 3. Copia conteúdo de dist-portal/ para dist/ SEM sobrescrever arquivos existentes
 *    (preserva index.html, assets do React, etc)
 * 4. Loga colisões de nomes (não deveria acontecer, mas avisa se houver)
 */

import { promises as fs } from 'node:fs';
import { join, relative } from 'node:path';

const REPO_ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const WEB_DIST = join(REPO_ROOT, '..', 'web', 'dist');
const PORTAL_DIST = join(REPO_ROOT, '..', 'dist-portal');
const FINAL_DIST = join(REPO_ROOT, '..', 'dist');

console.log(`[merge-dist] Starting merge...`);
console.log(`  WEB_DIST:    ${WEB_DIST}`);
console.log(`  PORTAL_DIST: ${PORTAL_DIST}`);
console.log(`  FINAL_DIST:  ${FINAL_DIST}`);

async function copyDirRecursive(src, dest, skipIfExists = false) {
  const collisions = [];

  async function recurse(srcDir, destDir) {
    const entries = await fs.readdir(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = join(srcDir, entry.name);
      const destPath = join(destDir, entry.name);

      if (entry.isDirectory()) {
        await fs.mkdir(destPath, { recursive: true });
        await recurse(srcPath, destPath);
      } else {
        if (skipIfExists) {
          try {
            await fs.stat(destPath);
            // File already exists
            collisions.push(relative(FINAL_DIST, destPath));
            continue;
          } catch {
            // File doesn't exist, proceed
          }
        }
        await fs.mkdir(destDir, { recursive: true });
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  await recurse(src, dest);
  return collisions;
}

async function main() {
  try {
    // 1. Limpa e recria dist/
    try {
      await fs.rm(FINAL_DIST, { recursive: true, force: true });
    } catch {
      // Already deleted or doesn't exist
    }
    await fs.mkdir(FINAL_DIST, { recursive: true });
    console.log(`✓ Created ${FINAL_DIST}`);

    // 2. Copia web/dist/ para dist/
    try {
      const webStats = await fs.stat(WEB_DIST);
      if (!webStats.isDirectory()) {
        throw new Error(`${WEB_DIST} is not a directory`);
      }
      await copyDirRecursive(WEB_DIST, FINAL_DIST, false);
      console.log(`✓ Copied web/dist/ → dist/`);
    } catch (err) {
      console.error(`✗ Error copying web/dist: ${err.message}`);
      process.exit(1);
    }

    // 3. Copia dist-portal/ para dist/ (sem sobrescrever)
    try {
      const portalStats = await fs.stat(PORTAL_DIST);
      if (!portalStats.isDirectory()) {
        throw new Error(`${PORTAL_DIST} is not a directory`);
      }
      const collisions = await copyDirRecursive(PORTAL_DIST, FINAL_DIST, true);
      console.log(`✓ Copied dist-portal/ → dist/ (skipIfExists)`);

      if (collisions.length > 0) {
        console.log(`⚠ File collisions (skipped): ${collisions.length}`);
        collisions.forEach(f => console.log(`  - ${f}`));
      }
    } catch (err) {
      console.error(`✗ Error copying dist-portal: ${err.message}`);
      process.exit(1);
    }

    // 4. Verifica resultado final
    const finalFiles = await fs.readdir(FINAL_DIST, { recursive: true });
    console.log(`✓ Final dist/ contains ${finalFiles.length} files`);

    // Verifica presença de arquivos-chave
    const keyFiles = ['index.html', 'interno.html', 'robots.txt', 'sitemap.xml'];
    for (const file of keyFiles) {
      try {
        await fs.stat(join(FINAL_DIST, file));
        console.log(`  ✓ ${file}`);
      } catch {
        console.warn(`  ✗ ${file} MISSING`);
      }
    }

    console.log(`\n[merge-dist] Success!`);
  } catch (err) {
    console.error(`[merge-dist] Error:`, err);
    process.exit(1);
  }
}

main();
