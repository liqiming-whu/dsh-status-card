# dsh-status-card

A DeepSeek Harness plugin that contributes a short `dsh-ui` status-card instruction through `ctx.systemPrompt.section()`. The instruction is assembled into the system prompt and does not append user or assistant conversation-history events.

The renderer dependency is `@omdsh-dev/dsh-genui`.
