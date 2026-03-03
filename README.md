# AI Snippet Collector

**AI Snippet Collector** 是一款为 AI 辅助研发工作流设计的 VS Code 扩展。它在提示词文件中保存**代码引用指针**（路径 + 行号 + 锚点），配合 `compile-prompt` CLI 在发给 AI 之前实时拉取最新代码——代码重构了、函数改了、行号漂移了，上下文永远是最新的。

## 核心理念

```
收集时 → 只存路径 + 行号 + 首行锚点（轻量，无冗余）
发送前 → compile-prompt 通过锚点定位，注入当前最新代码
```

## 功能特性

| 功能                   | 说明                                                           |
| ---------------------- | -------------------------------------------------------------- |
| 📎 **添加到指定文件**  | 选中代码后保存引用到 `prompts/`，支持新建文件                  |
| ⚡ **添加到上次文件**  | 一键追加，无历史时自动降级为文件选择                           |
| 🗑️ **一键删除片段**    | CodeLens 删除按钮，无需手动选中                                |
| 🔗 **跳转到源码**      | CodeLens 直接定位到采集时的原始行，行号漂移时自动修正          |
| 🔍 **展开 / 折叠代码** | 随时展开为当前最新代码预览，或折叠回轻量引用                   |
| 📌 **锚点追踪**        | 保存时记录首行内容，代码被移动或行号偏移后仍能精准定位         |
| 🌐 **多语言界面**      | 支持英文和简体中文，可独立配置                                 |
| 🖥️ **全局 CLI**        | `compile-prompt` 命令一键展开所有引用，可管道传递给任意 AI CLI |

## 完整工作流

### 第一步：收集代码引用

选中代码，按快捷键：

| 操作                 | Windows / Linux    | macOS             |
| -------------------- | ------------------ | ----------------- |
| 添加到上次使用的文件 | `Ctrl+Alt+A`       | `Cmd+Alt+A`       |
| 添加到指定文件       | `Ctrl+Alt+Shift+A` | `Cmd+Alt+Shift+A` |

提示词文件写入一行轻量引用（含锚点）：

```markdown
---

**File:** `src/views/admin/index.vue` (Lines: 12-45) <!-- anchor: "<template>" -->
```

> 锚点（`anchor`）记录选中代码的首行内容，当源文件新增或删除代码导致行号偏移时，系统会自动重新定位，跳转和展开始终指向正确的代码。

多个引用 + 你的问题：

```markdown
---
**File:** `src/views/admin/index.vue` (Lines: 12-45) <!-- anchor: "<template>" -->

---

**File:** `src/components/Table.vue` (Lines: 100-120) <!-- anchor: "const emit = defineEmits" -->

帮我看看为什么子组件没触发 emit？
```

### 第二步：发给 AI 前用 compile-prompt 编译

`compile-prompt` 在你按下回车的瞬间读取磁盘最新代码，展开所有引用：

```bash
# 复制到剪贴板，粘贴到 Claude / ChatGPT 网页版（Windows）
compile-prompt prompts/current.md | clip

# 直接发给 Claude CLI
compile-prompt prompts/current.md | claude

# 保存为临时文件
compile-prompt prompts/current.md > /tmp/compiled.md

# [新增功能] 一键清理：清空某个文件夹下的所有文件，或删除单个文件
compile-prompt --clear prompts
compile-prompt --clear prompts/current.md
```

展开后输出：

````markdown
---

**File:** `src/views/admin/index.vue` (Lines: 12-45) <!-- anchor: "<template>" -->

```vue
<!-- 当前磁盘上的最新代码 -->
```
````

> 若行号已因代码改动而偏移，`compile-prompt` 会通过锚点自动修正行号后再读取代码。

### 第三步：管理提示词文件（CodeLens）

打开 `prompts/` 下的 `.md` 文件，每个引用顶部显示操作按钮：

**仅引用状态：**

