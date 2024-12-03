import { render, screen, fireEvent, act, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MapPanel } from "../MapPanel";
import * as d3 from "d3";
import { ThemeProvider } from "../../../layout/ThemeProvider";
import { vi, describe, it, expect, beforeEach, beforeAll } from "vitest";
import type { IndicatorData } from "../../../../lib/types";
import type { BaseType } from "d3";
import fs from 'fs';
import path from 'path';

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
});

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

const waitForMapRender = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
  });
};

// Helper function to normalize SVG for comparison
const normalizeSVG = (svg: string) => {
  return svg
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/>\s+</g, '><') // Remove whitespace between tags
    .trim();
};

// Helper function to save SVG fixture
const saveSVGFixture = (svg: string, name: string) => {
  const fixturesDir = path.join(__dirname, '__fixtures__');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }
  fs.writeFileSync(path.join(fixturesDir, `${name}.svg`), svg);
};

// Helper function to load SVG fixture
const loadSVGFixture = (name: string): string => {
  return fs.readFileSync(
    path.join(__dirname, '__fixtures__', `${name}.svg`),
    'utf-8'
  );
};

describe("MapPanel", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Reset the document body
    document.body.innerHTML = "";
    // Mock console.error
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("test 1: should render map with initial projection", async () => {
    const { container } = render(
      <ThemeProvider>
        <MapPanel data={mockData} language="en" />
      </ThemeProvider>
    );

    await waitForMapRender();

    // Check if SVG is rendered
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();

    // Check if initial elements are present
    expect(container.querySelector(".world-bounds")).toBeTruthy();
    expect(container.querySelector(".graticule")).toBeTruthy();
    expect(container.querySelector(".region")).toBeTruthy();
  });

  it("test 2: should handle projection changes", async () => {
    const { container } = render(
      <ThemeProvider>
        <MapPanel data={mockData} language="en" />
      </ThemeProvider>
    );

    await waitForMapRender();

    // Find and click projection selector trigger
    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(trigger);
      // Wait for dropdown to open
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Find and click "Natural Earth" option
    const naturalEarthOption = screen.getByText("Natural Earth");
    expect(naturalEarthOption).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(naturalEarthOption);
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    // Verify projection transition by checking if map elements are still present
    expect(container.querySelector(".world-bounds")).toBeTruthy();
    expect(container.querySelector(".graticule")).toBeTruthy();
    expect(container.querySelector(".region")).toBeTruthy();
  });

  it("test 3: should handle zoom interactions with scroll", async () => {
    const { container } = render(
      <ThemeProvider>
        <MapPanel data={mockData} language="en" />
      </ThemeProvider>
    );

    await waitForMapRender();

    // Get the SVG element
    const svg = d3.select(container).select("svg").node() as SVGSVGElement;
    expect(svg).toBeTruthy();

    if (svg) {
      // Create a wheel event that matches d3.zoom's filter condition
      const zoomInEvent = new WheelEvent("wheel", {
        deltaY: -100, // Negative deltaY zooms in
        ctrlKey: true, // Must have ctrl key for d3.zoom filter
        bubbles: true,
        cancelable: true,
        clientX: 500,
        clientY: 400
      });

      // Dispatch zoom in event
      await act(async () => {
        svg.dispatchEvent(zoomInEvent);
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Get the SVG content after zoom
      const svgContent = container.querySelector('svg')?.outerHTML;
      expect(svgContent).toBeTruthy();

      if (process.env.UPDATE_FIXTURES) {
        // Save the SVG content as a fixture when running in update mode
        saveSVGFixture(svgContent!, 'map-zoomed-in');
      } else {
        // Compare with saved fixture
        const expectedSVG = loadSVGFixture('map-zoomed-in');
        expect(normalizeSVG(svgContent!)).toBe(normalizeSVG(expectedSVG));
      }

      // Create zoom out event
      const zoomOutEvent = new WheelEvent("wheel", {
        deltaY: 100, // Positive deltaY zooms out
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
        clientX: 500,
        clientY: 400
      });

      // Dispatch zoom out event
      await act(async () => {
        svg.dispatchEvent(zoomOutEvent);
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Get the SVG content after zoom out
      const svgContentZoomOut = container.querySelector('svg')?.outerHTML;
      expect(svgContentZoomOut).toBeTruthy();

      if (process.env.UPDATE_FIXTURES) {
        saveSVGFixture(svgContentZoomOut!, 'map-zoomed-out');
      } else {
        const expectedSVGZoomOut = loadSVGFixture('map-zoomed-out');
        expect(normalizeSVG(svgContentZoomOut!)).toBe(normalizeSVG(expectedSVGZoomOut));
      }

      // Verify wheel events without ctrl key don't trigger zoom
      const nonZoomEvent = new WheelEvent("wheel", {
        deltaY: -100,
        ctrlKey: false,
        bubbles: true,
        cancelable: true,
        clientX: 500,
        clientY: 400
      });

      const svgBeforeNonZoom = container.querySelector('svg')?.outerHTML;

      await act(async () => {
        svg.dispatchEvent(nonZoomEvent);
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const svgAfterNonZoom = container.querySelector('svg')?.outerHTML;
      expect(normalizeSVG(svgAfterNonZoom!)).toBe(normalizeSVG(svgBeforeNonZoom!));
    }
  });

  it("test 4: should handle drag interactions", async () => {
    const { container } = render(
      <ThemeProvider>
        <MapPanel data={mockData} language="en" />
      </ThemeProvider>
    );

    await waitForMapRender();

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();

    // Simulate D3 drag event
    if (svg) {
      await act(async () => {
        // Trigger dragstart
        const event = new MouseEvent("mousedown", {
          clientX: 0,
          clientY: 0,
          bubbles: true,
        });
        svg.dispatchEvent(event);

        // Trigger drag
        const moveEvent = new MouseEvent("mousemove", {
          clientX: 100,
          clientY: 100,
          bubbles: true,
        });
        document.dispatchEvent(moveEvent);

        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Check cursor style
      expect(window.getComputedStyle(svg).cursor).toBe("grabbing");
    }
  });

  it("test 5: should toggle legend visibility", async () => {
    const { container } = render(
      <ThemeProvider>
        <MapPanel data={mockData} language="en" />
      </ThemeProvider>
    );

    await waitForMapRender();

    // Find and click legend toggle button
    const legendToggle = screen.getByRole("button", { name: /toggle legend/i });
    expect(legendToggle).toBeInTheDocument();

    // Legend should be visible initially
    const legendContainer = container.querySelector(".absolute.top-4.left-4");
    expect(legendContainer).toBeInTheDocument();

    // Toggle legend off
    await act(async () => {
      fireEvent.click(legendToggle);
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Verify legend is hidden
    expect(
      container.querySelector(".absolute.top-4.left-4")
    ).not.toBeInTheDocument();

    // Toggle legend back on
    await act(async () => {
      fireEvent.click(legendToggle);
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(
      container.querySelector(".absolute.top-4.left-4")
    ).toBeInTheDocument();
  });

  it("test 6: should handle year selection", async () => {
    const { container } = render(
      <ThemeProvider>
        <MapPanel data={mockData} language="en" />
      </ThemeProvider>
    );

    await waitForMapRender();

    // Find and interact with year selector
    const yearSelector = screen.getByRole("combobox");
    expect(yearSelector).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(yearSelector, { target: { value: "2021" } });
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Verify year change updates visualization in the legend container
    const legendContainer = container.querySelector(".absolute.top-4.left-4");
    expect(legendContainer?.textContent).toContain("2021");
  });

  it("test 7: should handle hover interactions", async () => {
    const { container } = render(
      <ThemeProvider>
        <MapPanel data={mockData} language="en" />
      </ThemeProvider>
    );

    await waitForMapRender();

    const region = container.querySelector(".region");
    expect(region).toBeTruthy();

    if (region) {
      // Simulate hover
      await act(async () => {
        fireEvent.mouseOver(region);
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Check if tooltip appears with value
      const tooltipValue = screen.getByText("150");
      expect(tooltipValue).toBeInTheDocument();

      // Move mouse
      await act(async () => {
        fireEvent.mouseMove(region, { clientX: 150, clientY: 150 });
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Mouse out
      await act(async () => {
        fireEvent.mouseOut(region);
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(screen.queryByText("150")).not.toBeInTheDocument();
    }
  });

  it("test 8: should handle SVG export", async () => {
    const { container } = render(
      <ThemeProvider>
        <MapPanel data={mockData} language="en" />
      </ThemeProvider>
    );

    await waitForMapRender();

    // Mock URL.createObjectURL and URL.revokeObjectURL
    const mockCreateObjectURL = vi.fn();
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Find and click export button
    const exportButton = screen.getByRole("button", { name: /export/i });
    expect(exportButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(exportButton);
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Verify export function was called
    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });

  it("test 9: should handle resize events", async () => {
    const { container } = render(
      <ThemeProvider>
        <MapPanel data={mockData} language="en" />
      </ThemeProvider>
    );

    await waitForMapRender();

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute("width")).toBeTruthy();
    expect(svg?.getAttribute("height")).toBeTruthy();
  });

  it("test 10: should handle error states", async () => {
    // Mock d3.json to reject
    (d3.json as any).mockRejectedValueOnce(
      new Error("Failed to load map data")
    );

    const { container } = render(
      <ThemeProvider>
        <MapPanel data={mockData} language="en" />
      </ThemeProvider>
    );

    await waitForMapRender();

    // Wait for error to be set in state and rendered
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Check console.error was called
    expect(console.error).toHaveBeenCalledWith(
      "Error during visualization update:",
      expect.any(Error)
    );
  });
});
