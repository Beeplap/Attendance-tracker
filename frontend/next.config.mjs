/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  distDir: ".next",
  // Explicitly set the project root to the current directory
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
