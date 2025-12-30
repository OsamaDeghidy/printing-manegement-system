/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  productionBrowserSourceMaps: false,
  generateBuildId: async () => {
    // Generate build ID without using crypto.generate (Node.js 22 compatibility)
    // This prevents Next.js from using nanoid fallback which has issues with Node.js 22
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const random2 = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}${random2}`.substring(0, 21);
  },
};

export default nextConfig;

