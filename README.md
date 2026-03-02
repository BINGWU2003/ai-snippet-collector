# AI Snippet Collector

**AI Snippet Collector** 是一款 VS Code 扩展，帮助你将代码片段整理收集到 Markdown 提示词文件中，方便随时粘贴给 Copilot、Claude、ChatGPT 等 AI 助手提供上下文。

## 功能特性

- **添加到指定文件** — 选中代码后，将其追加到 `prompts/` 目录下的任意提示词文件；支持在选择器中直接创建新文件。
- **添加到上次文件** — 一键追加到最近使用的文件；若无历史记录，自动降级进入文件选择流程。
- **智能 QuickPick** — 在选择框中直接输入文件名即可新建，无需额外弹窗；列表实时过滤已有文件。
- **状态栏快捷入口** — 右下角常驻显示当前目标文件名，点击即可快速追加。
- **保存后一键打开** — 保存成功的提示中提供「打开文件」按钮，直接跳转查看。
- **未选中文字时的兜底** — 若没有选中任何文本，提示用户是否使用当前行，而非直接报错。
- **多语言界面** — 支持**英文**和**简体中文**，可通过设置独立配置，无需更改 VS Code 语言。

## 使用方法

### 收集代码片段

1. 在编辑器中选中任意代码。
2. 右键菜单，选择：
   - **AI Snippet: 添加到指定提示词文件…** — 选择或新建目标文件。
   - **AI Snippet: 添加到上次使用的提示词文件** — 直接追加，无需选择。
3. 片段将以格式化的 Markdown 块保存到 `<工作区>/prompts/` 目录下：

````markdown
---

**Location:** `src/utils/helpers.ts` (Lines: 12-30)

```typescript
// 你选中的代码
```
````

### 命令面板

按 `Ctrl+Shift+P`，搜索 `AI Snippet` 即可访问所有命令。

## 配置项

| 配置项                        | 可选值                    | 默认值 | 说明                                             |
| ----------------------------- | ------------------------- | ------ | ------------------------------------------------ |
| `aiSnippetCollector.language` | `auto` \| `en` \| `zh-cn` | `auto` | 界面语言。`auto` 跟随 VS Code 界面语言自动选择。 |

## 环境要求

- VS Code **1.90.0** 及以上版本。

## 本地开发

### 前置条件

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)（推荐）或 npm

### 安装依赖

```bash
pnpm install
```

### 启动调试（扩展宿主）

1. 用 VS Code 打开项目根目录。
2. 按 `F5` 启动扩展宿主窗口（等同于 `Run Extension` 启动配置）。
3. 在新弹出的 **扩展开发宿主** 窗口中测试扩展功能。

### 监听模式（实时编译）

开发时推荐同时启动 esbuild 和 tsc 的监听，文件保存后自动重新编译：

```bash
pnpm run watch
```

> 启动后按 `Ctrl+Shift+F5` 重新载入扩展宿主窗口，即可看到最新代码效果。

### 类型检查 & 代码检查

```bash
# 仅 TypeScript 类型检查
pnpm run check-types

# ESLint 检查
pnpm run lint
```

### 运行测试

```bash
pnpm run test
```

### 打包为 .vsix

需要先安装 `@vscode/vsce`：

```bash
pnpm add -D @vscode/vsce
# 或全局安装
npm install -g @vscode/vsce
```

然后执行：

```bash
# 先编译
pnpm run package

# 再打包为 .vsix
vsce package
```

打包完成后，在 VS Code 中选择 **扩展 → 从 VSIX 安装…** 选中生成的 `.vsix` 文件即可本地安装。

## 文件结构

```
<你的工作区>/
└── prompts/
    ├── feature_auth.md
    ├── bug_fix.md
    └── ...
```
