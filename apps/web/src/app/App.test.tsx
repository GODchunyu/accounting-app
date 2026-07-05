import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

const ok = (data: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  );

const created = (data: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify({ ok: true, data }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    })
  );

const noContent = () => Promise.resolve(new Response(null, { status: 204 }));

const fixtures = {
  auth: {
    token: "jwt-token",
    user: { id: "user_1", username: "alice", nickname: "alice" }
  },
  books: { books: [{ id: "book_1", name: "默认账本", isDefault: true }] },
  categories: {
    categories: [
      { id: "cat_expense", type: "expense", name: "餐饮", icon: "food", sort: 1, isActive: true },
      { id: "cat_income", type: "income", name: "工资", icon: "salary", sort: 1, isActive: true }
    ]
  },
  bills: {
    bills: [
      {
        id: "bill_1",
        bookId: "book_1",
        categoryId: "cat_expense",
        type: "expense",
        amount: "12.00",
        remark: "午餐",
        imageUrl: null,
        happenedAt: "2026-07-05T12:00:00.000Z"
      }
    ]
  },
  emptyBills: { bills: [] },
  stats: {
    stats: {
      income: "0.00",
      expense: "12.00",
      balance: "-12.00",
      averageDailyIncome: "0.00",
      averageDailyExpense: "0.39",
      trend: [{ date: "2026-07-01", income: "0.00", expense: "0.00" }]
    }
  },
  ranks: { categories: [{ categoryId: "cat_expense", categoryName: "餐饮", icon: "food", amount: "12.00", percent: 100 }] }
};

function mockApi() {
  return vi.spyOn(window, "fetch").mockImplementation((input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url.endsWith("/auth/register")) return created(fixtures.auth);
    if (url.endsWith("/users/me")) return ok({ user: fixtures.auth.user });
    if (url.endsWith("/books")) return ok(fixtures.books);
    if (url.endsWith("/categories")) return ok(fixtures.categories);
    if (url.includes("/bills") && method === "POST") return created({ bill: fixtures.bills.bills[0] });
    if (url.includes("/bills") && method === "DELETE") return noContent();
    if (url.includes("/bills")) return ok(fixtures.bills);
    if (url.includes("/stats/monthly")) return ok(fixtures.stats);
    if (url.includes("/stats/categories")) return ok(fixtures.ranks);

    return ok({});
  });
}

describe("App", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("renders the four confirmed core tabs after auth restore", async () => {
    window.localStorage.setItem("accounting_token", "jwt-token");
    mockApi();

    render(<App />);

    await waitFor(() => expect(screen.getByRole("button", { name: /明细/ })).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /图表/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /记账/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /我的/ })).toBeInTheDocument();
  });

  it("registers, stores token, and enters the four-page app", async () => {
    mockApi();

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "注册" }));
    fireEvent.change(screen.getByLabelText("用户名"), { target: { value: "alice" } });
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "secret123" } });
    fireEvent.click(screen.getAllByRole("button", { name: "注册" })[1]);

    await waitFor(() => expect(screen.getByRole("heading", { name: "明细" })).toBeInTheDocument());
    expect(window.localStorage.getItem("accounting_token")).toBe("jwt-token");

    fireEvent.click(screen.getByRole("button", { name: /记账/ }));
    fireEvent.change(screen.getByLabelText("金额"), { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: "完成" }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "明细" })).toBeInTheDocument());
  });

  it("confirms before deleting a bill", async () => {
    window.localStorage.setItem("accounting_token", "jwt-token");
    const fetchMock = mockApi();
    const confirmMock = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<App />);

    await waitFor(() => expect(screen.getByText("午餐")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "删除" }));

    expect(confirmMock).toHaveBeenCalledWith("确认删除这笔账单？");
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining("/bills/bill_1"), expect.objectContaining({ method: "DELETE" }));
  });
});
