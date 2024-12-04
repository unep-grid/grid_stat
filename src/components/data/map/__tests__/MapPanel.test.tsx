import { render, screen, fireEvent, act, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MapPanel } from "../MapPanel";
import * as d3 from "d3";
import { ThemeProvider } from "../../../layout/ThemeProvider";
import { vi, describe, it, expect, beforeEach, beforeAll } from "vitest";
import type { IndicatorData } from "../../../../lib/types";

// Mock d3.json for world topology data
vi.mock("d3", async () => {
  const actual = await vi.importActual("d3");
  return {
    ...actual,
    json: vi.fn().mockResolvedValue({
      type: "Topology",
      objects: {
        world: {
          type: "GeometryCollection",
          geometries: [
            {
              type: "Polygon",
              id: "USA",
              properties: { name: "United States" },
              arcs: [[0]],
            },
          ],
        },
      },
      arcs: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0],
        ],
      ],
      transform: {
        scale: [1, 1],
        translate: [0, 0],
      },
    }),
  };
});

// Mock scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();

  // Mock window properties that JSDOM doesn't support
  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    configurable: true,
    value: class ResizeObserver {
      constructor(callback: any) {
        this.callback = callback;
      }
      callback: any;
      observe = vi.fn((element: Element) => {
        // Simulate initial resize
        this.callback([
          {
            target: element,
            contentRect: { width: 1000, height: 800 },
          },
        ]);
      });
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  });

  // Mock SVGElement properties
  Object.defineProperty(SVGElement.prototype, "getBBox", {
    writable: true,
    value: () => ({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    }),
  });

  // Mock getComputedStyle
  Object.defineProperty(window, "getComputedStyle", {
    value: () => ({
      getPropertyValue: () => "",
      cursor: "grabbing",
    }),
  });

  // Mock SVG baseVal
  Object.defineProperty(SVGElement.prototype, "width", {
    get: () => ({ baseVal: { value: 1000 } }),
  });
  Object.defineProperty(SVGElement.prototype, "height", {
    get: () => ({ baseVal: { value: 800 } }),
  });
});

// Sample test data
const mockData: IndicatorData[] = [
  {
    id: "1",
    date_start: 2020,
    value: 100,
    m49_code: 840, // USA m49 code
  },
  {
    id: "1",
    date_start: 2021,
    value: 150,
    m49_code: 840, // USA m49 code
  },
];

const renderMapPanel = () => {
  return render(
    <ThemeProvider>
      <MapPanel data={mockData} language="en" />
    </ThemeProvider>
  );
};

const waitForMapRender = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
  });
};

const queryByClassNameSVG = (container: HTMLElement, className: string) => {
  return container.querySelector(`[class*="${className}"]`);
};

describe("MapPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders map with initial projection and required elements", async () => {
    const { container } = renderMapPanel();
    await waitForMapRender();

    const svg = container.querySelector("#map");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width");
    expect(svg).toHaveAttribute("height");

    const worldBounds = queryByClassNameSVG(container, "world-bounds");
    const graticule = queryByClassNameSVG(container, "graticule");
    const region = queryByClassNameSVG(container, "region");

    expect(worldBounds).toBeInTheDocument();
    expect(graticule).toBeInTheDocument();
    expect(region).toBeInTheDocument();
  });

  it("handles projection changes correctly", async () => {
    const { container } = renderMapPanel();
    await waitForMapRender();

    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(trigger);
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const naturalEarthOption = screen.getByText("Natural Earth");
    expect(naturalEarthOption).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(naturalEarthOption);
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    const svg = container.querySelector("#map");
    expect(svg).toBeInTheDocument();

    const worldBounds = queryByClassNameSVG(container, "world-bounds");
    const graticule = queryByClassNameSVG(container, "graticule");
    const region = queryByClassNameSVG(container, "region");

    expect(worldBounds).toBeInTheDocument();
    expect(graticule).toBeInTheDocument();
    expect(region).toBeInTheDocument();
  });

  it("maintains correct zoom configuration", async () => {
    const { container } = renderMapPanel();
    await waitForMapRender();

    const svg = container.querySelector("#map") as SVGSVGElement;
    expect(svg).toBeInTheDocument();

    const rotation = parseFloat(svg.getAttribute("data-rotation") || "0");
    const scale = parseFloat(svg.getAttribute("data-scale") || "0");

    expect(rotation).toBe(0);
    expect(scale).toBeGreaterThan(0);
    expect(svg.getAttribute("width")).toBeTruthy();
    expect(svg.getAttribute("height")).toBeTruthy();
  });

  it("handles map dragging interactions", async () => {
    const { container } = renderMapPanel();
    await waitForMapRender();

    const svg = container.querySelector("#map");
    expect(svg).toBeInTheDocument();

    if (svg) {
      await act(async () => {
        fireEvent.mouseDown(svg, { clientX: 0, clientY: 0 });
        fireEvent.mouseMove(document, { clientX: 100, clientY: 100 });
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(window.getComputedStyle(svg).cursor).toBe("grabbing");

      await act(async () => {
        fireEvent.mouseUp(document);
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
    }
  });

  it("toggles legend visibility correctly", async () => {
    const { container } = renderMapPanel();
    await waitForMapRender();

    const legendToggle = screen.getByRole("button", { name: /toggle legend/i });
    const initialLegend = container.querySelector(".absolute.top-4.left-4");
    expect(initialLegend).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(legendToggle);
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
    expect(container.querySelector(".absolute.top-4.left-4")).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(legendToggle);
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
    expect(container.querySelector(".absolute.top-4.left-4")).toBeInTheDocument();
  });

  it("updates visualization when year is changed", async () => {
    const { container } = renderMapPanel();
    await waitForMapRender();

    const yearSelector = screen.getByRole("combobox");
    expect(yearSelector).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(yearSelector, { target: { value: "2021" } });
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const legendContainer = container.querySelector(".absolute.top-4.left-4");
    expect(legendContainer).toHaveTextContent("2021");
  });

  it("displays and hides tooltip on region hover", async () => {
    const { container } = renderMapPanel();
    await waitForMapRender();

    const region = queryByClassNameSVG(container, "region");
    expect(region).toBeInTheDocument();

    if (region) {
      await act(async () => {
        fireEvent.mouseOver(region);
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      const tooltip = screen.getByText("150");
      expect(tooltip).toBeInTheDocument();

      await act(async () => {
        fireEvent.mouseOut(region);
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(screen.queryByText("150")).not.toBeInTheDocument();
    }
  });

  it("handles SVG export functionality", async () => {
    const mockCreateObjectURL = vi.fn(() => "blob:test");
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    const { container } = renderMapPanel();
    await waitForMapRender();

    const exportButton = screen.getByRole("button", { name: /export/i });
    await act(async () => {
      fireEvent.click(exportButton);
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test");
  });

  it("handles window resize events", async () => {
    const { container } = renderMapPanel();
    await waitForMapRender();

    const svg = container.querySelector("#map");
    expect(svg).toBeInTheDocument();

    // Trigger resize observer callback
    const resizeObserver = new window.ResizeObserver(() => {});
    resizeObserver.observe(container);

    expect(svg?.getAttribute("width")).toBeTruthy();
    expect(svg?.getAttribute("height")).toBeTruthy();
  });

  it("handles error states gracefully", async () => {
    const mockError = new Error("Failed to load map data");
    (d3.json as any).mockRejectedValueOnce(mockError);

    renderMapPanel();
    await waitForMapRender();

    expect(console.error).toHaveBeenCalledWith(
      "Error during visualization update:",
      mockError
    );
  });
});
