# 更新日志

**AI Snippet Collector** 的所有重要变更均记录于此。

格式参考 [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)。

---

## [0.1.0] — 2026-03-02

### 新增

- **代码引用模式** — 采集时只保存文件路径和行号（`**File:** \`path\` (Lines: X-Y)`），不再内嵌代码内容，提示词文件体积极小且始终指向最新代码。
- **CodeLens 操作按钮** — 打开 `prompts/` 下的 `.md` / `.txt` 文件时，每个引用顶部自动显示三个操作按钮：
  - `$(trash) 删除此片段` — 一键删除整个引用片段（含前置空行），无需手动选中。
  - `$(go-to-file) 跳转到源码` — 打开源文件并定位到采集时的起始行。
  - `$(expand-all) 展开代码` / `$(collapse-all) 折叠代码` — 展开为当前磁盘最新代码预览，或折叠回轻量引用；两个按钮互斥，避免重复展开。
- **快捷键** — 新增键盘快捷键，无需右键菜单：
  - `Ctrl+Alt+A` / `Cmd+Alt+A` — 添加到上次使用的文件
  - `Ctrl+Alt+Shift+A` / `Cmd+Alt+Shift+A` — 添加到指定文件
- **`compile-prompt` 全局 CLI** — 通过 `pnpm run link:cli` 安装后全局可用；实时读取磁盘展开所有引用，支持管道传递给任意 AI CLI：
  ```bash
  compile-prompt prompts/current.md | clip    # 复制到剪贴板
  compile-prompt prompts/current.md | claude  # 直接发给 Claude CLI
  ```
  - 支持 `--help` / `-h` 查看用法
  - 已展开的片段：自动用最新代码替换旧代码块，不重复输出
  - 文件不存在时保留引用并输出警告，不中断
- **CLI 打包** — `esbuild.cli.js` 用 esbuild 将 `scripts/compile-prompt.ts` 打包为独立 Node.js 可执行文件（`dist/cli/compile-prompt.js`），无需 tsx 运行时。

### 修复

- **CodeLens 不显示问题** — `activationEvents` 从 `[]` 改为 `["onLanguage:markdown"]`，确保打开 Markdown 文件时扩展及时激活。
- **Windows CRLF 兼容** — 行尾 `\r` 导致围栏匹配失败，改用 `trimEnd()` 统一处理。

### 其他

- 插件图标、作者、仓库、许可证（MIT）信息完善至 `package.json`。
- 新增 `LICENSE` 文件（MIT）。
- 工作区 `.vscode/settings.json` 加入 `[markdown].editor.formatOnSave: false`，防止格式化器破坏引用格式。

---

## [0.0.1] — 2026-03-02

### 新增

- **核心片段保存功能** — 将选中代码追加到 `prompts/` 目录下的任意 `.md` / `.txt` 文件。
- **两个命令**：
  - `ai-snippet.addToSpecificFile` — 通过 QuickPick 选择或新建目标提示词文件。
  - `ai-snippet.addToLastFile` — 一键追加到上次使用的文件；首次使用时自动降级为文件选择流程。
- **智能 QuickPick** — 支持直接在选择框输入文件名创建新文件，无需额外弹窗；列表实时过滤。
- **状态栏快捷入口** — 右下角显示当前目标文件，点击触发 `addToLastFile`。
- **保存后一键打开** — 保存成功提示中附带「打开文件」按钮，直接跳转查看。
- **未选中文字兜底** — 无选中内容时提示用户是否使用当前行，而非直接报错退出。
- **多语言界面支持** — 支持英文和简体中文，通过 `aiSnippetCollector.language`（`auto` / `en` / `zh-cn`）配置；右键菜单通过 NLS 文件跟随 VS Code 界面语言自动切换。
- **异步文件 I/O** — 所有文件操作使用 `fs.promises`，避免阻塞 UI 线程。
- **模块化代码结构** — 逻辑拆分为 `constants`、`i18n`、`statusBar`、`formatter`、`fileManager`、`snippetContext` 等独立模块。
