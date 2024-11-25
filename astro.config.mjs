import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: 'https://unep-grid.github.io',
  base: 'grid_stat',
  integrations: [
    mdx(),
    sitemap(),
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  vite: {
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // React core
            if (id.includes('node_modules/react/') || 
                id.includes('node_modules/react-dom/')) {
              return 'vendor-react';
            }
            
            // Charting libraries
            if (id.includes('node_modules/recharts/') ||
                id.includes('node_modules/d3-')) {
              return 'vendor-charts';
            }

            // UI Component libraries
            if (id.includes('node_modules/@radix-ui/') ||
                id.includes('node_modules/lucide-react/')) {
              return 'vendor-ui';
            }

            // Data utilities
            if (id.includes('/src/lib/utils/')) {
              return 'data-utils';
            }

            // UI components
            if (id.includes('/src/components/ui/')) {
              return 'ui-components';
            }

            // Data components
            if (id.includes('/src/components/data/') && !id.includes('DataExplorer')) {
              return 'data-components';
            }
          }
        }
      }
    }
  }
});
