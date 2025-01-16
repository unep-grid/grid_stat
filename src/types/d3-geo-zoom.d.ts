declare module '@fxi/d3-geo-zoom' {
  import { GeoProjection, GeoPermissibleObjects } from 'd3';

  interface GeoZoom {
    (selection: SVGSVGElement | null): void;
    projection(projection: GeoProjection): GeoZoom;
    scaleExtent(extent: [number, number]): GeoZoom;
    onMove(callback: () => void): GeoZoom;
    northUp(enabled: boolean): GeoZoom;
  }

  export function geoZoom(): GeoZoom;
}
