<h1 align="center">dsh-status-card</h1>

<p align="center">
  <strong>Add a polished, dynamic dsh-ui status card before every DeepSeek Harness agent reply</strong>
</p>

<p align="center">
  <a href="./README.md">简体中文</a> · English
</p>

## Features

- Renders an inline `dsh-ui` status card at the beginning of every agent reply.
- Injects formatting guidance through `ctx.systemPrompt.section()` without appending user or assistant conversation-history events.
- Uses emoji instead of Material Icons.
- Includes six templates: A Soft Vitality, B Minimal Focus, C Professional Work, D Neural Deck, E Warm Companion, and F Developer Runtime.
- Supports enable/disable, custom titles, and custom GenUI JSON templates.
- Provides a live settings preview and custom-template validation.
- Automatically detects the browser's preferred language: languages beginning with `zh` use Chinese for settings, built-in templates, and system-prompt injection; all other languages use English.
- Limits custom templates to 64 KiB and requires a non-empty `items` array.

## Six template previews

<table>
  <tr>
    <td width="50%"><strong>A · Soft Vitality</strong><br><img src="./docs/images/templates/en/template-a.svg" alt="Template A Soft Vitality English preview" width="560"></td>
    <td width="50%"><strong>B · Minimal Focus</strong><br><img src="./docs/images/templates/en/template-b.svg" alt="Template B Minimal Focus English preview" width="560"></td>
  </tr>
  <tr>
    <td width="50%"><strong>C · Professional Work</strong><br><img src="./docs/images/templates/en/template-c.svg" alt="Template C Professional Work English preview" width="560"></td>
    <td width="50%"><strong>D · Neural Deck</strong><br><img src="./docs/images/templates/en/template-d.svg" alt="Template D Neural Deck English preview" width="560"></td>
  </tr>
  <tr>
    <td width="50%"><strong>E · Warm Companion</strong><br><img src="./docs/images/templates/en/template-e.svg" alt="Template E Warm Companion English preview" width="560"></td>
    <td width="50%"><strong>F · Developer Runtime</strong><br><img src="./docs/images/templates/en/template-f.svg" alt="Template F Developer Runtime English preview" width="560"></td>
  </tr>
</table>

> These images reflect the current A–F templates' structure, copy, status values, and visual intent. Cards in agent replies are rendered by GenUI using the active interface theme.

## Requirements

