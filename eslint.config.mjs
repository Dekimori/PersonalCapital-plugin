import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

const sharedGlobals = {
  window: "readonly",
  document: "readonly",
  console: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  require: "readonly",
  module: "readonly",
  exports: "writable",
  process: "readonly",
  Buffer: "readonly",
  fetch: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  crypto: "readonly",
  globalThis: "readonly",
  Promise: "readonly",
  Map: "readonly",
  Set: "readonly",
  WeakMap: "readonly",
  WeakSet: "readonly",
};

export default [
  {
    ignores: ["main.js", "node_modules/**", "dist/**", "tests/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: sharedGlobals,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-nocheck": "allow-with-description",
          "ts-expect-error": "allow-with-description",
          "ts-ignore": "allow-with-description",
          minimumDescriptionLength: 5,
        },
      ],
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-prototype-builtins": "off",
    },
  },
  // Lenient rules for legacy JS files (will be migrated to TS gradually)
  {
    files: ["**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-useless-escape": "off",
      "no-useless-assignment": "off",
    },
  },
  // Transitional .ts files (ui/ subtree) keep their original lazy-require
  // patterns until properly typed file-by-file. Same lenience as JS.
  {
    files: ["src/ui/components/**/*.ts", "src/ui/modals/**/*.ts", "src/ui/settings.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
      "no-useless-escape": "off",
      "no-useless-assignment": "off",
    },
  },
];
