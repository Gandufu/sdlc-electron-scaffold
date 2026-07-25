import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

type ProcessResult = {
  code: number | null;
  output: string;
};

const run = (
  executable: string,
  args: string[],
  timeoutMs: number,
): Promise<ProcessResult> =>
  new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`进程超时: ${executable} ${args.join(' ')}\n${output}`));
    }, timeoutMs);
    child.stdout.on('data', (chunk) => {
      output += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      output += String(chunk);
    });
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('exit', (code) => {
      clearTimeout(timeout);
      resolve({ code, output });
    });
  });

const waitForFile = async (file: string, timeoutMs: number): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (fs.existsSync(file)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`等待文件超时: ${file}`);
};

const main = async (): Promise<void> => {
  if (process.platform !== 'win32') {
    throw new Error('Squirrel installer 冒烟仅支持 Windows');
  }

  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) {
    throw new Error('缺少 LOCALAPPDATA');
  }

  const setup = path.resolve(
    'dist',
    'SDLCElectronScaffoldSetup.exe',
  );
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve('package.json'), 'utf8'),
  ) as { version: string };
  const installRoot = path.resolve(localAppData, 'sdlc_electron_scaffold');
  if (
    path.dirname(installRoot) !== path.resolve(localAppData) ||
    path.basename(installRoot) !== 'sdlc_electron_scaffold'
  ) {
    throw new Error(`拒绝使用非预期安装目录: ${installRoot}`);
  }
  if (fs.existsSync(installRoot)) {
    throw new Error(`检测到已有安装，拒绝覆盖: ${installRoot}`);
  }
  if (!fs.existsSync(setup)) {
    throw new Error(`未找到安装器: ${setup}`);
  }
  const header = Buffer.alloc(2);
  const descriptor = fs.openSync(setup, 'r');
  try {
    fs.readSync(descriptor, header, 0, header.length, 0);
  } finally {
    fs.closeSync(descriptor);
  }
  if (header.toString('ascii') !== 'MZ') {
    throw new Error(`安装器不是有效的 Windows PE 文件: ${setup}`);
  }

  const isolatedDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'sdlc-electron-installer-'),
  );
  const isolatedSetup = path.join(
    isolatedDirectory,
    'SDLCElectronScaffoldSetup.exe',
  );
  fs.copyFileSync(setup, isolatedSetup);

  try {
    const installed = await run(isolatedSetup, ['--silent'], 120_000);
    if (installed.code !== 0) {
      throw new Error(`安装器失败 (exit=${installed.code}):\n${installed.output}`);
    }

    const appExecutable = path.join(
      installRoot,
      `app-${packageJson.version}`,
      'sdlc-electron-scaffold.exe',
    );
    await waitForFile(appExecutable, 30_000);
    const smoke = await run(appExecutable, ['--smoke-test'], 30_000);
    if (smoke.code !== 0 || !smoke.output.includes('[smoke] ready')) {
      throw new Error(
        `安装后应用冒烟失败 (exit=${smoke.code}):\n${smoke.output}`,
      );
    }
    console.log('[installer-e2e] Setup.exe installed and launched the verified app');
  } finally {
    const updater = path.join(installRoot, 'Update.exe');
    if (fs.existsSync(updater)) {
      await run(updater, ['--uninstall', '--silent'], 60_000);
    }
    fs.rmSync(installRoot, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 250,
    });
    fs.rmSync(isolatedDirectory, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 250,
    });
  }

  if (fs.existsSync(installRoot)) {
    throw new Error(`测试安装未清理: ${installRoot}`);
  }
};

void main();
