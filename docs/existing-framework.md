# SDLC Electron Scaffold 既有框架

## 模块与依赖方向

```text
renderer -> preload/contextBridge -> main IPC handler -> main capability
                 \                 /
                  shared contracts
```

- `src/shared` 只保存 channel、DTO 和 bridge 类型，不依赖 Electron 或 React。
- `src/preload` 是 renderer 唯一可见的桌面能力 seam。
- `src/main` 持有 Electron、系统资源和副作用。
- `src/renderer` 只负责 Web UI。

## 安全不变量

- `contextIsolation: true`、`nodeIntegration: false`、`sandbox: true`。
- IPC handler 必须验证 `event.senderFrame.url`。
- app 协议必须固定 host，并验证解析后的文件仍位于 renderer 目录。
- 外链默认拒绝；确需打开时只允许经过业务规则验证的 HTTPS URL。
- 权限请求默认拒绝，新增权限必须显式实现 allowlist。

## 生命周期

- 安装：`corepack pnpm install --frozen-lockfile`
- 开发启动：`corepack pnpm start`
- 编译打包：`corepack pnpm package`
- 单元测试：`corepack pnpm test`
- 真实 Electron 冒烟：`corepack pnpm test:e2e`
