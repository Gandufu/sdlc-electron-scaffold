import fs from 'node:fs';
import path from 'node:path';

const source = path.resolve(
  'out',
  'make',
  'squirrel.windows',
  process.arch,
  'SDLCElectronScaffoldSetup.exe',
);
const releaseDirectory = path.resolve('dist');
const destination = path.join(
  releaseDirectory,
  'SDLCElectronScaffoldSetup.exe',
);

if (!fs.existsSync(source)) {
  throw new Error(`未找到 Squirrel Setup.exe: ${source}`);
}

fs.rmSync(releaseDirectory, {
  recursive: true,
  force: true,
  maxRetries: 10,
  retryDelay: 250,
});
fs.mkdirSync(releaseDirectory, { recursive: true });
fs.copyFileSync(source, destination);

const files = fs.readdirSync(releaseDirectory);
if (
  files.length !== 1 ||
  files[0] !== 'SDLCElectronScaffoldSetup.exe'
) {
  throw new Error(`最终交付目录必须只包含一个 exe: ${files.join(', ')}`);
}

console.log(`[release] single executable ready: ${destination}`);
