import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const findExecutable = (): string => {
  const out = path.resolve('out');
  const packageDirectory = fs.readdirSync(out)
    .map((name) => path.join(out, name))
    .find((candidate) => fs.statSync(candidate).isDirectory() && !candidate.endsWith('make'));
  if (!packageDirectory) {
    throw new Error('未找到 Electron Forge package 目录');
  }
  if (process.platform === 'win32') {
    return path.join(packageDirectory, 'electron-scaffold.exe');
  }
  if (process.platform === 'darwin') {
    return path.join(
      packageDirectory,
      'Electron Scaffold.app',
      'Contents',
      'MacOS',
      'electron-scaffold',
    );
  }
  return path.join(packageDirectory, 'electron-scaffold');
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
