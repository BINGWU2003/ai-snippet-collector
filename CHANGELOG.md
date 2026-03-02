# 更新日志

**AI Snippet Collector** 的所有重要变更均记录于此。

格式参考 [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)。

---

## [0.1.0] — 2026-03-02

🎉 **核心工作流升级：从“代码拷贝”到“轻量引用指针”！**

### 新增核心工作流

- **代码引用模式 (Reference Pointers)**
  - 采集时只保存文件路径和行号（例如：`**File:** \`src/index.ts\` (Lines: 1-10)`），不再内嵌长篇代码。
  - 优势：提示词文件体积极小，且每次发送给 AI 前都能自动拉取**最新的源代码**，不再受“代码过期”困扰。

- **`compile-prompt` 全局 CLI**
  - 新增命令行工具，用于将提示词文件中的代码引用实时展开为最新的真实代码。
  - 支持通过管道 `|` 传递给剪贴板 (`clip` / `pbcopy`) 或 AI CLI 工具（如 `claude` 参数）。
  - **智能展开**：如果引用已被展开（带代码块），命令会用最新代码替换旧代码块，避免内容重复。
  - **一键清理 (`--clear` / `-c`)**：支持快速清空 `prompts/` 目录下的所有文件，或删除指定文件。
  - 安装方式：在项目下运行 `pnpm run link:cli`。

- **AI Agent 自动支持 (`CLAUDE.md`)**
  - README 中新增了对 Claude Code、Aider 等自主运行 AI 工具的配置教程，让 AI 自动调用 CLI 获取最新上下文。

### 编辑器体验增强

- **CodeLens 智能管理面板**
  - 打开 `prompts/` 目录下的 Markdown 文件时，每个代码引用顶部会自动显示操作面板：
  - `$(expand-all) 展开代码` / `$(collapse-all) 折叠代码`：一键预览当前最新代码，或折叠为单行指针。
  - `$(go-to-file) 跳转到源码`：一击定位到采集该指针时的具体文件和行数。
  - `$(trash) 删除此片段`：智能删除当前引用（包含其附带的代码块）。
- **新增系统级快捷键**
  - `Ctrl+Alt+A` / `Cmd+Alt+A`：快速追加当前选中代码到上一次交互的提示词文件。
  - `Ctrl+Alt+Shift+A` / `Cmd+Alt+Shift+A`：追加到指定的（或新的）提示词文件。

### 修复与优化

- **修复**：`activationEvents` 支持 Markdown 文件打开即时激活，解决了 CodeLens 偶尔不显示的问题。
- **修复**：对 Windows 系统的 `\r\n` (CRLF) 换行符提供完美兼容，防止文件解析失败出 Bug。
- **优化**：CLI 使用 esbuild 自动打包成不依赖项目的独立 Node.js 可执行文件。
- **优化**：推荐禁用 `prompts/` 文件夹下 Markdown 的 `formatOnSave`，并在 README 增加配置说明。

---

## [0.0.1] — 2026-03-02

**插件首次发布，建立基础片段收集功能**

### 新增
- **核心功能**：将选中代码追加到 `prompts/` 目录下的任意 `.md` / `.txt` 文件。
- **快速命令**：`ai-snippet.addToSpecificFile` 和 `ai-snippet.addToLastFile`。
- **智能 QuickPick**：支持在选择列表里直接输入文件名新建提示词文件。
- **状态栏快捷入口**：右下角常驻显示当前正在收集的目标提示词文件。
- **多语言界面**：支持英文和简体中文，跟随 VS Code 环境自适应（或通过 `aiSnippetCollector.language` 强制配置）。
- **架构**：全异步文件读写操作，防止阻塞 UI，并按模块 (`fileManager`, `snippetContext` 等) 标准化代码。
