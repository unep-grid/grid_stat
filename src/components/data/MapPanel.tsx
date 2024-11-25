/**
 * Map projection interpolation implementation inspired by:
 * "Interpolating D3 Map Projections" by Herman Sontrop
 * https://observablehq.com/d/0fadbba834367bb5
 */
import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import type { IndicatorData } from "../../lib/types";
import type { Language } from "../../lib/utils/translations";
import { t } from "../../lib/utils/translations";
import * as d3 from "d3";
import type { Topology, GeometryCollection } from "topojson-specification";
import { feature } from "topojson-client";
import { unM49 } from "../../lib/utils/regions";
import { Slider } from "../ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface MapPanelProps {
  data: IndicatorData[];
  language: Language;
}

interface CountryGeometry {
  type: string;
  id: string;
  properties: {
    name: string;
  };
  arcs: number[][];
}

interface WorldTopology
  extends Topology<{
    world: GeometryCollection<CountryGeometry>;
  }> {
  type: "Topology";
}

// Available projections
const projections = {
  "Azimuthal Equal Area": "geoAzimuthalEqualAreaRaw",
  "Azimuthal Equidistant": "geoAzimuthalEquidistantRaw",
  "Equal Earth": "geoEqualEarthRaw",
  "Equirectangular": "geoEquirectangularRaw",
  "Mercator": "geoMercatorRaw",
  "Natural Earth": "geoNaturalEarth1Raw",
  "Orthographic": "geoOrthographicRaw",
  "Stereographic": "geoStereographicRaw",
} as const;

type ProjectionType = keyof typeof projections;

// Projection interpolation function (from Observable example by Herman Sontrop)
function interpolateProjection(raw0: any, raw1: any) {
  const mutate = d3.geoProjectionMutator(t => (x, y) => {
    const [x0, y0] = raw0(x, y), [x1, y1] = raw1(x, y);
    return [x0 + t * (x1 - x0), y0 + t * (y1 - y0)];
  });
  let t = 0;
  return Object.assign(mutate(t), {
    alpha(_?: number) {
      return arguments.length ? mutate(t = +_!) : t;
    }
  });
}

