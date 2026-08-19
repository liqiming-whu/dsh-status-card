# Agent Note: status-card injection

## Decision

Use `ctx.systemPrompt.section()` for the reply-format instruction. Do not use `agent.inject()`, `systemPrompt.context()`, or session events because the requirement is that the instruction must not become conversation history.

## Rendering

The instruction requires a strict inline `dsh-ui` fence and emoji icons. Rendering is provided by `@omdsh-dev/dsh-genui`.

## Browser locale synchronization

The browser client resolves its preferred language from the first non-empty `navigator.languages` entry, with `navigator.language` as fallback. Values beginning with `zh` map to `zh`; every other value maps to `en`. The client writes only this normalized locale to the existing `status-card` settings namespace. Host prompt assembly reads the persisted locale and selects a fully localized instruction and built-in template without adding conversation events.

Default titles (`AI 状态` / `AI Status`) follow the detected locale, while any genuinely custom title remains unchanged. Custom JSON remains user-owned; only the shipped default custom template is localized automatically.

## Verification

The injection test applies the plugin to a context exposing only `systemPrompt.section`, asserts Chinese and English contributions, checks browser-language normalization, and scans the source for history-producing APIs. Template and client-bundle tests assert both languages.
