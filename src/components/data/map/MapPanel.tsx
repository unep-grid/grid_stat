import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import type { Feature, Geometry } from "geojson";
import { interpolateProjection } from "@/lib/utils/projection";
import { createSizeScale, Legend, ProportionalSymbolLegend } from "./Legend";
import { MapToolbar } from "./MapToolbar";
import { MapTooltip } from "./MapTooltip";
import { useTheme } from "@/components/layout/ThemeProvider";
import { t } from "@/lib/utils/translations";
import {
  processRegionData,
  calculateGlobalExtent,
  createColorScale,
} from "./utils";
import type { MapPanelProps, WorldTopology, ProjectionType } from "./types";
import { projections } from "./projections";
import { geoZoom } from "@fxi/d3-geo-zoom";

// Define the GeoSphere type
type GeoSphere = {
  type: "Sphere";
};

interface HoveredRegion {
  name: string;
  value: number;
  x: number;
  y: number;
}

// Interface for projection state
interface ProjectionState {
  scale: number;
  rotation: [number, number, number];
}

export function MapPanel({ data, language }: MapPanelProps) {
  // All refs
  const svgRef = useRef<SVGSVGElement>(null);
  const worldDataRef = useRef<WorldTopology | null>(null);
  const projectionRef = useRef<d3.GeoProjection | null>(null);
  const pathGeneratorRef = useRef<d3.GeoPath | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const shouldRecreateProjectionRef = useRef(true);
  const geoZoomRef = useRef<any>(null);

  // Add projection state ref
  const projectionStateRef = useRef<ProjectionState>({
    scale: 0,
    rotation: [0, 0, 0],
  });

  const graticuleRef = useRef(
    d3
      .geoGraticule()
      .step([10, 10])
      .extent([
        [-180, -90],
        [180, 90],
      ])
  );

  // All state
  const [error, setError] = useState<string | null>(null);
  const [currentProjection, setCurrentProjection] =
    useState<ProjectionType>("Mollweide");
  const [isLegendVisible, setIsLegendVisible] = useState(true);
  const [isLatestMode, setIsLatestMode] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState<HoveredRegion | null>(
    null
  );

  // Use theme context for colors
  const { colors } = useTheme();

  // Get available years from data and initialize selected year
  const years = useMemo(() => {
    const uniqueYears = [...new Set(data.map((d) => d.date_start))].sort();
    return uniqueYears;
  }, [data]);

  const [selectedYear, setSelectedYear] = useState<number>(
    years[years.length - 1] || 0
  );

  // Prepare legend title with year/latest mode
  const legendTitle = useMemo(() => {
    const baseTitle = t("dv.legend", language);
    const latest = t("dv.latest", language);
    return `${baseTitle} ${isLatestMode ? latest : selectedYear}`;
  }, [isLatestMode, selectedYear, language]);

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

  // Prepare data for legend
  const legendData = useMemo(() => data.map((d) => d.value), [data]);

  // @TODO: This will be provided by a future attribute 'measure_scale'
  const indicatorId = parseInt(data[0]?.id || "0", 10);
  const useChoropleth = indicatorId === 1 || indicatorId === 3;

  // Update world bounds
  const updateWorldBounds = useCallback((projection: d3.GeoProjection) => {
    if (!svgRef.current) return;
    const path = d3.geoPath(projection);
    d3.select(svgRef.current)
      .select("path.world-bounds")
      .attr("d", path({ type: "Sphere" } as GeoSphere) as any);
  }, []);

  // Update region paths with state preservation
  const updateRegionPaths = useCallback(() => {
    if (!svgRef.current || !projectionRef.current || !pathGeneratorRef.current)
      return;

    // Store current projection state
    if (projectionRef.current) {
      projectionStateRef.current = {
        scale: projectionRef.current.scale(),
        rotation: projectionRef.current.rotate(),
      };
    }

    // Update graticule with current projection
    const graticuleData = graticuleRef.current();
    d3.select(svgRef.current)
      .select("path.graticule")
      .attr("d", pathGeneratorRef.current(graticuleData) || "");

    // Update regions
    d3.select(svgRef.current)
      .selectAll<SVGPathElement, Feature<Geometry>>("path.region")
      .attr("d", (d) => pathGeneratorRef.current!(d) || "");

    // Update point symbols if they exist
    d3.select(svgRef.current)
      .selectAll<SVGPathElement, Feature<Geometry>>("path.region-point")
      .attr("transform", (d: any) => {
        const centroid = pathGeneratorRef.current!.centroid(d);
        return `translate(${centroid[0]},${centroid[1]})`;
      });

    updateWorldBounds(projectionRef.current);
  }, [updateWorldBounds]);

  // Create RAF-based update function
  const scheduleUpdate = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(() => {
      updateRegionPaths();
      animationFrameRef.current = undefined;
    });
  }, [updateRegionPaths]);

  // Handle projection change with improved transition
  const handleProjectionChange = useCallback(
    (newProjection: ProjectionType) => {
      if (!svgRef.current || !worldDataRef.current || !projectionRef.current)
        return;

      const container = svgRef.current.parentElement;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      // Store current state before transition
      const currentScale = projectionRef.current.scale();
      const currentRotation = projectionRef.current.rotate();

      // Find the old and new projection functions
      const oldProjection = projections.find(
        (p) => p.name === currentProjection
      );
      const newProjectionData = projections.find(
        (p) => p.name === newProjection
      );

      if (!oldProjection || !newProjectionData) return;
      if (oldProjection.name === newProjection) return;

      // Create interpolated projection with preserved scale
      const projection = interpolateProjection(
        oldProjection.value,
        newProjectionData.value
      )
        .scale(currentScale)
        .translate([width / 2, height / 2])
        .rotate(currentRotation)
        .precision(0.1);

      if (newProjection === "Orthographic") {
        projection.clipAngle(90);
      }

      // Update refs
      projectionRef.current = projection;
      pathGeneratorRef.current = d3.geoPath(projection);

      // Store state for restoration
      projectionStateRef.current = {
        scale: currentScale,
        rotation: currentRotation,
      };

      // Remove existing zoom behavior
      if (geoZoomRef.current) {
        d3.select(svgRef.current).on(".zoom", null);
      }

      // Initialize new zoom behavior with preserved scale
      const zoom = geoZoom()
        .projection(projection)
        .scaleExtent([0.5, 8])
        .onMove(() => {
          if (projectionRef.current) {
            // Update state on move
            projectionStateRef.current = {
              scale: projectionRef.current.scale(),
              rotation: projectionRef.current.rotate(),
            };
            scheduleUpdate();
          }
        })
        //.northUp(currentProjection === "Orthographic");
        .northUp(true);

      // Apply zoom behavior to SVG
      zoom(svgRef.current);
      geoZoomRef.current = zoom;

      // Transition with proper state handling
      const transition = d3.transition().duration(1000);

      // Ensure scale is maintained during transition
      projection.scale(currentScale);

      // Update all elements
      d3.select(svgRef.current)
        .select("path.graticule")
        .transition(transition)
        .attrTween("d", (d) => {
          return (t: number) => {
            projection.alpha(t);
            return d3.geoPath(projection)(d) || "";
          };
        });

      d3.select(svgRef.current)
        .selectAll("path.region")
        .transition(transition)
        .attrTween("d", function (d) {
          return (t: number) => {
            projection.alpha(t);
            return d3.geoPath(projection)(d) || "";
          };
        });

      d3.select(svgRef.current)
        .selectAll("path.region-point")
        .transition(transition)
        .attrTween("transform", function (d) {
          return (t: number) => {
            projection.alpha(t);
            const [x, y] = d3.geoPath(projection).centroid(d);
            return `translate(${x}, ${y})`;
          };
        });

      d3.select(svgRef.current)
        .select("path.world-bounds")
        .transition(transition)
        .attrTween("d", () => {
          return (t: number) => {
            projection.alpha(t);
            return d3.geoPath(projection)({
              type: "Sphere",
            } as GeoSphere) as string;
          };
        })
        .on("end", () => {
          shouldRecreateProjectionRef.current = false;
          setCurrentProjection(newProjection);

          // Ensure correct scale after transition
          if (projectionRef.current) {
            projectionRef.current.scale(currentScale);
            scheduleUpdate();
          }
        });
    },
    [currentProjection]
  );

  // Helper functions for hover events
  const handleRegionHover = (event: any, d: any) => {
    const regionInfo = regionData.get(d.id);
    if (regionInfo && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = event.clientX - containerRect.left;
      const mouseY = event.clientY - containerRect.top;

      setHoveredRegion({
        name: regionInfo.name,
        value: regionInfo.value,
        x: mouseX,
        y: mouseY,
      });
    }
  };

  const handleRegionMove = (event: any) => {
    if (containerRef.current && hoveredRegion) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = event.clientX - containerRect.left;
      const mouseY = event.clientY - containerRect.top;

      setHoveredRegion({
        ...hoveredRegion,
        x: mouseX,
        y: mouseY,
      });
    }
  };

  const handleRegionOut = () => {
    setHoveredRegion(null);
  };

  // Update visualization with state preservation
  const updateVisualization = useCallback(async () => {
    if (!svgRef.current) return;

    try {
      const container = svgRef.current.parentElement;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      const baseScale = width / 6;

      if (!worldDataRef.current) {
        const response = await d3.json<WorldTopology>(
          "/grid_stat/world-110m.json"
        );
        if (!response) {
          throw new Error("Failed to load world map data");
        }
        worldDataRef.current = response;
      }

      // Store current zoom state if it exists
      const currentState = projectionStateRef.current;

      d3.select(svgRef.current).selectAll("*").remove();

      const svg = d3
        .select(svgRef.current)
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height)
        .style("max-width", "100%")
        .style("height", "auto");

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
        .attr("fill", colors.background)
        .append("path")
        .attr("d", "M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2")
        .attr("stroke", colors.foreground)
        .attr("stroke-width", 0.5)
        .attr("stroke-opacity", 0.5);

      // Create or update projection with state preservation
      if (shouldRecreateProjectionRef.current || !projectionRef.current) {
        const initialProjection = projections.find(
          (p) => p.name === currentProjection
        );
        if (!initialProjection) return;

        const scale = currentState.scale || baseScale;

        const projection = d3
          .geoProjection(initialProjection.value)
          .scale(scale)
          .translate([width / 2, height / 2])
          .rotate(currentState.rotation)
          .precision(0.1);

        if (currentProjection === "Orthographic") {
          projection.clipAngle(90);
        }

        projectionRef.current = projection;
        pathGeneratorRef.current = d3.geoPath(projection);

        // Initialize d3-geo-zoom with preserved state
        const zoom = geoZoom()
          .projection(projection)
          .scaleExtent([0.5, 8])
          .onMove(() => {
            if (projectionRef.current) {
              projectionStateRef.current = {
                scale: projectionRef.current.scale(),
                rotation: projectionRef.current.rotate(),
              };
              scheduleUpdate();
            }
          })
          .northUp(currentProjection === "Orthographic");

        // Apply zoom behavior to SVG
        zoom(svg.node());
        geoZoomRef.current = zoom;

        shouldRecreateProjectionRef.current = false;
      }
      // Apply zoom behavior to SVG
      if (geoZoomRef.current) {
        geoZoomRef.current(svgRef.current);
      }

      // Force an update
      scheduleUpdate();

      const mapGroup = svg.append("g");

      // Add sphere outline first
      mapGroup
        .append("path")
        .attr("class", "world-bounds")
        .datum({ type: "Sphere" } as GeoSphere)
        .attr("fill", "none")
        .attr("stroke", colors.foreground)
        .attr("stroke-width", 0.5)
        .attr("stroke-opacity", 1)
        .attr("d", pathGeneratorRef.current as any);

      const regions = feature(
        worldDataRef.current,
        worldDataRef.current.objects.world
      );

      if (useChoropleth) {
        // Render choropleth map for indicators 1 and 3
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
            d3.select(this).attr("stroke-width", 1.5);
            handleRegionHover(event, d);
          })
          .on("mousemove", handleRegionMove)
          .on("mouseout", function () {
            d3.select(this).attr("stroke-width", 0.3);
            handleRegionOut();
          });
      } else {
        // Render base map with no fill except no data
        const baseMap = mapGroup
          .selectAll<SVGPathElement, Feature<Geometry>>("path.region")
          .data(regions.features)
          .join("path")
          .attr("class", "region")
          .attr("d", (d) => pathGeneratorRef.current!(d) || "")
          .attr("fill", (d: any) => {
            const data = regionData.get(d.id);
            return data ? "none" : "url(#hatch)";
          })
          .attr("stroke", colors.foreground)
          .attr("stroke-width", 0.3);

        // Add proportional symbols
        const symbolGenerator = d3.symbol().type(d3.symbolCircle);
        const sizeScale = createSizeScale(globalExtent);

        const symbolGroup = mapGroup.append("g").attr("class", "symbols");

        // Sort features by value in descending order
        const sortedFeatures = regions.features
          .filter((d: any) => regionData.get(d.id))
          .sort((a: any, b: any) => {
            const valueA = regionData.get(a.id)?.value || 0;
            const valueB = regionData.get(b.id)?.value || 0;
            return valueB - valueA;
          });

        symbolGroup
          .selectAll("path.region-point")
          .data(sortedFeatures)
          .join("path")
          .attr("class", "region-point")
          .attr("transform", (d: any) => {
            const centroid = pathGeneratorRef.current!.centroid(d);
            return `translate(${centroid[0]},${centroid[1]})`;
          })
          .attr("d", (d: any) => {
            const data = regionData.get(d.id);
            const radius = sizeScale(data ? data.value : 0);
            return symbolGenerator.size(Math.PI * radius * radius)();
          })
          .attr("fill", colors.foreground)
          .attr("stroke", colors.background)
          .attr("stroke-width", 1)
          .style("cursor", "pointer")
          .on("mouseover", function (event, d: any) {
            d3.select(this).attr("stroke-width", 2);
            baseMap
              .filter((region: any) => region.id === d.id)
              .attr("stroke-width", 1.5);
            handleRegionHover(event, d);
          })
          .on("mousemove", handleRegionMove)
          .on("mouseout", function (event, d: any) {
            d3.select(this).attr("stroke-width", 1);
            baseMap
              .filter((region: any) => region.id === d.id)
              .attr("stroke-width", 0.3);
            handleRegionOut();
          });
      }

      // Add graticule with proper projection
      const graticuleData = graticuleRef.current();
      mapGroup
        .append("path")
        .datum(graticuleData)
        .attr("class", "graticule")
        .attr("d", pathGeneratorRef.current as any)
        .attr("fill", "none")
        .attr("stroke", colors.foreground)
        .attr("stroke-width", 0.2)
        .attr("stroke-opacity", 0.3);
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
    colors.foreground,
    colors.background,
    useChoropleth,
    scheduleUpdate,
  ]);

  // Effect to update visualization
  useEffect(() => {
    updateVisualization();

    const resizeObserver = new ResizeObserver(() => {
      shouldRecreateProjectionRef.current = true; // Force recreation on resize
      requestAnimationFrame(updateVisualization);
    });

    if (svgRef.current?.parentElement) {
      resizeObserver.observe(svgRef.current.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateVisualization]);

  const handleExportSVG = useCallback(() => {
    if (!svgRef.current) return;

    const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
    const clone = d3.select(svgClone);
    clone.selectAll(".background-rect").remove();

    clone
      .insert("rect", ":first-child")
      .attr("class", "background-rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "white");

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgClone);

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

  return (
    <div className="relative flex flex-col h-full w-full" ref={containerRef}>
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

      <div className="relative flex-grow">
        <svg
          id="map"
          ref={svgRef}
          className="w-full h-full"
          style={{ minHeight: "400px" }}
        />

        <MapTooltip
          regionName={hoveredRegion?.name || ""}
          value={hoveredRegion?.value || 0}
          x={hoveredRegion?.x || 0}
          y={hoveredRegion?.y || 0}
          visible={!!hoveredRegion}
          language={language}
        />

        {isLegendVisible &&
          globalExtent[0] !== undefined &&
          globalExtent[1] !== undefined &&
          data.length > 0 && (
            <div className="absolute top-4 left-4 z-10 p-2">
              {useChoropleth ? (
                <Legend
                  data={legendData}
                  globalExtent={globalExtent}
                  colorScale={colorScale}
                  title={legendTitle}
                  language={language}
                />
              ) : (
                <ProportionalSymbolLegend
                  globalExtent={globalExtent}
                  colors={colors}
                  title={legendTitle}
                />
              )}
            </div>
          )}
      </div>
    </div>
  );
}
