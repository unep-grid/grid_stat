import * as d3_geo from "d3-geo-projection";
import * as d3_base from "d3";

const d3 = Object.assign({}, d3_base, d3_geo);


// Primary projections - commonly used for general purpose mapping
export const primaryProjections = [
  { name: "Equal Earth", value: d3.geoEqualEarthRaw },
  { name: "Natural Earth", value: d3.geoNaturalEarth1Raw },
  { name: "Robinson", value: d3.geoRobinsonRaw },
  { name: "Equirectangular (plate carrée)", value: d3.geoEquirectangularRaw },
  { name: "Mollweide", value: d3.geoMollweideRaw },
  { name: "Winkel tripel", value: d3.geoWinkel3Raw },
  { name: "Orthographic", value: d3.geoOrthographicRaw },
];

// Additional projections
export const additionalProjections = [
  { name: "Aitoff", value: d3.geoAitoffRaw },
  { name: "American polyconic", value: d3.geoPolyconicRaw },
  { name: "August", value: d3.geoAugustRaw },
  { name: "Baker dinomic", value: d3.geoBakerRaw },
  { name: "Boggs' eumorphic", value: d3.geoBoggsRaw },
  { name: "Bonne", value: d3.geoBonneRaw(Math.PI / 4) },
  { name: "Bottomley", value: d3.geoBottomleyRaw(0.5) },
  { name: "Bromley", value: d3.geoBromleyRaw },
  { name: "Collignon", value: d3.geoCollignonRaw },
  { name: "conic equal-area", value: d3.geoConicEqualAreaRaw(0, Math.PI / 3) },
  {
    name: "conic equidistant",
    value: d3.geoConicEquidistantRaw(0, Math.PI / 3),
  },
  { name: "Craster parabolic", value: d3.geoCrasterRaw },
  {
    name: "cylindrical equal-area",
    value: d3.geoCylindricalEqualAreaRaw((38.58 / 180) * Math.PI),
  },
  {
    name: "cylindrical stereographic",
    value: d3.geoCylindricalStereographicRaw(0),
  },
  { name: "Eckert I", value: d3.geoEckert1Raw },
  { name: "Eckert II", value: d3.geoEckert2Raw },
  { name: "Eckert III", value: d3.geoEckert3Raw },
  { name: "Eckert IV", value: d3.geoEckert4Raw },
  { name: "Eckert V", value: d3.geoEckert5Raw },
  { name: "Eckert VI", value: d3.geoEckert6Raw },
  { name: "Eisenlohr conformal", value: d3.geoEisenlohrRaw },
  { name: "Fahey pseudocylindrical", value: d3.geoFaheyRaw },
  { name: "flat-polar parabolic", value: d3.geoMtFlatPolarParabolicRaw },
  { name: "flat-polar quartic", value: d3.geoMtFlatPolarQuarticRaw },
  { name: "flat-polar sinusoidal", value: d3.geoMtFlatPolarSinusoidalRaw },
  { name: "Foucaut's stereographic equivalent", value: d3.geoFoucautRaw },
  { name: "Foucaut's sinusoidal", value: d3.geoFoucautSinusoidalRaw(0.5) },
  { name: "Ginzburg V", value: d3.geoGinzburg5Raw },
  { name: "Ginzburg VI", value: d3.geoGinzburg6Raw },
  { name: "Ginzburg VIII", value: d3.geoGinzburg8Raw },
  { name: "Ginzburg IX", value: d3.geoGinzburg9Raw },
  { name: "Goode's homolosine", value: d3.geoHomolosineRaw },
  { name: "Hammer", value: d3.geoHammerRaw(2) },
  { name: "Hill eucyclic", value: d3.geoHillRaw(1) },
  {
    name: "Hufnagel pseudocylindrical",
    value: d3.geoHufnagelRaw(1, 0, Math.PI / 4, 2),
  },
  { name: "Kavrayskiy VII", value: d3.geoKavrayskiy7Raw },
  { name: "Lagrange conformal", value: d3.geoLagrangeRaw(0.5) },
  { name: "Larrivée", value: d3.geoLarriveeRaw },
  { name: "Laskowski tri-optimal", value: d3.geoLaskowskiRaw },
  { name: "Loximuthal", value: d3.geoLoximuthalRaw((40 / 180) * Math.PI) },
  { name: "Miller cylindrical", value: d3.geoMillerRaw },
  { name: "Natural Earth II", value: d3.geoNaturalEarth2Raw },
  { name: "Nell–Hammer", value: d3.geoNellHammerRaw },
  { name: "Nicolosi globular", value: d3.geoNicolosiRaw },
  { name: "Patterson cylindrical", value: d3.geoPattersonRaw },
  { name: "rectangular polyconic", value: d3.geoRectangularPolyconicRaw(0) },
  { name: "sinusoidal", value: d3.geoSinusoidalRaw },
  { name: "sinu-Mollweide", value: d3.geoSinuMollweideRaw },
  { name: "Times", value: d3.geoTimesRaw },
  {
    name: "Tobler hyperelliptical",
    value: d3.geoHyperellipticalRaw(0, 2.5, 1.183136),
  },
  { name: "Van der Grinten", value: d3.geoVanDerGrintenRaw },
  { name: "Van der Grinten II", value: d3.geoVanDerGrinten2Raw },
  { name: "Van der Grinten III", value: d3.geoVanDerGrinten3Raw },
  { name: "Van der Grinten IV", value: d3.geoVanDerGrinten4Raw },
  { name: "Wagner IV", value: d3.geoWagner4Raw },
  { name: "Wagner VI", value: d3.geoWagner6Raw },
  {
    name: "Wagner VII",
    value: d3.geoWagnerRaw((65 / 180) * Math.PI, (60 / 180) * Math.PI, 0, 200),
  },
  {
    name: "Wagner VIII",
    value: d3.geoWagnerRaw((65 / 180) * Math.PI, (60 / 180) * Math.PI, 20, 200),
  },
];

// Export combined list for backward compatibility
export const projections = [...primaryProjections, ...additionalProjections];
