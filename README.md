# Geo Country

**geo-country** is a Figma plugin that lets you quickly insert **Mercator projection** vector maps of all the world’s continents and countries — right into your designs.

![Screenshot](geo-country-cover.png)

## Features

- **Complete Coverage** — Access every country in the world, individual continents, or a single country.
- **Continent Country Toggle** — For continents, choose:
  - **Continent only**
  - **Continent + country borders**
- **Organized Layers** — All shapes are grouped and named by continent/country for easy editing.
- **Two Levels of Detail**
  - **Low detail** (1:110m) — faster, lighter, simpler.
  - **High detail** (1:50m) — includes small territories & microstates.
- **Light/Dark Theme Support** — Plugin UI matches your Figma theme.
- **Dynamic Vector Scaling** — Fits to your current selection, or to the viewport if no selection is active.
- **Auto Contrast Fill** — Fills are chosen dynamically based on page background color for optimal visibility.

## Notes

- High-detail maps can include very small territories (e.g., islands or enclaves) that may be difficult to see in preview or may make the preview appear offset or smaller — this is **not a bug**.
- Microstates and very small territories (e.g., *Vatican City*, *Monaco*) are **only included** in the high-detail vectors.

## Usage

1. Open **geo-country** in Figma.
2. Select the **continent** or **country** you want.
3. Choose:
   - Detail level: **Low** or **High**
   - For continents: toggle country borders on/off
4. Click **Insert** — the vectors appear in your design, grouped and named.

## Example Use Cases

- Infographics
- Data visualization maps
- Geography-based UI
- Educational diagrams
- Dashboard maps

## Dev Info

Built with:

- D3
- TypeScript
- React
- Vite
- colorjs.io
- esbuild
- Figma Plugin API

## License

MIT License