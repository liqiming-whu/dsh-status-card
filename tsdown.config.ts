import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    outDir: 'lib',
    external: [/^@deepseek-ai\//, /^@omdsh-dev\//],
  },
  {
    entry: { client: 'src/client/index.tsx' },
    format: ['cjs'],
    platform: 'browser',
    dts: true,
    outDir: 'lib',
    external: [/^@deepseek-ai\//, /^@omdsh-dev\//, /^react(?:\/.*)?$/],
    banner: 'window.__ModuleLoader__.load({ id: "dsh-status-card", factory: (require) => { var module = { exports: {} }; var exports = module.exports;',
    footer: 'return module.exports; } });',
  },
])
