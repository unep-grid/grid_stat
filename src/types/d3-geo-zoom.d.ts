declare module '@fxi/d3-geo-zoom' {
  import type { GeoProjection } from 'd3';
  import type { ZoomBehavior } from 'd3-zoom';

  export class GeoZoom {
    constructor(element: Element);
    setProjection(projection: GeoProjection): this;
    setNorthUp(enabled: boolean): this;
    setScaleExtent(extent: [number, number]): this;
    setTransitionDuration(duration: number): this;
    onMove(callback: (params: { scale: number; rotation: [number, number, number] }) => void): this;
    move(direction: 'left' | 'right' | 'up' | 'down' | 'north', step?: number): this;
    reset(): this;
    rotateTo(rotation: [number, number, number]): this;
    getZoom(): ZoomBehavior<Element, unknown>;
  }
}
