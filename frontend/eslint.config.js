import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // This codebase fetches data with plain useEffect + useState (no
      // react-query/SWR/`use()`+Suspense). That is exactly the "synchronize
      // with an external system" case react.dev/learn/you-might-not-need-an-effect
      // itself lists as a valid effect — not the derived-state anti-pattern
      // this rule targets. Downgraded to a warning rather than reworked
      // call-by-call across the app.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Node-executed config files (not bundled, not part of the browser app)
    files: ['*.config.js', 'playwright.config.js', 'vite.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // Vitest test files — add vi/describe/expect/etc. on top of the browser globals
    files: ['src/test-setup.js', 'src/**/*.test.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.vitest, ...globals.node },
    },
  },
])
