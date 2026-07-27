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

- 安装：`pnpm install --frozen-lockfile`
- 开发启动：`pnpm start`
- 解包应用：`pnpm package`
- 单元测试：`pnpm test`
- 无头浏览器功能验收：`pnpm functional <tests/functional/...functional.ts>`

SDLC 测试计划引用的是 lifecycle 测试逻辑键，而不是上面的 shell 命令：
`unit`、`integration`、`functional`、`lint`、`static_analysis` 分别映射到
`pnpm test`、`pnpm typecheck`、指定 Playwright 功能文件、`pnpm lint`、
`pnpm typecheck`。因此 `test_plan.items[].command` 应填写 `"functional"`，
不能填写 `"pnpm test"`。

`.sdlc-pipeline/lifecycle.json` 是上述命令及 health/artifact/stop 的机器契约，
`.sdlc-pipeline/scaffold.json` 是关键 hash、protected path、allowed path 与 extension point
契约。`docs/sdlc/init-report.*` 由真实 init 在本地生成且不纳入模板版本控制，不能手工改写为
通过证据。

安装器认证属于独立 release certification，不进入 SDLC 功能测试阶段。模板开发构建默认
未签名，生产发布必须由使用者接入自己的 Authenticode 证书。

## Functional 测试约定

每个验收 T-id 绑定一个 `tests/functional/*.functional.ts` 文件。文件使用独立 Playwright
library API，不依赖 Vitest，也不负责启动、编译或打包项目：

```ts
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(process.env.SDLC_FUNCTIONAL_URL ?? 'http://127.0.0.1:5173');
  await page.getByRole('button', { name: '设备管理' }).click();
  await page.getByRole('heading', { name: '系统信息' }).waitFor();
} finally {
  await browser.close();
}
```

断言应面向可访问角色、菜单操作和业务字段。当前没有设备环境时，业务实现通过明确的
device information provider seam 提供本地数据；接入设备后替换 provider，使相同测试流程
直接依据真实接口返回值判断通过或失败。
