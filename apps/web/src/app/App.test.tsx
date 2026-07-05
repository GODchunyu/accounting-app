import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

describe("App", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("renders the four confirmed core tabs", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: /明细/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /图表/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /记账/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /我的/ })).toBeInTheDocument();
  });

  it("registers and stores the returned token", async () => {
    vi.spyOn(window, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          data: {
            token: "jwt-token",
            user: { id: "user_1", username: "alice", nickname: "alice" }
          }
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      )
    );

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "注册" }));
    fireEvent.change(screen.getByLabelText("用户名"), { target: { value: "alice" } });
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "secret123" } });
    fireEvent.click(screen.getAllByRole("button", { name: "注册" })[1]);

    await waitFor(() => expect(screen.getByRole("heading", { name: "alice" })).toBeInTheDocument());
    expect(window.localStorage.getItem("accounting_token")).toBe("jwt-token");
  });
});
