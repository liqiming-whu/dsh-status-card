# Agent Note: status-card injection

## Decision

Use `ctx.systemPrompt.section()` for the reply-format instruction. Do not use `agent.inject()`, `systemPrompt.context()`, or session events because the requirement is that the instruction must not become conversation history.

## Rendering

The instruction requires a strict inline `dsh-ui` fence and emoji icons. Rendering is provided by `@omdsh-dev/dsh-genui`.

## Verification

The injection test applies the plugin to a context exposing only `systemPrompt.section`, asserts the contributed section, and scans the source for history-producing APIs.
