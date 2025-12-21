/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "localhost:3001",
        "localhost:3003",
        "localhost:3002",
        "laughing-lamp-v69qqqv7q57gcpxvg-3000.app.github.dev",
        "laughing-lamp-v69qqqv7q57gcpxvg-3001.app.github.dev",
        "laughing-lamp-v69qqqv7q57gcpxvg-3002.app.github.dev",
        "laughing-lamp-v69qqqv7q57gcpxvg-3003.app.github.dev",
        "*.app.github.dev",
      ],
    },
  },
};

module.exports = nextConfig;
