import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import type { Feature, Geometry } from "geojson";
import { interpolateProjection } from "../../../lib/utils/projection";
import { useTheme } from "../../layout/ThemeProvider";
import { t } from "../../../lib/utils/translations";
import { Legend } from "./Legend";
import { MapToolbar } from "./MapToolbar";
import {
  throttle,
  processRegionData,
  calculateGlobalExtent,
  createColorScale,
} from "./utils";
import type {
  MapPanelProps,
  WorldTopology,
  ProjectionType,
  IndicatorData,
} from "./types";
import { projections } from "./projections";

// Define the GeoSphere type
type GeoSphere = {
  type: "Sphere";
};

export function MapPanel({ data, language }: MapPanelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const worldDataRef = useRef<WorldTopology | null>(null);
  const projectionRef = useRef<d3.GeoProjection | null>(null);
  const pathGeneratorRef = useRef<d3.GeoPath | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentProjection, setCurrentProjection] =
    useState<ProjectionType>("Mollweide");
  const [isLegendVisible, setIsLegendVisible] = useState(true);
  const [isLatestMode, setIsLatestMode] = useState(false);
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
    () => createColorScale(globalExtent, data),
    [globalExtent, data]
  );

  // Process data for visualization
  const regionData = useMemo(() => {
    return processRegionData(data, selectedYear, isLatestMode);
  }, [data, selectedYear, isLatestMode]);

  // Prepare data for legend (all data values)
  const legendData = useMemo(() => data.map((d) => d.value), [data]);

  // Update world bounds
  const updateWorldBounds = useCallback((projection: d3.GeoProjection) => {
    if (!svgRef.current) return;
    const path = d3.geoPath(projection);
    d3.select(svgRef.current)
      .select("path.world-bounds")
      .attr("d", path({ type: "Sphere" } as GeoSphere) as any);
  }, []);

  // Update region paths
  const updateRegionPaths = useCallback(() => {
    if (!svgRef.current || !projectionRef.current || !pathGeneratorRef.current)
      return;

    d3.select(svgRef.current)
      .selectAll<SVGPathElement, Feature<Geometry>>("path.region")
      .attr("d", (d) => pathGeneratorRef.current!(d) || "");

    updateWorldBounds(projectionRef.current);
  }, [updateWorldBounds]);

  // Throttled update function
  const throttledUpdate = useCallback(
    throttle(() => {
      if (isDraggingRef.current) {
        updateRegionPaths();
      }
    }, 16),
    [updateRegionPaths]
  );

  // Drag interaction
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

      // Find the old and new projection functions from the list
      const oldProjection = projections.find(
        (p) => p.name === currentProjection
      );
      const newProjectionData = projections.find(
        (p) => p.name === newProjection
      );

      if (!oldProjection || !newProjectionData) return;

      const projection = interpolateProjection(
        oldProjection.value,
        newProjectionData.value
      )
        .scale(scale)
        .translate([width / 2, height / 2])
        .rotate(currentRotation)
        .precision(0.1);

      projectionRef.current = projection;
      pathGeneratorRef.current = d3.geoPath(projection);

      // Transition both the regions and the sphere
      const transition = d3.transition().duration(1000);

      d3.select(svgRef.current)
        .selectAll<SVGPathElement, Feature<Geometry>>("path.region")
        .transition(transition)
        .attrTween("d", function (d) {
          return function (t: number) {
            projection.alpha(t);
            return d3.geoPath(projection)(d) || "";
          };
        });

      // Transition the sphere
      d3.select(svgRef.current)
        .select("path.world-bounds")
        .transition(transition)
        .attrTween("d", () => {
          return function (t: number) {
            projection.alpha(t);
            return d3.geoPath(projection)({
              type: "Sphere",
            } as GeoSphere) as string;
          };
        })
        .on("end", () => {
          setCurrentProjection(newProjection);
        });
    },
    [currentProjection]
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
        .on("start", () => {
          isDraggingRef.current = true;
        })
        .on("drag", handleDrag)
        .on("end", () => {
          isDraggingRef.current = false;
        });

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
        .attr("stroke-opacity", 0.5);

      // Find initial projection from the list
      const initialProjection = projections.find(
        (p) => p.name === currentProjection
      );
      if (!initialProjection) return;

      const projection = d3
        .geoProjection(initialProjection.value)
        .scale(scale)
        .translate([width / 2, height / 2])
        .rotate(projectionRef.current?.rotate() || [0, 0, 0])
        .precision(0.1);

      projectionRef.current = projection;
      pathGeneratorRef.current = d3.geoPath(projection);

      const mapGroup = svg.append("g");

      // Add sphere outline first
      mapGroup
        .append("path")
        .attr("class", "world-bounds")
        .datum({ type: "Sphere" } as GeoSphere)
        .attr("fill", "none")
        .attr("stroke", colors.foreground)
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 1)
        .attr("d", pathGeneratorRef.current as any);

      const regions = feature(
        worldDataRef.current,
        worldDataRef.current.objects.world
      );

      mapGroup
        .selectAll<SVGPathElement, Feature<Geometry>>("path.region")
        .data(regions.features)
        .join("path")
        .attr("class", "region")
        .attr("d", (d) => pathGeneratorRef.current!(d) || "")
        .attr("fill", (d: any) => {
          const data = regionData.get(d.id);
          return data ? colorScale(data.value) : "url(#hatch)";
        })
        .attr("stroke", colors.foreground)
        .attr("stroke-width", 0.3)
        .style("cursor", (d: any) =>
          regionData.get(d.id) ? "pointer" : "default"
        )
        .style("transition", "fill 0.2s ease-in-out")
        .on("mouseover", function (event, d: any) {
          d3.select(this).attr("stroke-width", 1.5); // Increase border width on hover
          const regionInfo = regionData.get(d.id);
          if (regionInfo) {
            const tooltip = d3.select("#tooltip");
            const formattedValue = new Intl.NumberFormat(language).format(
              regionInfo.value
            );
            tooltip
              .style("opacity", 1)
              .html(
                `${t("dv.region", language)}: ${regionInfo.name}<br>${t(
                  "dv.value",
                  language
                )}: ${formattedValue}`
              )
              .style("left", `${event.layerX + 30}px`)
              .style("top", `${event.layerY - 30}px`);
            
          }
        })
        .on("mousemove", function (event) {
          const tooltip = d3.select("#tooltip");
          tooltip
            .style("left", `${event.layerX + 30}px`)
            .style("top", `${event.layerY - 30}px`);
        })
        .on("mouseout", function () {
          d3.select(this).attr("stroke-width", 0.3); // Reset border width
          d3.select("#tooltip").style("opacity", 0);
        });
    } catch (err) {
      console.error("Error during visualization update:", err);
      setError(err instanceof Error ? err.message : "Failed to load map");
    }
  }, [
    data,
    regionData,
    colorScale,
    globalExtent,
    currentProjection,
    handleDrag,
    colors.foreground,
    language,
  ]);

  // Effect to update visualization
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

  // Export SVG functionality
  const handleExportSVG = useCallback(() => {
    if (!svgRef.current) return;

    // Clone the SVG to modify without affecting the original
    const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;

    // Remove any existing background rectangles or modifications
    const clone = d3.select(svgClone);
    clone.selectAll(".background-rect").remove();

    // Add a white background
    clone
      .insert("rect", ":first-child")
      .attr("class", "background-rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "white");

    // Serialize SVG
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgClone);

    // Create download
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `map_${selectedYear}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [selectedYear]);

  // Render component
  return (
    <div className="relative flex flex-col h-full w-full">
      {/* Toolbar */}
      <MapToolbar
        projections={projections}
        currentProjection={currentProjection}
        onProjectionChange={handleProjectionChange}
        isLegendVisible={isLegendVisible}
        onLegendToggle={() => setIsLegendVisible(!isLegendVisible)}
        onExportSVG={handleExportSVG}
        years={years}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        onLatestToggle={setIsLatestMode}
      />

      {/* Map Container */}
      <div className="relative flex-grow">
        {/* Main Map */}
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ minHeight: "400px", cursor: "grab" }}
        />

        {/* Custom Tooltip */}
        <div
          id="tooltip"
          style={{
            position: "absolute",
            opacity: 0,
            border: `1px solid ${colors.foreground}`,
            backgroundColor: colors.background,
            borderRadius: "4px",
            padding: "8px",
            pointerEvents: "none",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            transition: "opacity 0.2s ease-in-out",
          }}
        />

        {/* Legend */}
        {isLegendVisible &&
          globalExtent[0] !== undefined &&
          globalExtent[1] !== undefined &&
          data.length > 0 && (
            <div className="absolute top-4 left-4 z-10 p-2">
              <Legend
                data={legendData}
                globalExtent={globalExtent}
                colorScale={colorScale}
                language={language}
                currentYear={selectedYear}
              />
            </div>
          )}
      </div>
    </div>
  );
}
