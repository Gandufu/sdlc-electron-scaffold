import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  app,
  BrowserWindow,
  net,
  protocol,
  session,
  shell,
} from 'electron';
import { registerIpc } from './ipc';
import {
  isSafeExternalUrl,
  isTrustedRendererUrl,
  resolveAppAsset,
} from './security';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

const smokeTest = process.argv.includes('--smoke-test');

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: false,
    },
  },
]);

const createWindow = (): BrowserWindow => {
  const window = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 900,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
    },
  });

  window.once('ready-to-show', () => window.show());
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => {
    if (!isTrustedRendererUrl(url, MAIN_WINDOW_VITE_DEV_SERVER_URL)) {
      event.preventDefault();
    }
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    const url = new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    if (smokeTest) {
      url.searchParams.set('smoke', '1');
    }
    void window.loadURL(url.toString());
  } else {
    void window.loadURL(`app://bundle/index.html${smokeTest ? '?smoke=1' : ''}`);
  }
  return window;
};

app.whenReady().then(() => {
  const rendererRoot = path.join(__dirname, '..', 'renderer', MAIN_WINDOW_VITE_NAME);
  protocol.handle('app', (request) => {
    try {
      return net.fetch(pathToFileURL(resolveAppAsset(rendererRoot, request.url)).toString());
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });

  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
  registerIpc(MAIN_WINDOW_VITE_DEV_SERVER_URL, () => {
    if (smokeTest) {
      console.log('[smoke] ready');
      app.exit(0);
    }
  });
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
