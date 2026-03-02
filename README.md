# AI Snippet Collector

**AI Snippet Collector** 是一款 VS Code 扩展，帮助你将代码片段整理收集到 Markdown 提示词文件中，方便随时提供给 Copilot、Claude、ChatGPT 等 AI 助手作为上下文。

## 功能特性

| 功能                     | 说明                                                             |
| ------------------------ | ---------------------------------------------------------------- |
| 📎 **添加到指定文件**    | 选中代码后追加到 `prompts/` 下的任意文件，支持直接在选择器中新建 |
| ⚡ **添加到上次文件**    | 一键追加到最近使用的文件，无历史时自动降级为文件选择流程         |
| 🔍 **智能 QuickPick**    | 直接输入文件名即可新建，列表实时过滤已有文件，无需额外弹窗       |
| 🗑️ **CodeLens 删除按钮** | 打开提示词文件时，每个片段顶部显示删除按钮，一键移除整段         |
| 🔗 **跳转到源码**        | CodeLens 同时提供「跳转到源码」按钮，直接定位到采集时的原始行    |
| 📌 **状态栏快捷入口**    | 右下角常驻显示当前目标文件名，点击即可快速追加                   |
| 💾 **保存后一键打开**    | 保存成功提示中附带「打开文件」按钮，直接跳转查看                 |
| 🌐 **多语言界面**        | 支持英文和简体中文，可独立配置，无需更改 VS Code 语言            |

## 使用方法

### 1. 收集代码片段

1. 在编辑器中选中任意代码（若未选中，会询问是否使用当前行）。
2. 右键菜单，选择其中一项：
   - **AI Snippet: 添加到指定提示词文件…** — 通过 QuickPick 选择或新建目标文件。
   - **AI Snippet: 添加到上次使用的提示词文件** — 直接追加，无需任何选择。
3. 片段以格式化的 Markdown 块保存至 `<工作区>/prompts/` 目录：

````markdown
---

**Location:** `src/utils/helpers.ts` (Lines: 12-30)

```typescript
// 你选中的代码
```
````

### 2. 管理已收集的片段

打开 `prompts/` 目录下的 `.md` 文件，每个片段顶部会出现两个 CodeLens 按钮：

- **`$(trash) 删除此片段`** — 点击后自动删除整个片段块（含前后空行）。
- **`$(go-to-file) 跳转到源码`** — 点击后打开源文件并定位到采集时的起始行。

### 3. 命令面板

按 `Ctrl+Shift+P`，搜索 `AI Snippet` 即可访问所有命令。

## 配置项

| 配置项                        | 可选值                    | 默认值 | 说明                                             |
| ----------------------------- | ------------------------- | ------ | ------------------------------------------------ |
| `aiSnippetCollector.language` | `auto` \| `en` \| `zh-cn` | `auto` | 界面语言。`auto` 跟随 VS Code 界面语言自动选择。 |

> 配置路径：VS Code 设置 → 搜索 **AI Snippet Collector**

## 环境要求

- VS Code **1.90.0** 及以上版本。

## 本地开发

### 前置条件

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)（推荐）或 npm

### 快速开始

```bash
# 安装依赖
pnpm install

# 启动监听模式（esbuild + tsc 并行）
pnpm run watch
```

然后按 `F5` 启动扩展宿主窗口，在弹出的 **扩展开发宿主** 中测试功能。修改代码保存后，按 `Ctrl+Shift+F5` 重载即可看到最新效果。

### 常用命令

```bash
pnpm run check-types   # TypeScript 类型检查
pnpm run lint          # ESLint 检查
pnpm run test          # 运行测试
pnpm run vsix          # 编译 + 打包为 .vsix（需已安装 @vscode/vsce）
```

### 打包安装

```bash
# 首次需安装 vsce（已在 devDependencies 中）
pnpm install

# 一步完成编译 + 打包
pnpm run vsix
```

打包完成后，VS Code 中选择 **扩展 → 从 VSIX 安装…** 选中生成的 `.vsix` 文件即可。

## 文件结构

```
src/
├── extension.ts       # 入口，注册命令和 CodeLens 提供器
├── constants.ts       # 共享常量
├── i18n.ts            # 多语言翻译（en / zh-cn）
├── statusBar.ts       # 状态栏管理
├── formatter.ts       # AI Markdown 格式化
├── fileManager.ts     # 文件读写（异步 I/O）
├── snippetContext.ts  # 编辑器选区获取
└── snippetCodeLens.ts # CodeLens 提供器（删除 / 跳转）

<你的工作区>/
└── prompts/
    ├── feature_auth.md
    ├── bug_fix.md
    └── ...
```
