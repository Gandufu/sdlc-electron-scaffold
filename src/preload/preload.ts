import { contextBridge, ipcRenderer } from 'electron';
import { IPC, type DesktopBridge } from '../shared/contracts';

const bridge: DesktopBridge = {
  getRuntimeInfo: () => ipcRenderer.invoke(IPC.runtimeInfo),
};

contextBridge.exposeInMainWorld('desktop', bridge);
