/**
 * @import {FlatXoConfig} from 'xo'
 */

/** @type {FlatXoConfig} */
const xoConfig = [
  {
    name: 'default',
    prettier: 'compat',
    rules: {
      'import-x/order': 'off',
      'jsdoc/check-indentation': 'off',
      'jsdoc/check-line-alignment': 'off',
      'jsdoc/informative-docs': 'off',
      'jsdoc/require-asterisk-prefix': 'off',
      'no-shadow': 'off',
      'prefer-arrow-callback': 'off',
      'regexp/prefer-named-capture-group': 'off',
      'require-unicode-regexp': 'off',
      'unicorn/better-dom-traversing': 'off',
      'unicorn/max-nested-calls': 'off',
      'unicorn/no-array-sort': 'off',
      'unicorn/no-computed-property-existence-check': 'off',
      'unicorn/no-immediate-mutation': 'off',
      // Wrong for replacer functions.
      'unicorn/no-unsafe-string-replacement': 'off',
      'unicorn/prefer-code-point': 'off',
      'unicorn/prefer-continue': 'off',
      'unicorn/prefer-string-replace-all': 'off',
      'unicorn/require-array-sort-compare': 'off',
      'unicorn/single-line-block-comment-style': 'off'
    },
    space: true
  },
  // Wrong.
  {ignores: ['**/*.md']},
  // Broken on purpose.
  {ignores: ['test/parse-error/']},
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/array-type': ['error', {default: 'generic'}],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      // `null` is allowed in options.
      '@typescript-eslint/no-restricted-types': 'off'
    }
  },
  {
    files: ['test/**/*.js'],
    rules: {
      'no-await-in-loop': 'off',
      // Wrong for generated files.
      'node-test/no-import-test-files': 'off'
    }
  },
  {
    files: ['package.json'],
    rules: {
      'package-json/no-orphan-types': 'off',
      'package-json/require-engines': 'off',
      'package-json/sort-files': 'off',
      'package-json/sort-properties': 'off'
    }
  }
]

export default xoConfig
