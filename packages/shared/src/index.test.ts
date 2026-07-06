import { describe, expect, it } from "vitest";
import { authRules, defaultCategories, imageUploadRules } from "./index.js";

describe("shared constants", () => {
  it("include expense and income categories", () => {
    expect(
      defaultCategories.some((category) => category.type === "expense"),
    ).toBe(true);
    expect(
      defaultCategories.some((category) => category.type === "income"),
    ).toBe(true);
  });

  it("match PRD validation constraints", () => {
    expect(authRules.minUsernameLength).toBe(3);
    expect(authRules.minPasswordLength).toBe(6);
    expect(imageUploadRules.maxFiles).toBe(1);
    expect(imageUploadRules.maxBytes).toBe(5 * 1024 * 1024);
  });
});
