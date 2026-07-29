import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const sentinels = [
  path.resolve('.opencode', '__sdlc_discovery_poison__.test.ts'),
  path.resolve('.sdlc-pipeline', 'runtime', '__sdlc_discovery_poison__.test.ts'),
  path.resolve('.sdlc-pipeline', 'work', '__sdlc_discovery_poison__.test.ts'),
];

try {
  for (const sentinel of sentinels) {
    fs.mkdirSync(path.dirname(sentinel), { recursive: true });
    fs.writeFileSync(
      sentinel,
      "import { it } from 'vitest'; it('must never be discovered', () => { throw new Error('tooling boundary failed') })\n",
      'utf8',
    );
  }

  const result = spawnSync(
    'pnpm',
    ['exec', 'vitest', 'list', '--filesOnly'],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      shell: process.platform === 'win32',
      timeout: 60_000,
    },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'vitest discovery failed');
  }
  const discovered = result.stdout.replaceAll('\\', '/');
  if (discovered.includes('__sdlc_discovery_poison__')) {
    throw new Error(`Vitest discovered plugin tooling tests:\n${discovered}`);
  }
  if (!discovered.includes('tests/App.test.tsx')) {
    throw new Error(`Vitest did not discover the project test:\n${discovered}`);
  }
  console.log('[discovery] project tests found; plugin tooling tests excluded');
} finally {
  for (const sentinel of sentinels) {
    fs.rmSync(sentinel, { force: true });
  }
}
