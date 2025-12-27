try {
  const cfg = require('../eslint.config.js');
  module.exports = cfg && cfg.default ? cfg.default : cfg;
} catch (e) {
  const path = require('path');
  module.exports = {
    root: true,
    ignorePatterns: ['**/vitest.config.*', 'babel.config.js', 'node_modules', '**/*.html', 'test-setup.ts'],
    overrides: [
      {
        files: ['**/*.ts'],
        parser: '@typescript-eslint/parser',
        parserOptions: { ecmaVersion: 2021, sourceType: 'module', project: path.resolve(__dirname, '../tsconfig.lint.json') },
        plugins: ['@typescript-eslint'],
        extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
        rules: { semi: ['error', 'always'], quotes: ['error', 'single'] }
      }
    ]
  };
}