export function MapPanel({ data, language }: MapPanelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const worldDataRef = useRef<WorldTopology | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentProjection, setCurrentProjection] = useState<ProjectionType>("Equal Earth");

  // Get available years from data
  const years = useMemo(() => {
    const uniqueYears = [...new Set(data.map((d) => d.date_start))].sort();
    return uniqueYears;
  }, [data]);

  // Initialize with latest year
  const [selectedYear, setSelectedYear] = useState<number>(
    years[years.length - 1] || 0
  );

  const docStyle = getComputedStyle(document.documentElement);
  const color1 = `hsl(${docStyle
    .getPropertyValue("--foreground")
    .trim()
    .split(" ")
    .join(",")})`;
  const color2 = `hsl(${docStyle
    .getPropertyValue("--background")
    .trim()
    .split(" ")
    .join(",")})`;

  // Calculate global min/max across all years
  const globalExtent = useMemo(() => {
    const allValues = data.map((d) => d.value);
    return d3.extent(allValues) as [number, number];
  }, [data]);

  // Create color scale using global extent
  const colorScale = useMemo(() => {
    if (globalExtent[0] === undefined || globalExtent[1] === undefined || data.length === 0) {
      return () => color2;
    }

    const scale = d3
      .scaleLinear()
      .domain(globalExtent)
      .range([0.2, 0.8]); // Use a range between 0.2 and 0.8 to avoid too dark/light colors

    const colorInterpolator = (t: number) => {
      return d3.interpolateHsl(color2, color1)(t);
    };

    return (value: number) => colorInterpolator(scale(value));
  }, [globalExtent, color1, color2, data]);

  // Convert M49 codes to ISO3166 and prepare data for visualization
  const countryData = useMemo(() => {
    const dataMap = new Map();
    const yearData = data.filter((d) => d.date_start === selectedYear);
    yearData.forEach((d) => {
      const m49Code = d.m49_code.toString().padStart(3, "0");
      const region = unM49.find((r) => r.code === m49Code);
      if (region?.iso3166) {
        dataMap.set(region.iso3166, {
          value: d.value,
          name: region.name,
        });
      }
    });
    return dataMap;
  }, [data, selectedYear]);

  // Handle projection change with animation
  const handleProjectionChange = useCallback((newProjection: ProjectionType) => {
    if (!svgRef.current || !worldDataRef.current) return;

    const container = svgRef.current.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const scale = width / 6;

    const oldProjectionRaw = (d3 as any)[projections[currentProjection]];
    const newProjectionRaw = (d3 as any)[projections[newProjection]];

    const projection = interpolateProjection(oldProjectionRaw, newProjectionRaw)
      .scale(scale)
      .translate([width / 2, height / 2])
      .rotate([0, 0])
      .precision(0.1);

    const path = d3.geoPath(projection);

    // Animate the transition
    d3.select(svgRef.current)
      .selectAll("path.country")
      .transition()
      .duration(1000)
      .attrTween("d", function(d: any) {
        return function(t: number) {
          projection.alpha(t);
          return path(d)!;
        };
      })
      .on("end", () => setCurrentProjection(newProjection));
  }, [currentProjection]);

  // Memoize the visualization update function
  const updateVisualization = useCallback(async () => {
    if (!svgRef.current) return;

    try {
      const container = svgRef.current.parentElement;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      const scale = width / 6;

      // Load world map data if not already loaded
      if (!worldDataRef.current) {
        worldDataRef.current = await d3.json<WorldTopology>(
          "/grid_stat/world-110m.json"
        );
        if (!worldDataRef.current) {
          throw new Error("Failed to load world map data");
        }
      }

      // Clear previous content
      d3.select(svgRef.current).selectAll("*").remove();

      // Create SVG and define patterns
      const svg = d3
        .select(svgRef.current)
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height)
        .style("max-width", "100%")
        .style("height", "auto");

      const defs = svg.append("defs");

      // Create color gradient for legend and map
      const gradient = defs
        .append("linearGradient")
        .attr("id", "color-gradient")
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "0%");

      // Add gradient stops
      const stops = d3.range(0, 1.1, 0.1);
      stops.forEach((stop) => {
        gradient
          .append("stop")
          .attr("offset", `${stop * 100}%`)
          .attr("stop-color", colorScale(d3.quantile(globalExtent, stop) || 0));
      });
      
      // Diagonal lines pattern for no data
      defs
        .append("pattern")
        .attr("id", "hatch")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", 4)
        .attr("height", 4)
        .append("path")
        .attr("d", "M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2")
        .attr("stroke", color1)
        .attr("stroke-width", 0.5)
        .attr("stroke-opacity", 0.2);

      // Create projection
      const projectionRaw = (d3 as any)[projections[currentProjection]];
      const projection = d3.geoProjection(projectionRaw)
        .scale(scale)
        .translate([width / 2, height / 2])
        .rotate([0, 0])
        .precision(0.1);

      const path = d3.geoPath(projection);

      const countries = feature(
        worldDataRef.current,
        worldDataRef.current.objects.world
      );

      // Draw countries
      svg
        .selectAll("path.country")
        .data(countries.features)
        .join("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", (d: any) => {
          const data = countryData.get(d.id);
          return data ? colorScale(data.value) : "url(#hatch)";
        })
        .attr("stroke", color1)
        .attr("stroke-width", 0.3)
        .style("cursor", (d: any) =>
          countryData.get(d.id) ? "pointer" : "default"
        )
        .style("transition", "fill 0.2s ease-in-out");

    } catch (err) {
      console.error("Error during visualization update:", err);
      setError(err instanceof Error ? err.message : "Failed to load map");
    }
  }, [data, language, countryData, colorScale, color1, globalExtent, currentProjection]);

  // Initial render and resize handling
  useEffect(() => {
    updateVisualization();

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateVisualization);
    });

    if (svgRef.current?.parentElement) {
      resizeObserver.observe(svgRef.current.parentElement);
    }

    // Update on theme changes
    const observer = new MutationObserver(() => {
      requestAnimationFrame(updateVisualization);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      resizeObserver.disconnect();
      observer.disconnect();
    };
  }, [updateVisualization]);

  // Handle error state
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-destructive">
          {t("dv.map_error", language)}: {error}
        </div>
      </div>
    );
  }

  // Handle no data case
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{t("dv.no_data", language)}</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full w-full gap-4 p-4">
      {/* Title Section */}
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-xl font-semibold">{selectedYear}</h2>
      </div>

      {/* Time Slider Section */}
      <div className="flex flex-col gap-2 px-8">
        <Slider
          value={[selectedYear]}
          min={years[0]}
          max={years[years.length - 1]}
          step={1}
          onValueChange={(value) => setSelectedYear(value[0])}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{years[0]}</span>
          <span>{years[years.length - 1]}</span>
        </div>
      </div>

      {/* Map Section */}
      <div className="flex-grow relative">
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ minHeight: "400px" }}
        />
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none opacity-0 bg-popover text-popover-foreground p-2 rounded-md shadow-md transition-opacity border"
          style={{
            zIndex: 1000,
            maxWidth: "200px",
            transform: "translate(-50%, -100%)",
            transition: "opacity 0.15s ease-in-out",
          }}
        />
      </div>

      {/* Legend and Projection Selector Section */}
      {globalExtent[0] !== undefined && globalExtent[1] !== undefined && data.length > 0 && (
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span>{globalExtent[0].toLocaleString()}</span>
            <div
              className="h-2 w-40 rounded"
              style={{
                background: "url(#color-gradient)",
              }}
            >
              <svg width="100%" height="100%">
                <rect width="100%" height="100%" fill="url(#color-gradient)" />
              </svg>
            </div>
            <span>{globalExtent[1].toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="20" height="10">
              <rect width="20" height="10" fill="url(#hatch)" />
            </svg>
            <span className="text-muted-foreground">No data</span>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={currentProjection}
              onValueChange={(value: ProjectionType) => handleProjectionChange(value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select projection" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(projections).map((proj) => (
                  <SelectItem key={proj} value={proj}>
                    {proj}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
