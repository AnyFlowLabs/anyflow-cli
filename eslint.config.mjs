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
    "plugin:import/typescript",
    "plugin:node/recommended",
    "plugin:promise/recommended",
)), {
    plugins: {
        "@typescript-eslint": fixupPluginRules(typescriptEslint),
        import: fixupPluginRules(_import),
        node: fixupPluginRules(node),
        promise: fixupPluginRules(promise),
    },

    settings: {
        "import/resolver": {
            typescript: {
                alwaysTryTypes: true,
                project: path.resolve(__dirname, './tsconfig.json'),
            },
            node: {
                extensions: ['.js', '.ts'],
                paths: ['src']
            }
        },
        "import/extensions": [".js", ".ts"],
        "import/parsers": {
            "@typescript-eslint/parser": [".ts"]
        }
    },

    languageOptions: {
        globals: {
            ...globals.node,
        },
        parser: tsParser,
        parserOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            project: "./tsconfig.json"
        }
    },

    rules: {
        indent: ["warn", 2],
        quotes: ["error", "single"],
        semi: ["warn", "always"],
        "no-console": "off",
        "node/no-missing-import": "off", // Disable this since TypeScript handles it
        "node/no-unsupported-features/es-syntax": ["error", {
            ignores: ["modules", "dynamicImport"]
        }],

        "@typescript-eslint/no-unused-vars": ["error", {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_"
        }],

        "import/order": ["error", {
            groups: ["builtin", "external", "internal"],
            "newlines-between": "always",
        }],

        "no-process-exit": "off", // Since this is a CLI tool, process.exit is acceptable
        "@typescript-eslint/no-explicit-any": "warn" // Downgrade to warning for now
    },
}];