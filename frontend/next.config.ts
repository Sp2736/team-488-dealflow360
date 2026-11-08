import type { NextConfig } from "next";
import path from "path";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  output: 'export',
  outputFileTracingRoot: path.join(__dirname),
  basePath,
  trailingSlash: true, // GitHub Pages serves /x/index.html reliably
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_DEMO_MODE: 'true',
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
