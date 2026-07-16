import next from "@next/eslint-plugin-next";
import { defineConfig, globalIgnores } from "eslint/config";
import prettierConfig from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

// Composed from the plugins directly rather than eslint-config-next, which
// still pulls in eslint-plugin-react. That plugin calls context.getFilename(),
// removed in eslint 10, and crashes on load. See vercel/next.js#89764.
const eslintConfig = defineConfig([
  next.configs["core-web-vitals"],
  reactHooks.configs.flat["recommended-latest"],
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    files: ["**/*.mjs"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ["scripts/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
    },
  },
  prettierConfig,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/components/ui/**",
  ]),
]);

export default eslintConfig;
