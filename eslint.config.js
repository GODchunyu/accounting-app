import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "**/dist/**",
      "build/**",
      "coverage/**",
      "apps/api/generated/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
);
