export const IPC = {
  runtimeInfo: 'app:runtime-info',
} as const;

export interface RuntimeInfo {
  electron: string;
  chrome: string;
  node: string;
  platform: NodeJS.Platform;
}

export interface DesktopBridge {
  getRuntimeInfo(): Promise<RuntimeInfo>;
}
