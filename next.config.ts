import type { NextConfig } from "next";

// Static export: the planner is fully client-side (localStorage + bundled JSON), so it can be served as plain files (Netlify / GitHub Pages).
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
