import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import type { IndicatorData } from "../../lib/types";
import type { Language } from "../../lib/utils/translations";
import { t } from "../../lib/utils/translations";
import * as d3 from "d3";
import type { Topology, GeometryCollection } from "topojson-specification";
import { feature } from "topojson-client";
import { unM49 } from "../../lib/utils/regions";

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

export function MapPanel({ data, language }: MapPanelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const worldDataRef = useRef<WorldTopology | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Convert M49 codes to ISO3166 and prepare data for visualization
  const countryData = useMemo(() => {
    const dataMap = new Map();
    data.forEach((d) => {
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
  }, [data]);

  // Create color scale using theme colors with improved interpolation
  const { colorScale, extent } = useMemo(() => {
    const values = Array.from(countryData.values()).map((d) => d.value);
    const ext = d3.extent(values) as [number, number];

    // Handle empty or invalid data
    if (!ext[0] || !ext[1]) {
      ext[0] = 0;
      ext[1] = 100;
    }

    const scale = d3
      .scaleSequential()
      .domain(ext)
      .interpolator(d3.interpolateHsl(color1, color2));

    return { colorScale: scale, extent: ext };
  }, [countryData]);

  // Memoize the visualization update function
  const updateVisualization = useCallback(async () => {
    if (!svgRef.current) return;

    try {
      const container = svgRef.current.parentElement;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

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

      // Create Equal Earth projection
      const projection = d3
        .geoEqualEarth()
        .fitSize([width, height], { type: "Sphere" })
        .rotate([0, 0]);

      const path = d3.geoPath(projection);

      // Create SVG
      const svg = d3
        .select(svgRef.current)
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height)
        .style("max-width", "100%")
        .style("height", "auto");

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
          const value = data ? data.value : undefined;
          return value !== undefined ? colorScale(value) : color2;
        })
        .attr("stroke", color1)
        .attr("stroke-width", 0.3)
        .style("cursor", (d: any) =>
          countryData.get(d.id) ? "pointer" : "default"
        )
        .style("transition", "fill 0.2s ease-in-out");

      // Add legend
      const legendWidth = Math.min(300, width * 0.4);
      const legendHeight = 8;
      const legendX = width - legendWidth - 20;
      const legendY = height - 35;

      const legendScale = d3
        .scaleLinear()
        .domain(extent)
        .range([0, legendWidth]);

      const legendAxis = d3
        .axisBottom(legendScale)
        .ticks(5)
        .tickFormat((d) => d.toLocaleString())
        .tickSize(4);

      const defs = svg.append("defs");
      const gradient = defs
        .append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "0%");

      gradient
        .selectAll("stop")
        .data(d3.ticks(0, 1, 10))
        .join("stop")
        .attr("offset", (d) => `${d * 100}%`)
        .attr("stop-color", (d) =>
          colorScale(d3.interpolate(extent[0], extent[1])(d))
        );

      const legend = svg
        .append("g")
        .attr("transform", `translate(${legendX},${legendY})`);

      legend
        .append("rect")
        .attr("x", -10)
        .attr("y", -5)
        .attr("width", legendWidth + 20)
        .attr("height", 30)
        .attr("fill", "#ffffff")
        .attr("rx", 4)
        .attr("opacity", 0.8);

      legend
        .append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .attr("rx", 2)
        .style("fill", "url(#legend-gradient)");

      legend
        .append("g")
        .attr("transform", `translate(0,${legendHeight})`)
        .call(legendAxis)
        .call((g) => g.select(".domain").remove())
        .call((g) =>
          g
            .selectAll("text")
            .attr("fill", "#666666")
            .attr("font-size", "10px")
            .attr("dy", "1em")
        )
        .call((g) => g.selectAll("line").attr("stroke", "#cccccc"));
    } catch (err) {
      console.error("Error during visualization update:", err);
      setError(err instanceof Error ? err.message : "Failed to load map");
    }
  }, [data, language, countryData, colorScale, extent]);

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
    <div className="relative h-full w-full">
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
  );
}
