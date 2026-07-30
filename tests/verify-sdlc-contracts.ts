import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type ScaffoldContract = {
  template_version: string;
  lifecycle_hash: string;
  key_files: Array<{ path: string; sha256: string }>;
  extension_points: Array<{ id: string; path: string }>;
  allowed_paths: string[];
};

type LifecycleContract = {
  commands: {
    start: {
      argv: string[];
      windows_argv?: string[];
    };
  };
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

  const lifecycle = JSON.parse(
    await readFile(
      path.join(root, '.sdlc-pipeline/contracts/lifecycle.json'),
      'utf8',
    ),
  ) as LifecycleContract;
  const start = lifecycle.commands.start;
  if (
    start.argv.join('\0') !== ['pnpm', 'start'].join('\0') ||
    start.windows_argv?.join('\0') !==
      ['cmd.exe', '/d', '/c', 'pnpm', 'start'].join('\0')
  ) {
    throw new Error(
      'SDLC start command must run through pnpm so Electron Forge receives a valid package-manager user agent',
    );
  }

  if (
    scaffold.template_version !== '1.4.0' ||
    !scaffold.allowed_paths.includes('assets') ||
    !scaffold.extension_points.some(
      (entry) => entry.id === 'renderer-assets' && entry.path === 'assets',
    )
  ) {
    throw new Error(
      'Scaffold must expose the project-root assets directory as renderer-assets',
    );
  }
  const rendererConfig = await readFile(
    path.join(root, 'vite.renderer.config.ts'),
    'utf8',
  );
  if (!rendererConfig.includes("publicDir: 'assets'")) {
    throw new Error('Vite renderer must serve project-root assets as public files');
  }
  await readFile(path.join(root, 'assets', '.gitkeep'), 'utf8');
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
