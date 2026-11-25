import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* This app is an interactive, client-driven game behind local/Supabase
   * state (no meaningful static content to prerender), so the default
   * Cache Components prerendering is more friction than benefit here. */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
