import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import type { IndicatorData } from "../../lib/types";
import type { Language } from "../../lib/utils/translations";
import { t } from "../../lib/utils/translations";
import * as d3 from "d3";
import type { Topology, GeometryCollection } from "topojson-specification";
import { feature } from "topojson-client";
import { unM49 } from "../../lib/utils/regions";
import { interpolateProjection } from "../../lib/utils/projection";
import { Slider } from "../ui/slider";
import { useTheme } from "../layout/ThemeProvider";
import type { Feature, Geometry } from "geojson";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

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

interface WorldBounds extends Feature<Geometry> {
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
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
  "Stereographic": "geoStereographicRaw"
} as const;

type ProjectionType = keyof typeof projections;

// Create world bounds feature
const createWorldBounds = (): WorldBounds => ({
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-179, -89],
        [-179, 89],
        [179, 89],
        [179, -89],
        [-179, -89]
      ]
    ]
  },
  properties: {}
});

export function MapPanel({ data, language }: MapPanelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const worldDataRef = useRef<WorldTopology | null>(null);
  const projectionRef = useRef<d3.GeoProjection | null>(null);
  const cachedBoundsPathRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentProjection, setCurrentProjection] =
    useState<ProjectionType>("Equal Earth");

  // Use theme context for colors
  const { colors } = useTheme();

  // Get available years from data
  const years = useMemo(() => {
    const uniqueYears = [...new Set(data.map((d) => d.date_start))].sort();
    return uniqueYears;
  }, [data]);

  // Initialize with latest year
  const [selectedYear, setSelectedYear] = useState<number>(
    years[years.length - 1] || 0
  );

  // Calculate global min/max across all years
  const globalExtent = useMemo(() => {
    const allValues = data.map((d) => d.value);
    return d3.extent(allValues) as [number, number];
  }, [data]);

  // Create color scale using global extent
  const colorScale = useMemo(() => {
    if (
      globalExtent[0] === undefined ||
      globalExtent[1] === undefined ||
      data.length === 0
    ) {
      return () => colors.background;
    }

    const scale = d3.scaleLinear().domain(globalExtent).range([0.2, 0.8]);

    const colorInterpolator = (t: number) => {
      return d3.interpolateHsl(colors.background, colors.foreground)(t);
    };

    return (value: number) => colorInterpolator(scale(value));
  }, [globalExtent, colors.background, colors.foreground, data]);

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

  // Calculate and cache the world bounds path for the current projection
  const calculateWorldBoundsPath = useCallback((projection: d3.GeoProjection) => {
    const originalRotation = projection.rotate();
    projection.rotate([0, 0, 0]); // Reset rotation to calculate bounds
    const path = d3.geoPath(projection);
    const worldBounds = createWorldBounds();
    const boundsPath = path(worldBounds) || "";
    projection.rotate(originalRotation); // Restore original rotation
    return boundsPath;
  }, []);

  // Update map paths with current projection
  const updateMapPaths = useCallback(() => {
    if (!svgRef.current || !projectionRef.current) return;

    const path = d3.geoPath(projectionRef.current);
    
    // Update country paths
    d3.select(svgRef.current)
      .selectAll<SVGPathElement, Feature<Geometry>>("path.country")
      .attr("d", (d) => path(d) || "");

    // Update world bounds with cached path
    if (cachedBoundsPathRef.current) {
      d3.select(svgRef.current)
        .select("path.world-bounds")
        .attr("d", cachedBoundsPathRef.current);
    }
  }, []);

  // Handle drag interaction
  const handleDrag = useCallback(
    (event: d3.D3DragEvent<SVGSVGElement, null, null>) => {
      if (!projectionRef.current) return;

      const sensitivityX = 5; // Horizontal movement sensitivity
      const sensitivityY = 5; // Vertical movement sensitivity

      const [λ, φ, γ] = projectionRef.current.rotate();

      // Update rotation based on drag movement
      projectionRef.current.rotate([
        λ + event.dx / sensitivityX,
        φ - event.dy / sensitivityY,
        γ,
      ]);

      updateMapPaths();
    },
    [updateMapPaths]
  );

  // Handle projection change with animation
  const handleProjectionChange = useCallback(
    (newProjection: ProjectionType) => {
      if (!svgRef.current || !worldDataRef.current || !projectionRef.current)
        return;

      const container = svgRef.current.parentElement;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      const scale = width / 6;

      // Get current rotation before changing projection
      const currentRotation = projectionRef.current.rotate();

      const oldProjectionRaw = (d3 as any)[projections[currentProjection]];
      const newProjectionRaw = (d3 as any)[projections[newProjection]];

      const projection = interpolateProjection(
        oldProjectionRaw,
        newProjectionRaw
      )
        .scale(scale)
        .translate([width / 2, height / 2])
        .rotate(currentRotation)
        .precision(0.1);

      projectionRef.current = projection;
      
      // Calculate and cache the new bounds path
      cachedBoundsPathRef.current = calculateWorldBoundsPath(projection);

      const path = d3.geoPath(projection);

      // Animate the transition
      d3.select(svgRef.current)
        .selectAll<SVGPathElement, Feature<Geometry>>("path.country")
        .transition()
        .duration(1000)
        .attrTween("d", function (d) {
          return function (t: number) {
            projection.alpha(t);
            return path(d) || "";
          };
        })
        .on("end", () => {
          setCurrentProjection(newProjection);
          // Update the world bounds after animation
          if (cachedBoundsPathRef.current) {
            d3.select(svgRef.current)
              .select("path.world-bounds")
              .attr("d", cachedBoundsPathRef.current);
          }
        });
    },
    [currentProjection, calculateWorldBoundsPath]
  );

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
        const response = await d3.json<WorldTopology>(
          "/grid_stat/world-110m.json"
        );
        if (!response) {
          throw new Error("Failed to load world map data");
        }
        worldDataRef.current = response;
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

      // Add drag behavior
      const dragBehavior = d3
        .drag<SVGSVGElement, null>()
        .on("drag", handleDrag);

      svg.call(dragBehavior as any);

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
        .attr("stroke", colors.foreground)
        .attr("stroke-width", 0.5)
        .attr("stroke-opacity", 0.2);

      // Create projection
      const projectionRaw = (d3 as any)[projections[currentProjection]];
      const projection = d3
        .geoProjection(projectionRaw)
        .scale(scale)
        .translate([width / 2, height / 2])
        .rotate(projectionRef.current?.rotate() || [0, 0, 0])
        .precision(0.1);

      projectionRef.current = projection;

      // Calculate and cache the initial bounds path
      cachedBoundsPathRef.current = calculateWorldBoundsPath(projection);

      const path = d3.geoPath(projection);

      // Create a group for the map
      const mapGroup = svg.append("g");

      const countries = feature(
        worldDataRef.current,
        worldDataRef.current.objects.world
      );

      // Draw countries
      mapGroup
        .selectAll<SVGPathElement, Feature<Geometry>>("path.country")
        .data(countries.features)
        .join("path")
        .attr("class", "country")
        .attr("d", (d) => path(d) || "")
        .attr("fill", (d: any) => {
          const data = countryData.get(d.id);
          return data ? colorScale(data.value) : "url(#hatch)";
        })
        .attr("stroke", colors.foreground)
        .attr("stroke-width", 0.3)
        .style("cursor", (d: any) =>
          countryData.get(d.id) ? "pointer" : "default"
        )
        .style("transition", "fill 0.2s ease-in-out");

      // Add world bounds using cached path
      mapGroup.append("path")
        .attr("class", "world-bounds")
        .attr("d", cachedBoundsPathRef.current || "")
        .attr("fill", "none")
        .attr("stroke", colors.foreground)
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 1);

    } catch (err) {
      console.error("Error during visualization update:", err);
      setError(err instanceof Error ? err.message : "Failed to load map");
    }
  }, [
    data,
    language,
    countryData,
    colorScale,
    globalExtent,
    currentProjection,
    handleDrag,
    colors.foreground,
    calculateWorldBoundsPath,
  ]);

  // Initial render and resize handling
  useEffect(() => {
    updateVisualization();

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateVisualization);
    });

    if (svgRef.current?.parentElement) {
      resizeObserver.observe(svgRef.current.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
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
          style={{ minHeight: "400px", cursor: "grab" }}
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
      {globalExtent[0] !== undefined &&
        globalExtent[1] !== undefined &&
        data.length > 0 && (
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
                  <rect
                    width="100%"
                    height="100%"
                    fill="url(#color-gradient)"
                  />
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
                onValueChange={(value: ProjectionType) =>
                  handleProjectionChange(value)
                }
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
