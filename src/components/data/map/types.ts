import type { Topology, GeometryCollection } from "topojson-specification";
import type { Feature, Geometry } from "geojson";
import type { IndicatorData } from "../../../lib/types";
import type { Language } from "../../../lib/utils/translations";
import { projections as projectionsList } from "./projections";

export interface MapPanelProps {
  data: IndicatorData[];
  language: Language;
}

export interface CountryGeometry {
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

export interface WorldBounds extends Feature<Geometry> {
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

// Create projections mapping from the projections list
export const projections = Object.fromEntries(
  projectionsList.map(p => [p.name, p.value])
) as { [key: string]: any };

export type ProjectionType = typeof projectionsList[number]['name'];
