// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: [
    'expo',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'import'],
  root: true,
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  ignorePatterns: ['/dist/*', '/public/*', '/babel-plugins/*'],
  env: {
    browser: true,
  },
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_",
      "caughtErrorsIgnorePattern": "^_"
    }],
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/prefer-as-const": "warn",
    "@typescript-eslint/no-var-requires": "off",
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-empty-object-type": "off",
    "@typescript-eslint/no-wrapper-object-types": "off",
    "@typescript-eslint/ban-tslint-comment": "warn",
    "react/no-unescaped-entities": "off",
    "import/no-unresolved": "off",
    "import/namespace": "off",
    "prefer-const": "warn",
    "react/prop-types": "off",
    "no-case-declarations": "warn",
    "no-empty": ["warn", { "allowEmptyCatch": true }],
    "react/display-name": "off",
    "no-constant-condition": "warn",
    "no-var": "warn",
    "no-useless-escape": "warn"
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.web.ts', '.web.tsx'],
      },
    },
  },
  overrides: [
    {
      files: ['metro.config.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off'
      }
    }
  ]
};
