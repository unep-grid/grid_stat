import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { ProjectionType } from "./MapUtils";
import { projections } from "./MapUtils";

interface CountryGeometry {
  type: string;
  id: string;
  properties: {
    name: string;
  };
  arcs: number[][];
}

export interface WorldTopology
  extends Topology<{
    world: GeometryCollection<CountryGeometry>;
  }> {
  type: "Topology";
}

interface CountryFeature extends Feature<Geometry> {
  id: string;
  properties: {
    name: string;
  };
}

interface MapRendererProps {
  worldData: WorldTopology;
  currentProjection: ProjectionType;
  colorScale: (value: number) => string;
  countryData: Map<string, { value: number; name: string }>;
  color1: string;
  onProjectionRef?: (projection: d3.GeoProjection) => void;
}

export function MapRenderer({
  worldData,
  currentProjection,
  colorScale,
  countryData,
  color1,
  onProjectionRef,
}: MapRendererProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const projectionRef = useRef<d3.GeoProjection | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const container = svgRef.current.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const scale = width / 6;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .style("max-width", "100%")
      .style("height", "auto");

    // Create projection
    const projectionRaw = (d3 as any)[projections[currentProjection]];
    const projection = d3.geoProjection(projectionRaw)
      .scale(scale)
      .translate([width / 2, height / 2])
      .precision(0.1);

    projectionRef.current = projection;
    if (onProjectionRef) {
      onProjectionRef(projection);
    }

    const path = d3.geoPath(projection);
    const countries = feature(worldData, worldData.objects.world) as unknown as FeatureCollection<Geometry>;

    // Create a group for the map
    const g = svg.append("g");

    // Draw countries
    g.selectAll("path.country")
      .data(countries.features)
      .join("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("fill", (d: CountryFeature) => {
        const data = countryData.get(d.id);
        return data ? colorScale(data.value) : "url(#hatch)";
      })
      .attr("stroke", color1)
      .attr("stroke-width", 0.3)
      .style("cursor", "grab")
      .style("transition", "fill 0.2s ease-in-out");

    // Add drag behavior
    const sensitivityX = 5;
    const sensitivityY = 6;

    const dragBehavior = d3.drag()
      .on('drag', (event) => {
        if (!projectionRef.current) return;
        
        const [λ, φ] = projectionRef.current.rotate();
        
        projectionRef.current.rotate([
          λ + event.dx / sensitivityX,
          φ - event.dy / sensitivityY,
          0
        ]);
        
        g.selectAll('path').attr('d', path);
      });

    svg.call(dragBehavior as any);

    // Cleanup
    return () => {
      projectionRef.current = null;
    };
  }, [worldData, currentProjection, colorScale, countryData, color1, onProjectionRef]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ minHeight: "400px" }}
    />
  );
}
