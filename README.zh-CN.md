# dsh-status-card

一个 DeepSeek Harness 插件，要求 Agent 在每次回复前先内联渲染简短、动态的 `dsh-ui` 状态卡片。

## 设计

- 通过 `ctx.systemPrompt.section()` 注册回复格式指令。
- **不**调用 `agent.inject()`、不注册动态提示上下文、不追加会话消息，因此指令不会成为用户/助手对话历史。
- 使用 emoji 代替 Material Icons。
- 依赖 `@omdsh-dev/dsh-genui` 完成围栏内联渲染。

## 设置

打开 **设置 → 状态卡片**，可以：

- 启用或关闭卡片；
- 修改卡片标题；
- 选择内置 A–F 模板（以及基础模板）；
- 编辑自定义 GenUI JSON；
- 保存前实时查看渲染结果。

自定义模板必须是包含非空 `items` 数组的 JSON 对象，大小不得超过 64 KiB。独立的“卡片标题”设置会覆盖自定义模板根标题。

## 开发

```sh
pnpm install
pnpm run check
```
