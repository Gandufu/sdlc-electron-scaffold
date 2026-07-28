# SDLC Electron Scaffold

面向桌面项目的通用 Electron 脚手架。使用 Electron Forge、React、Vite、
TypeScript 与 Vitest，默认开启进程隔离、sandbox、CSP、IPC sender
校验、权限拒绝策略和 Electron fuses。

## 模板身份与边界

- 模板 ID：`sdlc-electron-scaffold`
- 独立仓库：<https://github.com/Gandufu/sdlc-electron-scaffold.git>
- 内容边界：不包含 Heli、设备控制、会议或其他领域业务，只保留安全
  main/preload/typed IPC、React 页面和测试示例。
- 打包工具：只使用 Electron Forge，不同时维护 electron-builder。
- SDLC Pipeline 插件只登记本仓库的数据源元数据，不复制本仓库源码或模板专属资产。

## 环境

- Node.js 22.12 或更高版本
- pnpm 10.34.5（由根 `packageManager` 固定）
- Windows 10/11；Forge 配置默认生成 Squirrel.Windows 安装包

## 安装与启动

```powershell
pnpm install --frozen-lockfile
pnpm start
```

`start` 会启动 Vite renderer、编译 main/preload 并拉起真实 Electron 窗口。

## 验证与发布

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm package
pnpm verify:code
```

上述是开发者可直接执行的 shell 命令；在 SDLC `test-plan.json` 中，
`test_plan.items[].command` 必须引用 `.sdlc-pipeline/contracts/lifecycle.json` 的测试逻辑键：

| 测试逻辑键 | 实际命令 |
|---|---|
| `unit` | `pnpm test` |
| `integration` | `pnpm typecheck` |
| `functional` | `pnpm functional <tests/functional/...functional.ts>` |
| `lint` | `pnpm lint` |
| `static_analysis` | `pnpm typecheck` |

例如单元测试填写 `"command": "unit"`，不能填写 `"command": "pnpm test"`。

- `package` 生成可运行的解包应用到 `out/`。
- `functional` 由 SDLC test 阶段在项目启动后执行指定 Playwright 功能文件。
- 功能文件必须通过无头浏览器操作页面并断言业务结果，不负责重新编译或打包。

本地开发构建默认不携带 Authenticode 签名，可以用于自动验收，但不应直接作为正式公网发布
版本。生产发布必须在 `forge.config.ts` 中接入组织自己的 Windows 代码签名证书，并通过环境
变量或 CI secret 注入证书密码，不能把证书或密码提交到模板仓库。

## SDLC 生命周期契约

- `.sdlc-pipeline/contracts/lifecycle.json` 声明工具探测、依赖安装、打包、启动、health、
  artifact、测试和停止命令。
- `.sdlc-pipeline/contracts/scaffold.json` 固定模板 ID、关键文件 hash、受保护路径和扩展点。
- `docs/sdlc/` 是每次 init 生成的本地验收证据，默认不提交到模板仓库。
- 插件通过 `/sdlc-init sdlc-electron-scaffold` 解析数据源并把模板 Git 历史导入当前空项目。

## 扩展

- 主进程能力放在 `src/main/`。
- preload 只在 `src/preload/preload.ts` 暴露业务语义方法，不暴露通用
  `ipcRenderer`。
- 跨进程 channel 与 DTO 放在 `src/shared/contracts.ts`。
- renderer 页面和状态放在 `src/renderer/`，不得直接访问 Node.js。
- 新增 IPC 时必须同时补充 sender 校验、参数校验和至少一个失败测试。
