import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  isSafeExternalUrl,
  isTrustedRendererUrl,
  resolveAppAsset,
} from '../src/main/security';

describe('Electron security helpers', () => {
  it('只允许 HTTPS 外链', () => {
    expect(isSafeExternalUrl('https://example.com/docs')).toBe(true);
    expect(isSafeExternalUrl('http://example.com')).toBe(false);
    expect(isSafeExternalUrl('file:///C:/Windows/System32')).toBe(false);
  });

  it('只信任应用 origin 或精确的开发服务器 origin', () => {
    expect(isTrustedRendererUrl('app://bundle/index.html')).toBe(true);
    expect(isTrustedRendererUrl('app://attacker/index.html')).toBe(false);
    expect(
      isTrustedRendererUrl('http://127.0.0.1:5173/page', 'http://127.0.0.1:5173'),
    ).toBe(true);
  });

  it('阻止 app 协议目录穿越', () => {
    const root = path.resolve('renderer');
    expect(resolveAppAsset(root, 'app://bundle/assets/app.js')).toBe(
      path.join(root, 'assets', 'app.js'),
    );
    expect(() => resolveAppAsset(root, 'app://bundle/%2e%2e%2fsecret.txt')).toThrow(
      '路径越界',
    );
  });
});
