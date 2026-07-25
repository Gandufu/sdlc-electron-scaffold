import { ipcMain } from 'electron';
import { IPC, type RuntimeInfo } from '../shared/contracts';
import { isTrustedRendererUrl } from './security';

const assertTrustedSender = (senderUrl: string, developmentServerUrl?: string): void => {
  if (!isTrustedRendererUrl(senderUrl, developmentServerUrl)) {
    throw new Error('拒绝来自非受信 renderer 的 IPC');
  }
};

export const registerIpc = (
  developmentServerUrl?: string,
  onSmokeReady?: () => void,
): void => {
  ipcMain.handle(IPC.runtimeInfo, (event): RuntimeInfo => {
    const senderUrl = event.senderFrame?.url;
    if (!senderUrl) {
      throw new Error('拒绝缺少 senderFrame 的 IPC');
    }
    assertTrustedSender(senderUrl, developmentServerUrl);
    return {
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
      platform: process.platform,
    };
  });
  ipcMain.handle(IPC.smokeReady, (event): void => {
    const senderUrl = event.senderFrame?.url;
    if (!senderUrl) {
      throw new Error('拒绝缺少 senderFrame 的 IPC');
    }
    assertTrustedSender(senderUrl, developmentServerUrl);
    onSmokeReady?.();
  });
};
