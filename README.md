# dsh-status-card

A DeepSeek Harness plugin that asks the agent to render a short, dynamic `dsh-ui` status card before every reply.

## Design

- Registers the reply-format instruction through `ctx.systemPrompt.section()`.
- Does **not** call `agent.inject()`, register prompt contexts, or append session messages; therefore the instruction does not become user/assistant conversation history.
- Uses emoji instead of Material Icons.
- Depends on `@omdsh-dev/dsh-genui` for inline fence rendering.

## Settings

Open **Settings → Status Card** to:

- enable or disable the card;
- change its title;
- select built-in template A–F (plus the bootstrap template);
- edit a custom GenUI JSON template;
- preview the rendered result live before saving.

Custom templates must be a JSON object with a non-empty `items` array and must be no larger than 64 KiB. The separate card-title setting overrides the custom template root title.

## Development

```sh
pnpm install
pnpm run check
```
