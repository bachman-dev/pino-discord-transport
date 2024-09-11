import bachmanDev from "@bachman-dev/eslint-config";
import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // Replace output folder if needed, e.g. "dist"
    ignores: ["dist/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  bachmanDev({ language: "typescript", allowConsole: true }),
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*.js"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ["**/*.js"],
    ...bachmanDev({ language: "javascript-in-typescript" }),
  },
  eslintConfigPrettier,
);
