import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import _import from "eslint-plugin-import";
import node from "eslint-plugin-node";
import promise from "eslint-plugin-promise";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [...fixupConfigRules(compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:node/recommended",
    "plugin:promise/recommended",
)), {
    plugins: {
        "@typescript-eslint": fixupPluginRules(typescriptEslint),
        import: fixupPluginRules(_import),
        node: fixupPluginRules(node),
        promise: fixupPluginRules(promise),
    },

    languageOptions: {
        globals: {
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: 2020,
        sourceType: "module",
    },

    rules: {
        indent: ["warn", 2],
        quotes: ["error", "single"],
        semi: ["warn", "always"],
        "no-console": "off",

        "@typescript-eslint/no-unused-vars": ["error", {
            argsIgnorePattern: "^_",
        }],

        "import/order": ["error", {
            groups: ["builtin", "external", "internal"],
            "newlines-between": "always",
        }],

        "node/no-unsupported-features/es-syntax": ["error", {
            ignores: ["modules"],
        }],
    },
}];