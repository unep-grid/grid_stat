// Mock must be defined before imports
vi.mock("../projections", () => ({
  projections: [{ name: "Mollweide", value: () => {} }],
  primaryProjections: [{ name: "Mollweide", value: () => {} }],
  additionalProjections: [{ name: "Mollweide", value: () => {} }],
}));

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { MapPanel } from "../MapPanel";

const mockData = [
  {
    id: "1",
    m49_code: 250,
    date_start: 2020,
    value: 100,
  },
];

describe("MapPanel", () => {
  it("renders toolbar controls", () => {
    render(
      <ThemeProvider>
        <MapPanel data={mockData} language="en" />
      </ThemeProvider>
    );

    // Check for projection selector
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    
    // Check for legend toggle button
    expect(screen.getByRole("button", { name: /toggle legend/i })).toBeInTheDocument();
    
    // Check for export button
    expect(screen.getByRole("button", { name: /export svg/i })).toBeInTheDocument();
  });

  it("toggles legend visibility", async () => {
    const user = userEvent.setup();
    
    render(
      <ThemeProvider>
        <MapPanel data={mockData} language="en" />
      </ThemeProvider>
    );

    // Check initial legend state
    expect(screen.getByText("Legend 2020")).toBeInTheDocument();

    // Click toggle and verify legend is hidden
    const legendToggle = screen.getByRole("button", { name: /toggle legend/i });
    await user.click(legendToggle);
    
    expect(screen.queryByText("Legend 2020")).not.toBeInTheDocument();
  });

  it("shows correct initial projection", () => {
    render(
      <ThemeProvider>
        <MapPanel data={mockData} language="en" />
      </ThemeProvider>
    );

    const projectionButton = screen.getByRole("combobox");
    expect(projectionButton.textContent).toContain("Mollweide");
  });
});
