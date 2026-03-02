# AI Snippet Collector

**AI Snippet Collector** 是一款为 AI 辅助研发工作流设计的 VS Code 扩展。它不复制代码内容，而是在提示词文件中保存**代码引用指针**，配合终端脚本在发给 AI 之前实时拉取最新代码——文件改了、重构了，上下文永远是最新的。

## 核心理念

```
收集时：只存路径 + 行号（极轻量）
发送前：脚本实时读取磁盘，注入最新代码
```

## 功能特性

| 功能                   | 说明                                                  |
| ---------------------- | ----------------------------------------------------- |
| 📎 **添加到指定文件**  | 选中代码后追加代码引用到 `prompts/`，支持直接新建文件 |
| ⚡ **添加到上次文件**  | 一键追加，无历史时自动降级为文件选择                  |
| 🔍 **智能 QuickPick**  | 直接输入文件名即可新建，列表实时过滤                  |
| 🗑️ **一键删除片段**    | 打开提示词文件后，每个引用顶部显示删除按钮            |
| 🔗 **跳转到源码**      | CodeLens 按钮直接定位到采集时的原始行                 |
| 🔍 **展开 / 折叠代码** | 随时展开为当前最新代码预览，或折叠回轻量引用          |
| 📌 **状态栏快捷入口**  | 右下角常驻显示当前目标文件，点击即可追加              |
| 🌐 **多语言界面**      | 支持英文和简体中文，可独立配置                        |

## 工作流

### 第一步：收集代码引用

1. 在编辑器中选中代码（未选中时提示使用当前行）。
2. 按快捷键或右键菜单：
   - `Ctrl+Alt+A` — 追加到上次使用的文件（最常用）
   - `Ctrl+Alt+Shift+A` — 选择或新建目标文件
3. 提示词文件只写入一行轻量引用：

```markdown
---

**File:** `src/views/admin/index.vue` (Lines: 12-45)
```

多个引用叠加，再补上你的问题：

```markdown
---
**File:** `src/views/admin/index.vue` (Lines: 12-45)

---

**File:** `src/components/Table.vue` (Lines: 100-120)

帮我看看为什么子组件没触发 emit？
```

### 第二步：发给 AI 前编译

使用 `compile-prompt` 脚本，**在你按下回车的瞬间**读取磁盘最新代码，展开所有引用：

```bash
# 编译并复制到剪贴板（Windows）
pnpm compile-prompt prompts/current.md | clip

# 编译并发给 Claude CLI
pnpm compile-prompt prompts/current.md | claude

# 编译并保存到临时文件
pnpm compile-prompt prompts/current.md > /tmp/compiled.md
```

输出结果：

````markdown
---

**File:** `src/views/admin/index.vue` (Lines: 12-45)

```vue
// 当前磁盘的最新代码（不是采集时的代码）
```
````

### 第三步：管理提示词文件

打开 `prompts/` 目录下的 `.md` 文件，每个引用顶部出现 CodeLens 按钮：

```
$(trash) 删除此片段   $(go-to-file) 跳转到源码   $(expand-all) 展开代码
---
**File:** `src/extension.ts` (Lines: 8-20)
```

展开后切换为折叠按钮：

````
$(trash) 删除此片段   $(go-to-file) 跳转到源码   $(collapse-all) 折叠代码
---
**File:** `src/extension.ts` (Lines: 8-20)
```typescript
// 当前代码实时展示
````

````

## 快捷键

| 操作 | Windows / Linux | macOS |
|------|----------------|-------|
| 添加到上次文件 | `Ctrl+Alt+A` | `Cmd+Alt+A` |
| 添加到指定文件 | `Ctrl+Alt+Shift+A` | `Cmd+Alt+Shift+A` |

## 配置项

| 配置项 | 可选值 | 默认值 | 说明 |
|--------|--------|--------|------|
| `aiSnippetCollector.language` | `auto` \| `en` \| `zh-cn` | `auto` | 界面语言，`auto` 跟随 VS Code 界面语言 |

> VS Code 设置 → 搜索 **AI Snippet Collector**

## 工作区配置建议

为避免 Prettier 等格式化工具在保存时破坏 `prompts/` 下的引用格式，建议在你的工作区 `.vscode/settings.json` 中禁用 Markdown 的保存时格式化：

```json
{
  "[markdown]": {
    "editor.formatOnSave": false
  }
}
```

## 环境要求

- VS Code **1.90.0** 及以上

## 本地开发

### 快速开始

```bash
pnpm install
pnpm run watch   # 启动 esbuild + tsc 监听
````

按 `F5` 启动扩展宿主，修改代码后 `Ctrl+Shift+F5` 重载。

### 常用命令

```bash
pnpm run check-types      # TypeScript 类型检查
pnpm run lint             # ESLint 检查
pnpm run test             # 运行测试
pnpm run vsix             # 编译 + 打包为 .vsix
pnpm compile-prompt <file> # 编译 prompt 文件（需安装 tsx）
```

## 文件结构

```
src/
├── extension.ts           # 入口，注册命令和 CodeLens
├── constants.ts           # 共享常量
├── i18n.ts                # 多语言（en / zh-cn）
├── statusBar.ts           # 状态栏
├── formatter.ts           # 引用格式化
├── fileManager.ts         # 文件读写
├── snippetContext.ts      # 编辑器选区解析
└── snippetCodeLens.ts     # CodeLens（删除/跳转/展开/折叠）

scripts/
└── compile-prompt.ts      # 引用展开脚本（tsx 运行）

<你的工作区>/
└── prompts/
    ├── feature-auth.md
    ├── bug-fix.md
    └── ...
```
