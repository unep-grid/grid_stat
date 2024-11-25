import * as d3 from "d3";

// Available projections
export const projections = {
  "Azimuthal Equal Area": "geoAzimuthalEqualAreaRaw",
  "Azimuthal Equidistant": "geoAzimuthalEquidistantRaw",
  "Equal Earth": "geoEqualEarthRaw",
  "Equirectangular": "geoEquirectangularRaw",
  "Mercator": "geoMercatorRaw",
  "Natural Earth": "geoNaturalEarth1Raw",
  "Orthographic": "geoOrthographicRaw",
  "Stereographic": "geoStereographicRaw",
} as const;

export type ProjectionType = keyof typeof projections;

// Projection interpolation function (from Observable example by Herman Sontrop)
export function interpolateProjection(raw0: any, raw1: any) {
  const mutate = d3.geoProjectionMutator((t: number) => (x: number, y: number) => {
    // @ts-ignore: D3 raw projection functions can accept coordinates
    const p0 = raw0(x, y);
    // @ts-ignore: D3 raw projection functions can accept coordinates
    const p1 = raw1(x, y);
    return [p0[0] + t * (p1[0] - p0[0]), p0[1] + t * (p1[1] - p0[1])];
  });
  let t = 0;
  return Object.assign(mutate(t), {
    alpha(_?: number) {
      return arguments.length ? mutate(t = +_!) : t;
    }
  });
}

export function createColorScale(globalExtent: [number, number], color1: string, color2: string) {
  if (globalExtent[0] === undefined || globalExtent[1] === undefined) {
    return () => color2;
  }

  const scale = d3
    .scaleLinear()
    .domain(globalExtent)
    .range([0.2, 0.8]); // Use a range between 0.2 and 0.8 to avoid too dark/light colors

  const colorInterpolator = (t: number) => {
    return d3.interpolateHsl(color2, color1)(t);
  };

  return (value: number) => colorInterpolator(scale(value));
}
