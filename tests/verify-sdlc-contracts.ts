import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type ScaffoldContract = {
  lifecycle_hash: string;
  key_files: Array<{ path: string; sha256: string }>;
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function canonicalHash(content: string): string {
  return createHash('sha256')
    .update(content.replace(/\r\n/g, '\n').replace(/\r/g, '\n'), 'utf8')
    .digest('hex');
}

async function hashFile(relativePath: string): Promise<string> {
  return canonicalHash(await readFile(path.join(root, relativePath), 'utf8'));
}

async function main(): Promise<void> {
  const scaffoldPath = '.sdlc-pipeline/contracts/scaffold.json';
  const scaffold = JSON.parse(
    await readFile(path.join(root, scaffoldPath), 'utf8'),
  ) as ScaffoldContract;
  const entries = [
    {
      path: '.sdlc-pipeline/contracts/lifecycle.json',
      sha256: scaffold.lifecycle_hash,
    },
    ...scaffold.key_files,
  ];

  for (const entry of entries) {
    const actual = await hashFile(entry.path);
    if (actual !== entry.sha256) {
      throw new Error(
        `SDLC contract hash mismatch for ${entry.path}: expected ${entry.sha256}, got ${actual}`,
      );
    }
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