```
$(trash) 删除此片段   $(go-to-file) 跳转到源码   $(expand-all) 展开代码
---
**File:** `src/extension.ts` (Lines: 8-20)
```

**展开后状态（按钮自动切换）：**

```
$(trash) 删除此片段   $(go-to-file) 跳转到源码   $(collapse-all) 折叠代码
---
**File:** `src/extension.ts` (Lines: 8-20)
// 实时展示当前代码

```

## 安装 compile-prompt CLI

```bash
# 在扩展项目目录执行（一次性）
pnpm run link:cli

# 验证
compile-prompt --help

# 卸载
pnpm run unlink:cli
```

安装后 `compile-prompt` 在任意目录全局可用。

## 🤖 配合 AI Agent (例如 Claude Code, Aider)

如果你在终端使用自主运作的 AI 工具（例如原生的 `claude` CLI），你可以在项目根目录下创建/修改 `CLAUDE.md`，教会它们自动读取最新版本的提示词上下文，做到真正的“永不过期”：

```markdown
## prompts/ 目录说明

本项目使用 `ai-snippet-collector` 扩展管理代码上下文，`prompts/` 目录下的文件**不包含真实代码**，只保存代码引用指针（格式为 `**File:** \`path\` (Lines: X-Y)`）。

## 何时调用 compile-prompt

**仅当用户消息中明确提到了 `prompts/` 目录下的某个文件**（例如直接写出 `prompts/feature.md`），才调用：

\`\`\`bash
compile-prompt <该文件的相对路径>
\`\`\`

**不要**在以下情况调用：
- 用户未提到任何 `prompts/` 文件
- 用户只是在询问源码或其他问题

## 调用后的处理

以 `compile-prompt` 的 stdout 输出为准，输出即为展开了最新代码的完整上下文，**忽略原始文件内容**。
```

## 配置项

| 配置项                        | 可选值                    | 默认值 | 说明                          |
| ----------------------------- | ------------------------- | ------ | ----------------------------- |
| `aiSnippetCollector.language` | `auto` \| `en` \| `zh-cn` | `auto` | 界面语言，`auto` 跟随 VS Code |

> VS Code 设置 → 搜索 **AI Snippet Collector**

## 工作区配置建议

为避免 Prettier 等格式化器在保存时破坏 `prompts/` 下的引用格式，需在项目的 `.vscode/settings.json` 中禁用 Markdown 保存时格式化：

```json
{
  "[markdown]": {
    "editor.formatOnSave": false
  }
}
```

## 环境要求

- VS Code **1.90.0** 及以上
- Node.js **18+**（使用 `compile-prompt` CLI 时需要）

## 本地开发

```bash
pnpm install          # 安装依赖
pnpm run watch        # 启动 esbuild + tsc 监听
```

按 `F5` 启动扩展宿主，保存代码后 `Ctrl+Shift+F5` 重载。

### 常用命令

```bash
pnpm run check-types   # TS 类型检查
pnpm run lint          # ESLint 检查
pnpm run test          # 运行测试
pnpm run vsix          # 编译 + 打包 .vsix
pnpm run build:cli     # 构建 compile-prompt CLI（开发模式）
pnpm run link:cli      # 构建生产版 + 全局安装
```

## 文件结构

```
src/
├── extension.ts           # 入口，注册命令和 CodeLens
├── constants.ts           # 共享常量
├── i18n.ts                # 多语言（en / zh-cn）
├── statusBar.ts           # 状态栏
├── formatter.ts           # 引用格式化
├── anchorResolver.ts      # 锚点解析（行号漂移修正）
├── fileManager.ts         # 文件读写
├── snippetContext.ts      # 编辑器选区解析
└── snippetCodeLens.ts     # CodeLens（删除/跳转/展开/折叠）

scripts/
└── compile-prompt.ts      # 引用展开 CLI（esbuild 打包为全局命令）

<你的工作区>/
└── prompts/
    ├── feature-auth.md
    ├── bug-fix.md
    └── ...
```
