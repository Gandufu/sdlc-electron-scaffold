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
- 编译检查：`pnpm compile`
- 解包应用：`pnpm package`
- 单元测试：`pnpm test`
- 无头浏览器功能验收：`pnpm functional <tests/functional/...functional.ts>`

模板维护者可运行 `pnpm verify:template` 执行 contract、lint、compile、Vitest 和 package
自检。SDLC code gate 从 lifecycle `commands` 分别执行 compile、package、lint 和 typecheck，
随后启动并保持预览运行；这些工程控制
不是 Verification 测试。Verification Markdown 使用 `level: "functional"`、
`test_key: "functional"` 和 `selector: "tests/functional/T-xxxx.functional.ts"`，不能把
`pnpm functional` 等 shell 命令写进 `test_key`。

`.sdlc-pipeline/contracts/lifecycle.json` 是上述命令及 health/artifact 的机器契约。start
产生的后台进程由插件记录 PID 与创建身份并统一停止，模板不重复实现 stop/restart 脚本。
`.sdlc-pipeline/contracts/scaffold.json` 是关键 hash、protected path、allowed path 与 extension point
契约。`pnpm verify:contracts` 必须以跨平台规范化换行 hash 校验这些合同；init 的通过证据由插件写入
项目本地 `.sdlc-pipeline/evidence/records/`，不纳入模板版本控制，也不能手工改写为通过证据。

安装器认证属于独立 release certification，不进入 SDLC 功能测试阶段。模板开发构建默认
未签名，生产发布必须由使用者接入自己的 Authenticode 证书。

## Functional 测试约定

每个验收 T-id 绑定一个 `tests/functional/*.functional.ts` 文件。test gate 先停止 coder 预览并
确认 5173 端口释放；文件再使用项目安装的 Playwright library API 启动 Electron，不依赖 Vitest
或 Playwright MCP，也不负责编译或打包项目：

```ts
import { _electron } from 'playwright';

const electronApp = await _electron.launch({
  args: ['.vite/build/main.js'],
});
try {
  const window = await electronApp.firstWindow();
  await window.getByRole('button', { name: '设备管理' }).click();
  await window.getByRole('heading', { name: '系统信息' }).waitFor();
} finally {
  await electronApp.close();
}
```

断言应面向可访问角色、菜单操作和业务字段。当前没有设备环境时，业务实现通过明确的
device information provider seam 提供本地数据；接入设备后替换 provider，使相同测试流程
直接依据真实接口返回值判断通过或失败。
