# dsh-status-card

<p align="center">
  <strong>为 DeepSeek Harness 的每次 Agent 回复添加精美、动态的 dsh-ui 状态卡片</strong>
</p>

<p align="center">
  简体中文 · <a href="./README_EN.md">English</a>
</p>

## 功能

- 在每次 Agent 回复正文开头输出内联 `dsh-ui` 状态卡片。
- 通过 `ctx.systemPrompt.section()` 注入格式指令，不追加用户或助手对话历史。
- 使用 emoji 代替 Material Icons。
- 内置六款模板：A 软萌活力、B 极简专注、C 专业工作、D 星舰科技、E 温暖陪伴、F 开发者终端。
- 支持启用开关、自定义卡片标题和自定义 GenUI JSON 模板。
- 设置页提供实时卡片预览和自定义模板校验。
- 自定义模板限制为 64 KiB，必须包含非空 `items` 数组。

## 六款模板预览

<table>
  <tr>
    <td width="50%"><strong>A · 软萌活力</strong><br><img src="./docs/images/templates/zh/template-a.svg" alt="模板 A 软萌活力中文预览" width="560"></td>
    <td width="50%"><strong>B · 极简专注</strong><br><img src="./docs/images/templates/zh/template-b.svg" alt="模板 B 极简专注中文预览" width="560"></td>
  </tr>
  <tr>
    <td width="50%"><strong>C · 专业工作</strong><br><img src="./docs/images/templates/zh/template-c.svg" alt="模板 C 专业工作中文预览" width="560"></td>
    <td width="50%"><strong>D · 星舰科技</strong><br><img src="./docs/images/templates/zh/template-d.svg" alt="模板 D 星舰科技中文预览" width="560"></td>
  </tr>
  <tr>
    <td width="50%"><strong>E · 温暖陪伴</strong><br><img src="./docs/images/templates/zh/template-e.svg" alt="模板 E 温暖陪伴中文预览" width="560"></td>
    <td width="50%"><strong>F · 开发者终端</strong><br><img src="./docs/images/templates/zh/template-f.svg" alt="模板 F 开发者终端中文预览" width="560"></td>
  </tr>
</table>

> 展示图根据当前内置 A–F 模板的结构、文案、状态值和视觉语义生成；模型回复中的实际卡片由 GenUI 按当前界面主题渲染。

## 前置要求

- 已安装 DeepSeek Harness。
- `pnpm` 可从终端运行。
- Web profile 已安装并启用 [`@omdsh-dev/dsh-genui`](https://github.com/omdsh-dev/dsh-genui)。该依赖已经发布到 **dsh-market 插件市场**，可以直接在市场中搜索并下载安装，无需手动输入 GitHub 地址。

本项目依赖：

```json
"@omdsh-dev/dsh-genui": "github:omdsh-dev/dsh-genui"
```

> pnpm 11 默认启用 `blockExoticSubdeps`。由于本项目和 GenUI 使用 GitHub 依赖，请在 `~/.dsh/profiles/web/pnpm-workspace.yaml` 顶层加入 `blockExoticSubdeps: false`。该设置与 `allowBuilds` 相互独立。

## 从 GitHub 安装

### 1. 安装 GenUI

可以直接打开 **dsh-market 插件市场**，搜索 `@omdsh-dev/dsh-genui` 并点击安装；也可以使用命令行：

```sh
dsh plugin --profile web add "git+https://github.com/omdsh-dev/dsh-genui.git"
```

### 2. 安装状态卡片插件

推荐固定到稳定 Release：

```sh
dsh plugin --profile web add "git+https://github.com/liqiming-whu/dsh-status-card.git#v0.1.0"
```

安装最新主分支：

```sh
dsh plugin --profile web add "git+https://github.com/liqiming-whu/dsh-status-card.git"
```

安装完成后重启 `dsh web`，并在浏览器中硬刷新页面。

## 从 Release 安装包安装

从 [Releases](https://github.com/liqiming-whu/dsh-status-card/releases) 下载 `dsh-status-card-0.1.0.tgz`，然后执行：

```sh
dsh plugin --profile web add ./dsh-status-card-0.1.0.tgz
```

## 使用

打开 **设置 → 状态卡片**：

1. 启用或关闭回复状态卡片。
2. 修改卡片标题。
3. 从模板库选择 A–F。
4. 选择“自定义模板”以编辑严格的 GenUI JSON。
5. 在设置页查看实时预览，校验通过后保存。

设置会通过 DSH Settings 服务持久化。**安装插件或修改设置后，请新建一个会话才能生效；已有会话不保证应用新的状态卡片配置。**

## 注入机制

插件注册系统提示段：

```ts
ctx.systemPrompt.section({
  name: 'status-card',
  order: 90,
  text: () => buildStatusCardInstruction(settings),
})
```

插件不调用 `agent.inject()`、不注册 `systemPrompt.context()`，也不追加 `user/message` 或 `assistant/message`，因此状态卡片格式指令不会积累进对话历史。

## 开发与测试

```sh
git clone https://github.com/liqiming-whu/dsh-status-card.git
cd dsh-status-card
pnpm install
pnpm run check
pnpm pack
```

测试覆盖非历史注入、设置面板、A–F 与自定义模板、自定义 JSON 校验、客户端 bundle 纯度，以及 Host/浏览器构建。

## 说明

设置页预览由本插件本地实现，不跨插件导入 GenUI 客户端值，以遵守 DSH 客户端 bundle 纯度约束。聊天中的真实 `dsh-ui` 围栏由 GenUI 渲染。

## License

[MIT](./LICENSE)
