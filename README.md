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

独立编译检查：

```powershell
pnpm compile
```

## 验证与发布

```powershell
pnpm lint
pnpm typecheck
pnpm compile
pnpm test
pnpm package
pnpm verify:contracts
pnpm verify:template
```

上述命令供模板维护者自检。SDLC code gate 根据 lifecycle `commands` 分别执行 compile、package、
lint 和 typecheck，再启动项目、等待 readiness，并保持预览运行。coder 不读取或编写测试脚本。
测试阶段在 tester 产出脚本后重新执行 lint、typecheck 与全量 unit test；只有选中 functional suite
时才重新启动 Electron runtime 并完成 readiness。Verification Markdown 的 frontmatter 通过合同声明的
测试套件引用测试：

```yaml
level: "unit"
test_key: "unit"
selector: "tests/App.test.tsx"
```

- `package` 生成可运行的解包应用到 `out/`。
- tester 子 agent 只编写已发布 selector 指定的 unit 或 Playwright functional 脚本。
- `unit` selector 仅匹配 `tests/**/*.test.ts(x)`，不需要运行时；`functional` selector 仅匹配
  `tests/functional/*.functional.ts`，需要运行时。
- Core 在 test 阶段先停止 coder 预览并确认 5173 端口释放。functional 脚本使用 Playwright
  `_electron.launch()` 操作桌面窗口并断言业务结果，在 `finally` 中关闭 Electron，也不依赖
  Playwright MCP；Core 最后复查端口和进程清理。

本地开发构建默认不携带 Authenticode 签名，可以用于自动验收，但不应直接作为正式公网发布
版本。生产发布必须在 `forge.config.ts` 中接入组织自己的 Windows 代码签名证书，并通过环境
变量或 CI secret 注入证书密码，不能把证书或密码提交到模板仓库。

## SDLC 生命周期契约

- `.sdlc-pipeline/contracts/lifecycle.json` 分别声明工具探测、依赖安装、编译、打包、启动、health、
  artifact、test_preflight 和测试 suite。`start` 直接调用 Forge CLI，避免包管理器包装进程脱离
  Core 的 PID 管理；后台进程由插件记录创建身份并统一停止，模板不重复实现 stop/restart 脚本。
- `.sdlc-pipeline/contracts/scaffold.json` 固定模板 ID、关键文件 hash、受保护路径和扩展点。
- `pnpm verify:contracts` 使用跨平台换行规范化 hash 校验上述合同，发布模板前必须通过。
- init 证据位于项目本地 `.sdlc-pipeline/evidence/records/`，不纳入模板版本控制；批准后的 baseline、
  test results 与 version 文档位于 `docs/sdlc/`，应提交到 Git。
- 插件通过无参数 `/sdlc-init` 启动初始化；用户在交互中明确选择 `sdlc-electron-scaffold` 后，
  插件才导入模板 Git 历史到当前空项目。

## 扩展

- 主进程能力放在 `src/main/`。
- preload 只在 `src/preload/preload.ts` 暴露业务语义方法，不暴露通用
  `ipcRenderer`。
- 跨进程 channel 与 DTO 放在 `src/shared/contracts.ts`。
- renderer 页面和状态放在 `src/renderer/`，不得直接访问 Node.js。
- 原型 HTML/CSS 直接引用的 PNG、字体等原始静态资源放在项目根目录 `assets/`。Vite 在开发时
  从站点根路径提供该目录，并在构建时保持文件名原样复制；页面使用 `/文件名` 引用。
- 新增 IPC 时必须同时补充 sender 校验、参数校验和至少一个失败测试。
