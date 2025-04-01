/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'vercel-blob.com',
      },
      {
        protocol: 'https',
        hostname: '*.vercel-blob.com',
      },
    ],
  },
  experimental: {
    serverActions: true,
  },
};

export default nextConfig;

