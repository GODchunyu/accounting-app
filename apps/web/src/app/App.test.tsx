import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders the four confirmed core tabs", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: /明细/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /图表/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /记账/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /我的/ })).toBeInTheDocument();
  });
});

