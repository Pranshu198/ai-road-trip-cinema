// Import-free config on purpose: no imports, so the config bundle is
// self-contained. JSX is compiled by Vite's built-in esbuild transform
// (automatic runtime); @vitejs/plugin-react is only needed for Fast
// Refresh in dev, not for a production build.
export default {
  base: '/ai-road-trip-cinema/',
  esbuild: { jsx: 'automatic' },
  build: { outDir: 'dist', sourcemap: false },
};
