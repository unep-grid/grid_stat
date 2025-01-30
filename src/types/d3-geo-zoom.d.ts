declare module '@fxi/d3-geo-zoom' {
  import { GeoProjection } from 'd3';

  export class GeoZoom {
    constructor(element: SVGSVGElement);
    setProjection(projection: GeoProjection): this;
    onMove(callback: () => void): this;
    setNorthUp(enabled: boolean): this;
    getZoom(): any;
    move(direction: string): void;
    reset(): void;
  }
}
