# Agent Note: status-card injection

## Compatibility and release status

The migration targets the locally installed DSH **0.2.0-rc.2** only. Plugin **0.3.1** is committed, tagged `v0.3.1`, and published as a GitHub Release whose assets are `dsh-status-card-0.3.1.tgz` and the same-bytes alias `dsh-status-card.tgz`. Building from source requires `git checkout v0.3.1` first — the default branch moves on — and is the **same source**, not a byte-identical rebuild: `pnpm pack` output depends on checkout settings, and with `core.autocrlf` in effect (effective `true` on this machine) the tracked text files are converted to CRLF at checkout while `lib/**` stays identical. The released asset was verified byte-for-byte against the tag blobs: 23 tracked files identical, 4 `lib/**` build outputs absent from the tag, and `package.json` differing only by `pnpm pack` normalization (drops `prepare` and `packageManager`). Historical Git tags include `v0.2.1`, which is not the recommendation for this runtime. The desktop app's profile is `desktop`, `dsh web` uses `web`.

Installing the plugin still requires reinstalling it (the Release asset, or `pnpm pack` from source) and restarting `dsh web` / the desktop app plus a hard browser refresh. Editing settings does not require restarting or creating a new conversation.

## Decision

Use `ctx.systemPrompt.section()` for the reply-format instruction. Do not use `agent.inject()`, `systemPrompt.context()`, or session events because the requirement is that the instruction must not become conversation history.

## Config / ConfigForms migration

Remove the old `installSettingsSection`, `settingsNamespace`, and `settingsScope`. There is no independent Settings namespace or separate Settings persistence path.

Mark every user-setting field in Config with `.volatile()`. The Host must call `entry.field.get()` for each relevant field during every prompt assembly rather than retaining a configuration snapshot. Here `field` means the relevant setting field. `sectionOrder` remains a plain number, not a volatile user-setting field.

The Client obtains the form through `ctx.configForms.get('status-card')`; the ConfigForms API and `ConfigForm` type come from `@deepseek-ai/dsh-client-ui-settings/client`. Persist changes in the profile patch by plugin entry id. Saved settings take effect on subsequent model requests, including in existing conversations; previously generated replies are not rewritten.

Do not use the old `dsh-client-runtime` / `web-react` imports. Import the Client Context type from `@deepseek-ai/cordis` (peer `~4.0.4`) and use the type-only import `import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'` to provide slots Service declaration augmentation. Do not use a side-effect import: it leaves a prohibited cross-plugin runtime require in the browser bundle. Corresponding DSH dependencies are pinned to exact version `0.2.0-rc.2`.

## 0.3.1 fix: read-only settings page

Symptom: after installation the "Enable reply status card" checkbox and the template dropdown were all greyed out and could not be operated.

Root cause: `customTemplate` had used `z.transform`. DSH projects each volatile field into a serialized form schema for the browser — host-side `plainSchema` does `new z(schema.toJSON())` and then `form.toJSON()` again — and a callback revived through `new Function` loses its `toJSON`, so the second serialization drops it, the browser decode throws `callback is not a function`, that namespace snapshot never reaches ready, and the page stays read-only.

Fix 1: `customTemplate` is a plain `z.string()` again. Custom JSON is validated by `parseCustomTemplate` in the settings UI before saving, with a defensive fallback at injection time (an invalid template falls back to the bootstrap template and never breaks prompt injection).

Fix 2: the client no longer treats decode-state readiness as the editability criterion; it reads only the snapshot's `writable` (always true for this entry on the Host side), so one field's decode failure cannot lock the whole page.

Rule: do not use `z.transform` for volatile settings fields.

Regression test: call `@deepseek-ai/dsh-settings`' own `volatileForm` / `projectForm` / `plainConfig` to reproduce the Host projection, then decode the result the way the browser does and assert that decoding succeeds. The fix reaches an existing installation only after reinstalling the plugin (local `pnpm pack`, then install the tgz) and restarting `dsh web` / the desktop app plus a hard browser refresh; settings edits themselves remain immediate.

## Rendering

The instruction requires a strict inline `dsh-ui` fence and emoji icons. Rendering is provided by `@changfenhuang/dsh-genui` (version **0.11.3** as actually installed locally; the source repository is still `omdsh-dev/dsh-genui`), which must be separately installed and enabled with a version compatible with the runtime. That package name comes from the package actually installed in the local profile, and `dsh.client.inject` has been synchronized to it. It remains a required runtime prerequisite, not an automatically installed pnpm dependency. The local settings preview must not import GenUI client values across plugin boundaries.

### Template nodes must stay inside GenUI's schema

GenUI's `row` schema accepts only `items`, `wrap` and `spacer`, and its renderer never reads `node.gap`: the row gap is fixed at 12px by `--dsl-g-gap-md`. Only `col` supports `gap` (`src/client/blocks/render-node.tsx` applies it as an inline style), and `grid` is fixed at 12px as well. The spec root's own `gap` **is** supported (`GenuiBlock.tsx` reads `spec.gap ?? 16`). A `gap` on a `row` is therefore silently dropped and raises an unknown-field warning, which is why no built-in template may carry one; the local preview mirrors the same semantics so it cannot overstate the spacing. The template test walks every built-in template in both locales and fails on a `row` gap, so this cannot be reintroduced quietly.

## Browser locale synchronization

The browser client resolves its preferred language from the first non-empty `navigator.languages` entry, with `navigator.language` as fallback. Values beginning with `zh` map to `zh`; every other value maps to `en`. The client writes only this normalized locale through the plugin Config form. Host prompt assembly reads the current locale through the volatile field getter and selects a fully localized instruction and built-in template without adding conversation events. Locale synchronization takes effect on subsequent model requests without requiring a new conversation.

Default titles (`AI 状态` / `AI Status`) follow the detected locale, while any genuinely custom title remains unchanged. Custom JSON remains user-owned; only the shipped default custom template is localized automatically.

## Verification

Verify that prompt assembly reads current volatile fields, persisted profile patches are keyed by entry id, and settings and locale updates affect the next request in an existing conversation. Verify that every volatile field survives the Host form projection and the browser decode (see the 0.3.1 fix above) so the settings page stays writable. Verify Chinese and English contributions, browser-language normalization, and absence of history-producing APIs. Template and client-bundle tests should cover both languages and retain client-bundle purity checks. These are verification requirements, not a claim that tests were run during documentation editing.
