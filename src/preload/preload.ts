import { contextBridge, ipcRenderer } from 'electron';
import { IPC, type DesktopBridge } from '../shared/contracts';

const bridge: DesktopBridge = {
  getRuntimeInfo: () => ipcRenderer.invoke(IPC.runtimeInfo),
  reportReady: () => ipcRenderer.invoke(IPC.smokeReady),
};

contextBridge.exposeInMainWorld('desktop', bridge);
