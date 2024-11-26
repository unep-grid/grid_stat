import type { Topology, GeometryCollection } from "topojson-specification";
import type { Feature, Geometry } from "geojson";
import type { IndicatorData } from "../../../lib/types";
import type { Language } from "../../../lib/utils/translations";

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

// Available projections mapping
export const projections = {
  "Azimuthal Equal Area": "geoAzimuthalEqualAreaRaw",
  "Azimuthal Equidistant": "geoAzimuthalEquidistantRaw",
  "Equal Earth": "geoEqualEarthRaw",
  "Equirectangular": "geoEquirectangularRaw",
  "Mercator": "geoMercatorRaw",
  "Natural Earth": "geoNaturalEarth1Raw",
  "Orthographic": "geoOrthographicRaw",
  "Stereographic": "geoStereographicRaw"
} as const;

export type ProjectionType = keyof typeof projections;