- A DSH 0.2.x runtime whose relevant `@deepseek-ai/dsh-*` packages satisfy `>=0.2.0-rc.2 <0.3.0-0` (including `0.2.0-rc.2` and `0.2.1-rc.2`). This is v0.3.2's declared dependency range; see the validation limits below.
- Node.js satisfying `^22.19.0 || >=24.0.0` and `pnpm` satisfying `>=11.7.0 <12` available on `PATH` (the project specifies `pnpm@11.19.0`).
- A runtime-compatible version of `@changfenhuang/dsh-genui` separately installed and enabled in the profile you actually run (`web` for `dsh web`, `desktop` for the desktop app). Its source repository is [omdsh-dev/dsh-genui](https://github.com/omdsh-dev/dsh-genui); its package name in the **dsh-market plugin marketplace** is `@changfenhuang/dsh-genui`. The previously recorded local version **0.11.3** is historical installation information, not evidence of validation across all DSH 0.2.x hosts.

This plugin's `dsh.client.inject` declares `@changfenhuang/dsh-genui`, `@deepseek-ai/dsh-client-ui-settings`, and `@deepseek-ai/dsh-client-ui-renderer`. GenUI is not automatically fetched as a pnpm dependency; it remains a separate runtime prerequisite for rendering status-card fences.

> Without GenUI, the status-card formatting instruction is still injected, but `dsh-ui` fences in the conversation cannot render. Install and enable a GenUI version compatible with the current runtime first.

## Compatibility and release status

The current recommended version is the published **v0.3.2**: [Release v0.3.2](https://github.com/liqiming-whu/dsh-status-card/releases/tag/v0.3.2), published on 2026-10-20, provides `dsh-status-card-0.3.2.tgz`. This Release does not provide a `dsh-status-card.tgz` alias; use the versioned asset.

- **Declared dependencies**: relevant DSH peerDependencies now use `>=0.2.0-rc.2 <0.3.0-0`, and the removed `@deepseek-ai/dsh-client-ui-slots` peerDependency has been dropped. Other peer requirements remain `@deepseek-ai/cordis ~4.0.4`, `@deepseek-ai/schemastery ~3.18.4`, and `react ^18.0.0 || ^19.0.0`; see [package.json](./package.json) for the full configuration.
- **Local validation**: the Release notes record passing TypeScript checks and all local tests against DSH **0.2.1-rc.2** devDependencies. The earlier v0.3.1 local migration targeted **0.2.0-rc.2**.
- **Real-host validation**: the declared range and local test results do not establish end-to-end validation across all DSH host configurations or guarantee compatibility for every DSH/GenUI combination.

The current version continues to use Config fields and ConfigForms rather than the old Settings API. GenUI must still be installed and enabled separately.

## Historical fix (v0.3.1): read-only settings page

The following issues were fixed in v0.3.1, and v0.3.2 retains those fixes. This is historical context, not a list of known issues in the latest version.

- **Symptom**: after installation, the "Enable reply status card" checkbox and the template dropdown in the settings page were all greyed out and could not be operated.
- **Root cause**: `customTemplate` previously used `z.transform`. DSH projects every volatile field into a serialized form schema for the browser (the host-side `plainSchema` does `new z(schema.toJSON())` and then `form.toJSON()` again); once the callback is revived through `new Function` it no longer carries `toJSON`, so the second serialization drops it entirely, the browser decode reports `callback is not a function`, that namespace snapshot never reaches ready, and the page becomes read-only.
- **Fix 1**: `customTemplate` is a plain `z.string()` again; validation of custom JSON now happens in the settings page `parseCustomTemplate` before saving, with a defensive fallback in the injection layer (an invalid template falls back to the bootstrap template and never breaks prompt injection).
- **Fix 2**: the client no longer uses "decode state ready" as its editability criterion and looks only at the snapshot's `writable` (always true for this entry on the host side), so a single field's decode failure can no longer lock the whole page.
- **Conclusion / rule**: do not use `z.transform` for volatile settings fields.
- **Fix 3 (template spacing)**: `row` nodes in the templates no longer carry `gap`. GenUI's `row` schema accepts only `items`/`wrap`/`spacer` and fixes row spacing at 12px (`--dsl-g-gap-md`; only `col` supports `gap`), so the previous `gap: 8` was silently ignored and produced an unknown-field warning. The settings-page preview now matches GenUI too: `row`/`grid` are fixed at 12px, `col` reads its own `gap`, and the spec root `gap` defaults to 16px.
- **Regression test**: the test calls `@deepseek-ai/dsh-settings`' own `volatileForm` / `projectForm` / `plainConfig` to reproduce the host projection, then decodes it the way the browser does and asserts that decoding succeeds; it also walks every built-in template and asserts that no `row` node carries a `gap`.

Installations still running a version from before the fix need a plugin upgrade (v0.3.2 below is recommended), followed by restarting `dsh web` / the desktop app and a browser hard refresh; settings changes themselves still take effect immediately with no new conversation required.

## Installation (download from the Release)

### 1. Install GenUI

Open the **dsh-market plugin marketplace** and install the package name `@changfenhuang/dsh-genui`; alternatively, use the command line:

```sh
dsh plugin --profile web add @changfenhuang/dsh-genui
```

### 2. Install dsh-status-card

Download [dsh-status-card-0.3.2.tgz](https://github.com/liqiming-whu/dsh-status-card/releases/download/v0.3.2/dsh-status-card-0.3.2.tgz) from [Release v0.3.2](https://github.com/liqiming-whu/dsh-status-card/releases/tag/v0.3.2), then install it from the download directory:

```sh
dsh plugin --profile web add ./dsh-status-card-0.3.2.tgz
```

The desktop app uses the profile name `desktop` (`web` for `dsh web`). In both the GenUI and status-card installation commands above, replace `--profile` to match how you run DSH, and enable both plugins in that same profile.

You can also build from the `v0.3.2` tag's source. The tgz produced by `pnpm pack` is not guaranteed to be byte-identical to the Release asset: checkout line-ending settings, Node/pnpm versions, and platforms can affect the result. The earlier byte-for-byte re-verification of v0.3.1 is not a validation result for v0.3.2.

```sh
git clone https://github.com/liqiming-whu/dsh-status-card.git
cd dsh-status-card
git checkout v0.3.2
pnpm install
pnpm pack
dsh plugin --profile web add ./dsh-status-card-0.3.2.tgz
```

Restart `dsh web` or the desktop app after installation and hard-refresh the browser page.

## Historical versions

`v0.3.1` is the historical version targeting DSH `0.2.0-rc.2` and includes the settings-page fixes described above; earlier versions such as `v0.2.1` also remain in the repository. Install `v0.3.2` as the current recommendation. Consult [Releases](https://github.com/liqiming-whu/dsh-status-card/releases) for the historical assets actually available.

## Usage

Open **Settings → Status Card** to enable the card, change its title, select template A–F, edit strict custom GenUI JSON, and inspect the live preview before saving.

The browser reads `navigator.languages` (falling back to `navigator.language`) and writes the detected locale to the plugin Config. Preferred languages beginning with `zh` select Chinese; every other language selects English. The settings UI switches immediately, and the matching system prompt and templates are used for subsequent model requests.

The Client uses ConfigForms from `@deepseek-ai/dsh-client-ui-settings/client` and retrieves the form through `ctx.configForms.get('status-card')`. Settings are persisted in the profile patch by plugin entry id, not in an independent Settings namespace.

**Settings changes and synchronized browser-locale changes take effect immediately on subsequent model requests, including in existing conversations; no new conversation is required.** Installing the plugin still requires restarting `dsh web` or the desktop app and hard-refreshing the browser. Previously generated replies are not changed retroactively.

## Injection design

The plugin registers a system-prompt section through `ctx.systemPrompt.section()`. Every user-setting field in Config is marked `.volatile()`. During each prompt assembly, the Host reads current values through `entry.field.get()` (`field` stands for the relevant setting field) and builds the status-card instruction instead of caching an installation-time configuration snapshot. `sectionOrder` remains a plain number rather than a volatile setting field.

### 0.2.0-rc.2 API migration

- Remove the old `installSettingsSection`, `settingsNamespace`, and `settingsScope`; manage settings through Config / ConfigForms.
- Replace the old `dsh-client-runtime` / `web-react` usage: the Client Context type comes from `@deepseek-ai/cordis` (peer `~4.0.4`), and the type-only import `import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'` provides slots Service declaration augmentation. Do not use a side-effect import, which would leave a prohibited cross-plugin runtime require in the browser bundle.
- The `ConfigForm` type comes from `@deepseek-ai/dsh-client-ui-settings/client`. The migration originally targeted `0.2.0-rc.2`; v0.3.2 uses the DSH peer range `>=0.2.0-rc.2 <0.3.0-0` and pins the corresponding devDependencies to `0.2.1-rc.2`.

It does not call `agent.inject()`, register `systemPrompt.context()`, or append `user/message` / `assistant/message` events, so the formatting instruction does not accumulate in conversation history.

## Development and tests

```sh
git clone https://github.com/liqiming-whu/dsh-status-card.git
cd dsh-status-card
pnpm install
pnpm run check
pnpm pack
```

Tests cover non-history prompt injection, the Web settings bundle, the host projection and browser decode regression for volatile fields (`volatileForm` / `projectForm` / `plainConfig`), templates A–F, custom JSON validation, client-bundle purity, and Host/browser builds.

## Preview note

The settings preview is implemented locally rather than importing GenUI client values across plugin boundaries, preserving DSH client-bundle purity. Real conversation `dsh-ui` fences are rendered by GenUI.

## License

[MIT](./LICENSE)
