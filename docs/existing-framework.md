# SDLC Electron Scaffold 既有框架

## 资产契约

本仓库是独立模板资产，不是 SDLC Pipeline 插件的一部分。插件只通过
`templates/manifest.json` 登记模板 ID `sdlc-electron-scaffold`、Git repository/ref、技术栈
和能力元数据。模板源码、依赖、锁文件、测试与 lifecycle/scaffold 契约均以本仓库为准。

模板采用纯通用实现：不保留 Heli、设备、会议、Adapter、Service 或领域错误映射样例。新增
业务能力应从下述 extension point 扩展，不应把具体业务重新固化为脚手架默认内容。

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

`.sdlc-pipeline/lifecycle.json` 是上述命令及 health/artifact/stop 的机器契约，
`.sdlc-pipeline/scaffold.json` 是关键 hash、protected path、allowed path 与 extension point
契约。`docs/sdlc/init-report.*` 由真实 init 在本地生成且不纳入模板版本控制，不能手工改写为
通过证据。
