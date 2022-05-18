import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  target: 'es2017',
  legacyOutput: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
});
