/** @type {import('next').NextConfig} */
const nextConfig = {
  // This tells Next.js to compile our shared packages
  transpilePackages: [
    "@roadwatch/shared-types",
    "@roadwatch/shared-utils",
    "@roadwatch/ui-components"
  ],
  // This prepares it for Docker deployment later
  output: "standalone",
  // Suppress warnings during development
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true }
};

export default nextConfig;