import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react'; // Added React plugin

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()], // Added React plugin
      define: {
        // Keep existing defines if they are still needed for the WP context
        // However, API key should ideally not be compiled into frontend for WP.
        // It will be handled by PHP.
        // 'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // 'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          // Adjusted alias to point to ai-cv-builder/src if that's where @ refers to
          '@': path.resolve(__dirname, 'ai-cv-builder/src'),
        }
      },
      build: {
        outDir: path.resolve(__dirname, 'ai-cv-builder/assets/dist'),
        emptyOutDir: true, // Clean the output directory before build
        sourcemap: true, // Optional: for easier debugging
        lib: { // Build as a library
          entry: path.resolve(__dirname, 'ai-cv-builder/src/index.tsx'),
          name: 'AICVBuilder', // Global variable name if not using modules, or for UMD
          fileName: (format) => `main.js`, // Output filename (fixed)
          formats: ['iife'] // IIFE for simple script tag inclusion; 'es' or 'umd' could also be options
        },
        rollupOptions: {
          output: {
            // If you want a separate CSS file:
            assetFileNames: (assetInfo) => {
              if (assetInfo.name === 'style.css') {
                return 'style.css'; // Fixed CSS filename
              }
              return assetInfo.name;
            },
          }
        }
      }
    };
});
