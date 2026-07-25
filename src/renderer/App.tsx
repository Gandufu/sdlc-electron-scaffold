import { useEffect, useState } from 'react';
import type { RuntimeInfo } from '../shared/contracts';

export const App = () => {
  const [runtime, setRuntime] = useState<RuntimeInfo | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('smoke') === '1') {
      void window.desktop.reportReady();
    }
  }, []);

  const inspectRuntime = async () => {
    setRuntime(await window.desktop.getRuntimeInfo());
  };

  return (
    <main className="shell">
      <p className="eyebrow">Electron Forge · React · Vite · TypeScript</p>
      <h1>Electron Scaffold</h1>
      <p className="lede">
        主进程、sandbox preload 和 renderer 已通过最小 typed IPC seam 连接。
      </p>
      <button type="button" onClick={inspectRuntime}>
        检查运行时
      </button>
      {runtime && (
        <dl aria-label="runtime-info">
          <div><dt>Electron</dt><dd>{runtime.electron}</dd></div>
          <div><dt>Chromium</dt><dd>{runtime.chrome}</dd></div>
          <div><dt>Node.js</dt><dd>{runtime.node}</dd></div>
          <div><dt>Platform</dt><dd>{runtime.platform}</dd></div>
        </dl>
      )}
    </main>
  );
};
