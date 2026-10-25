import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'node_modules/', '.omc/'] },
  js.configs.recommended,
  {
    files: ['**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['public/js/**/*.js'],
    languageOptions: { sourceType: 'module', globals: globals.browser },
  },
];
