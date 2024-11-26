import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import type { Feature, Geometry } from "geojson";
import { interpolateProjection } from "../../../lib/utils/projection";
import { useTheme } from "../../layout/ThemeProvider";
import { t } from "../../../lib/utils/translations";
import { TimeControl } from "./TimeControl";
import { Legend } from "./Legend";
import {
  createWorldBounds,
  throttle,
  processCountryData,
  calculateGlobalExtent,
  createColorScale,
} from "./utils";
import type {
  MapPanelProps,
  WorldTopology,
  ProjectionType,
} from "./types";
import { projections } from "./types";

export function MapPanel({ data, language }: MapPanelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const worldDataRef = useRef<WorldTopology | null>(null);
  const projectionRef = useRef<d3.GeoProjection | null>(null);
  const pathGeneratorRef = useRef<d3.GeoPath | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentProjection, setCurrentProjection] =
    useState<ProjectionType>("Equal Earth");
  const isDraggingRef = useRef(false);

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
  const globalExtent = useMemo(() => calculateGlobalExtent(data), [data]);

  // Create color scale using global extent
  const colorScale = useMemo(
    () => createColorScale(globalExtent, colors.background, colors.foreground, data),
    [globalExtent, colors.background, colors.foreground, data]
  );

  // Process data for visualization
  const countryData = useMemo(
    () => processCountryData(data, selectedYear),
    [data, selectedYear]
  );

  // Update world bounds
  const updateWorldBounds = useCallback((projection: d3.GeoProjection) => {
    if (!svgRef.current) return;

    const container = svgRef.current.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const scale = width / 6;

    const projectionRaw = (d3 as any)[projections[currentProjection]];
    const boundsProjection = d3
      .geoProjection(projectionRaw)
      .scale(scale)
      .translate([width / 2, height / 2])
      .rotate([0, 0, 0])
      .precision(0.1);

    const path = d3.geoPath(boundsProjection);
    const worldBounds = createWorldBounds();
    const boundsPath = path(worldBounds);

    d3.select(svgRef.current)
      .select("path.world-bounds")
      .attr("d", boundsPath || "");
  }, [currentProjection]);

  // Update country paths
  const updateCountryPaths = useCallback(() => {
    if (!svgRef.current || !projectionRef.current || !pathGeneratorRef.current) return;

    d3.select(svgRef.current)
      .selectAll<SVGPathElement, Feature<Geometry>>("path.country")
      .attr("d", (d) => pathGeneratorRef.current!(d) || "");
  }, []);

  // Throttled update function
  const throttledUpdate = useCallback(
    throttle(() => {
      if (isDraggingRef.current) {
        updateCountryPaths();
      }
    }, 16),
    [updateCountryPaths]
  );

  // Handle drag interaction
  const handleDrag = useCallback(
    (event: d3.D3DragEvent<SVGSVGElement, null, null>) => {
      if (!projectionRef.current) return;

      const sensitivityX = 5;
      const sensitivityY = 5;

      const [λ, φ, γ] = projectionRef.current.rotate();
      projectionRef.current.rotate([
        λ + event.dx / sensitivityX,
        φ - event.dy / sensitivityY,
        γ,
      ]);

      pathGeneratorRef.current = d3.geoPath(projectionRef.current);
      throttledUpdate();
    },
    [throttledUpdate]
  );

  // Handle projection change
  const handleProjectionChange = useCallback(
    (newProjection: ProjectionType) => {
      if (!svgRef.current || !worldDataRef.current || !projectionRef.current)
        return;

      const container = svgRef.current.parentElement;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      const scale = width / 6;

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
      updateWorldBounds(projection);
      pathGeneratorRef.current = d3.geoPath(projection);

      d3.select(svgRef.current)
        .selectAll<SVGPathElement, Feature<Geometry>>("path.country")
        .transition()
        .duration(1000)
        .attrTween("d", function (d) {
          return function (t: number) {
            projection.alpha(t);
            return pathGeneratorRef.current!(d) || "";
          };
        })
        .on("end", () => {
          setCurrentProjection(newProjection);
        });
    },
    [currentProjection, updateWorldBounds]
  );

  // Update visualization
  const updateVisualization = useCallback(async () => {
    if (!svgRef.current) return;

    try {
      const container = svgRef.current.parentElement;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      const scale = width / 6;

      if (!worldDataRef.current) {
        const response = await d3.json<WorldTopology>(
          "/grid_stat/world-110m.json"
        );
        if (!response) {
          throw new Error("Failed to load world map data");
        }
        worldDataRef.current = response;
      }

      d3.select(svgRef.current).selectAll("*").remove();

      const svg = d3
        .select(svgRef.current)
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height)
        .style("max-width", "100%")
        .style("height", "auto");

      const dragBehavior = d3
        .drag<SVGSVGElement, null>()
        .on("start", () => { isDraggingRef.current = true; })
        .on("drag", handleDrag)
        .on("end", () => { isDraggingRef.current = false; });

      svg.call(dragBehavior as any);

      const defs = svg.append("defs");

      const gradient = defs
        .append("linearGradient")
        .attr("id", "color-gradient")
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "0%");

      const stops = d3.range(0, 1.1, 0.1);
      stops.forEach((stop) => {
        gradient
          .append("stop")
          .attr("offset", `${stop * 100}%`)
          .attr("stop-color", colorScale(d3.quantile(globalExtent, stop) || 0));
      });

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

      const projectionRaw = (d3 as any)[projections[currentProjection]];
      const projection = d3
        .geoProjection(projectionRaw)
        .scale(scale)
        .translate([width / 2, height / 2])
        .rotate(projectionRef.current?.rotate() || [0, 0, 0])
        .precision(0.1);

      projectionRef.current = projection;
      pathGeneratorRef.current = d3.geoPath(projection);

      const mapGroup = svg.append("g");

      const countries = feature(
        worldDataRef.current,
        worldDataRef.current.objects.world
      );

      mapGroup
        .selectAll<SVGPathElement, Feature<Geometry>>("path.country")
        .data(countries.features)
        .join("path")
        .attr("class", "country")
        .attr("d", (d) => pathGeneratorRef.current!(d) || "")
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

      mapGroup
        .append("path")
        .attr("class", "world-bounds")
        .attr("fill", "none")
        .attr("stroke", colors.foreground)
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 1);

      updateWorldBounds(projection);

    } catch (err) {
      console.error("Error during visualization update:", err);
      setError(err instanceof Error ? err.message : "Failed to load map");
    }
  }, [
    data,
    countryData,
    colorScale,
    globalExtent,
    currentProjection,
    handleDrag,
    colors.foreground,
    updateWorldBounds,
  ]);

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

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-destructive">
          {t("dv.map_error", language)}: {error}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{t("dv.no_data", language)}</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full w-full gap-4 p-4">
      <TimeControl
        years={years}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
      />

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

      {globalExtent[0] !== undefined &&
        globalExtent[1] !== undefined &&
        data.length > 0 && (
          <Legend
            globalExtent={globalExtent}
            currentProjection={currentProjection}
            onProjectionChange={handleProjectionChange}
          />
        )}
    </div>
  );
}
