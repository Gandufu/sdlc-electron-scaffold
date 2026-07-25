# Electron Scaffold

面向桌面项目的通用 Electron 脚手架。使用 Electron Forge、React、Vite、
TypeScript、Vitest 与 Playwright，默认开启进程隔离、sandbox、CSP、IPC sender
校验、权限拒绝策略和 Electron fuses。

## 环境

- Node.js 22.12 或更高版本
- pnpm 10.34.5（由根 `packageManager` 固定）
- Windows 10/11；Forge 配置默认生成 Squirrel.Windows 安装包

## 安装与启动

```powershell
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm start
```

`start` 会启动 Vite renderer、编译 main/preload 并拉起真实 Electron 窗口。

## 验证与发布

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm package
corepack pnpm test:e2e
corepack pnpm make
```

- `package` 生成可运行的解包应用到 `out/`。
- `test:e2e` 对解包应用执行真实窗口、preload bridge 与 IPC 冒烟。
- `make` 生成 Windows 安装产物。

## 扩展

- 主进程能力放在 `src/main/`。
- preload 只在 `src/preload/preload.ts` 暴露业务语义方法，不暴露通用
  `ipcRenderer`。
- 跨进程 channel 与 DTO 放在 `src/shared/contracts.ts`。
- renderer 页面和状态放在 `src/renderer/`，不得直接访问 Node.js。
- 新增 IPC 时必须同时补充 sender 校验、参数校验和至少一个失败测试。
