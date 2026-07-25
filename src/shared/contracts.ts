export const IPC = {
  runtimeInfo: 'app:runtime-info',
  smokeReady: 'app:smoke-ready',
} as const;

export interface RuntimeInfo {
  electron: string;
  chrome: string;
  node: string;
  platform: NodeJS.Platform;
}

export interface DesktopBridge {
  getRuntimeInfo(): Promise<RuntimeInfo>;
  reportReady(): Promise<void>;
}
