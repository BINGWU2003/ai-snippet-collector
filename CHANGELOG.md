# 更新日志

**AI Snippet Collector** 的所有重要变更均记录于此。

格式参考 [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)。

---

## [0.3.0] — 2026-04-06

### 新增

- **一键编译并复制到剪贴板**
  - 新增命令 `AI Snippet: Compile & Copy to Clipboard`（快捷键 `Ctrl+Alt+C` / `Cmd+Alt+C`）。
  - 自动展开当前 prompt 文件中的所有代码引用，将最终内容复制到系统剪贴板，无需打开终端。
  - 若有警告（文件找不到、锚点模糊等），通过通知提示条数，正常情况显示成功提示。

- **状态栏一键复制按钮**
  - 选择过 prompt 文件后，状态栏右下角自动出现 `$(clippy)` 图标按钮，点击即触发编译并复制。
  - 悬停显示目标文件名，无 prompt 文件时自动隐藏，不占用状态栏空间。

- **保存时可附加 AI 说明**
  - `Ctrl+Alt+A` 和 `Ctrl+Alt+Shift+A` 保存引用后，会弹出输入框供输入一条说明（如"请修复此函数的并发问题"）。
  - 说明以 Markdown blockquote 格式追加在引用行下方，直接进入编译输出，AI 可一并读取。
  - 直接按 Escape 或留空即可跳过，不强制输入。

- **新增 `src/compiler.ts` 模块**
  - 将 compile-prompt 的引用展开逻辑提取为可复用模块，供 VS Code 扩展直接调用，消除代码重复。

### 改进

- **Anchor 碰撞优化：优先选取最近匹配**
  - 文件中有多处相同锚点时，由原来的"取第一个"改为"取离存储行号最近的一处"，定位更精准。
  - `ResolveResult` 新增 `ambiguous` 和 `found` 字段，调用方可感知碰撞和未找到两种情况。
  - `compile-prompt` CLI 在锚点模糊时向 stderr 输出具体提示；锚点未找到时同样给出警告及使用的存储行号。

- **错误提示明确化**
  - 文件找不到时提示增加操作建议："The file may have been moved or deleted."
  - 跳转到源码时若锚点未找到，扩展弹出 Warning 提示，而非静默使用过期行号。

- **引用去重检测**
  - 同一文件路径 + 相同锚点的引用已存在时，弹出警告并提供"仍要添加"选项，防止意外重复收集。

### 修复

- **`compile-prompt` CRLF 问题**
  - 源文件按行读取时补充 `trimEnd()`，修复 Windows 下代码块输出行尾含 `\r` 的问题。

### 测试

- **集成测试补充**
  - `extension.test.ts` 补充扩展激活验证和全部 6 个命令注册验证，替换原有占位符。
- **`anchorResolver` 测试更新**
  - 多重匹配测试改为验证最近匹配行为；新增 `ambiguous` 和 `found` 字段断言。

---

## [0.2.0] — 2026-03-03

### 新增：锚点追踪，彻底解决行号漂移问题

- **内容锚点（Content Anchor）**
  - 保存引用时自动记录选中代码的**首行内容**作为锚点，格式为 HTML 注释（在 Markdown 渲染中不可见）：
    ```
    **File:** `src/foo.ts` (Lines: 10-20) <!-- anchor: "export function activate() {" -->
    ```
  - 当源文件新增或删除代码导致行号偏移时，系统优先通过锚点重新定位代码，而非直接使用可能已过期的行号。

- **插件侧自动修复行号**
  - 点击 `跳转到源码` 或 `展开代码` 时，若检测到行号漂移，自动将 `.md` 文件中的引用行号更新为最新值，无需手动修正。

- **`compile-prompt` CLI 锚点修正**
  - 编译时同步进行锚点解析，输出的 `**File:**` 行号始终为修正后的正确值，AI 收到的代码与行号完全一致。

- **新增 `src/anchorResolver.ts`**
  - 抽取锚点解析为独立模块，VSCode 插件与 CLI 共享同一套定位逻辑。

- **单元测试覆盖**
  - 新增 `anchorResolver.test.ts`（13 个用例）和 `formatter.test.ts`（9 个用例），覆盖锚点匹配、漂移修正、空锚点降级、越界等场景。

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
