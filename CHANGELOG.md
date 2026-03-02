# 更新日志

**AI Snippet Collector** 的所有重要变更均记录于此。

格式参考 [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)。

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
- **QuickPick 资源释放** — 隐藏时自动调用 `dispose()`，防止内存泄漏。
- **模块化代码结构** — 逻辑拆分为 `constants`、`i18n`、`statusBar`、`formatter`、`fileManager`、`snippetContext` 等独立模块。
