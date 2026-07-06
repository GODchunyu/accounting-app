import { expect, test } from "@playwright/test";

test("registers, records an expense, and shows it in detail and chart pages", async ({
  page,
}) => {
  const username = `e2e_${Date.now()}`;

  await page.goto("/");
  await page.getByRole("button", { name: "注册" }).first().click();
  await page.getByLabel("用户名").fill(username);
  await page.getByLabel("密码").fill("secret123");
  await page.getByRole("button", { name: "注册" }).last().click();

  await expect(page.getByRole("heading", { name: "明细" })).toBeVisible();
  await expect(page.getByRole("button", { name: /记账/ })).toBeVisible();

  await page.getByRole("button", { name: /记账/ }).click();
  await expect(page.getByRole("heading", { name: "记账" })).toBeVisible();
  await page.getByLabel("金额").fill("12.34");
  await page.getByPlaceholder("备注").fill("e2e smoke");
  await page.getByRole("button", { name: "完成" }).click();

  await expect(page.getByRole("heading", { name: "明细" })).toBeVisible();
  const billRow = page.locator(".bill-row", { hasText: "e2e smoke" });
  await expect(billRow).toBeVisible();
  await expect(billRow.getByText("-12.34")).toBeVisible();

  await page.getByRole("button", { name: /图表/ }).click();
  await expect(page.getByRole("heading", { name: "图表" })).toBeVisible();
  await expect(page.getByText("总金额")).toBeVisible();
  await expect(page.locator(".metric-grid").getByText("12.34")).toBeVisible();
  await expect(page.getByRole("img", { name: "月度趋势折线图" })).toBeVisible();
});
