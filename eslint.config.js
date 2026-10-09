import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', '**/dist/**', '**/coverage/**', 'design/**', '.code0/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: globals.node,
    },
    rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z]', argsIgnorePattern: '^_' }] },
  },
  { files: ['client/src/**/*.{js,jsx}'], languageOptions: { globals: globals.browser } },
];
