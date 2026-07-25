import path from 'node:path';
import { spawn } from 'node:child_process';

const findExecutable = (): string => {
  const packageDirectory = path.resolve(
    'out',
    `SDLC Electron Scaffold-${process.platform}-${process.arch}`,
  );
  if (process.platform === 'win32') {
    return path.join(packageDirectory, 'sdlc-electron-scaffold.exe');
  }
  if (process.platform === 'darwin') {
    return path.join(
      packageDirectory,
      'SDLC Electron Scaffold.app',
      'Contents',
      'MacOS',
      'sdlc-electron-scaffold',
    );
  }
  return path.join(packageDirectory, 'sdlc-electron-scaffold');
};

const main = async (): Promise<void> => {
  const output = await new Promise<{ code: number | null; text: string }>((resolve, reject) => {
    const child = spawn(findExecutable(), ['--smoke-test'], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let text = '';
    child.stdout.on('data', (chunk) => {
      text += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      text += String(chunk);
    });
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`Electron smoke 超时:\n${text}`));
    }, 20_000);
    child.on('error', reject);
    child.on('exit', (code) => {
      clearTimeout(timeout);
      resolve({ code, text });
    });
  });
  if (output.code !== 0 || !output.text.includes('[smoke] ready')) {
    throw new Error(`Electron smoke 失败 (exit=${output.code}):\n${output.text}`);
  }
  console.log('[e2e] Electron window, preload bridge and IPC are ready');
};

void main();
