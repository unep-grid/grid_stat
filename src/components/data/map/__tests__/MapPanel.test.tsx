import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MapPanel } from "../MapPanel";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import * as d3 from "d3";

// Mock d3.json to return empty topology
vi.mock("d3", async () => {
  const actual = await vi.importActual("d3");
  return {
    ...actual,
    json: vi.fn().mockResolvedValue({
      type: "Topology",
      objects: { world: { type: "GeometryCollection", geometries: [] } },
    }),
  };
});

// Mock regions data
vi.mock("@/lib/utils/regions", () => ({
  unM49: [
    {
      type: 4,
      name: "France",
      code: "250",
      iso3166: "FRA",
      parent: "155",
    },
  ],
}));

const mockData = [
  {
    id: "1",
    m49_code: 250, // France
    date_start: 2020,
    value: 100,
  },
];

describe("MapPanel", () => {
  it("renders map container and toolbar", () => {
    render(
      <ThemeProvider>
        <MapPanel data={mockData} language="en" />
      </ThemeProvider>
    );

    // Check for SVG element with id="map"
    expect(document.querySelector("svg#map")).toBeInTheDocument();
    
    // Check for toolbar using class
    expect(document.querySelector(".map-toolbar")).toBeInTheDocument();
  });

  it("toggles legend visibility", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <MapPanel data={mockData} language="en" />
      </ThemeProvider>
    );

    // Find legend toggle button by its aria-label
    const legendToggle = screen.getByRole("button", { name: /toggle legend/i });
    
    // Check initial legend state using the legend title
    const initialLegend = screen.getByText("Legend 2020");
    expect(initialLegend).toBeInTheDocument();

    // Click toggle and verify legend is hidden
    await user.click(legendToggle);
    expect(screen.queryByText("Legend 2020")).not.toBeInTheDocument();
  });
});
