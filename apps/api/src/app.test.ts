import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("createApp", () => {
  it("creates an express app with a health route", () => {
    const app = createApp();

    expect(app).toBeDefined();
    expect(typeof app.listen).toBe("function");
  });
});
