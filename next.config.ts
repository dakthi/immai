import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Reduce webpack cache warnings by limiting string size in cache
      config.cache = {
        ...config.cache,
        maxMemoryGenerations: 1,
      };
    }
    return config;
  },
};

export default nextConfig;
