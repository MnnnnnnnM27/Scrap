// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: { plugins: [mcpPlugin(), VitePWA({
    strategies: "generateSW", filename: "sw.js", registerType: "autoUpdate", injectRegister: null,
    devOptions: { enabled: false }, manifest: false,
    workbox: {
      globPatterns: ["**/*.{js,css,png,svg,woff2}"],
      maximumFileSizeToCacheInBytes: 8000000,
      navigateFallback: null,
      runtimeCaching: [
        { urlPattern: ({ request, url }) => request.mode === "navigate" && !/^\/(?:api|~oauth|mcp|\.lovable|auth|join|s)(?:\/|$)/.test(url.pathname), handler: "NetworkFirst", options: { cacheName: "scrap-navigation", networkTimeoutSeconds: 4, expiration: { maxEntries: 30 } } },
        { urlPattern: ({ url }) => url.origin === self.location.origin && /\/assets\/.*[-.][\w-]{8,}\.(?:js|css|woff2|png|svg)$/.test(url.pathname), handler: "CacheFirst", options: { cacheName: "scrap-assets", expiration: { maxEntries: 150 } } },
      ],
    },
  })] },
});
