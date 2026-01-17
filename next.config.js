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
  allowedDevOrigins: [
    'https://d97c662f-c004-43dc-84ed-b906aab70a02-00-1grz32m0fzcad.pike.replit.dev',
    'http://127.0.0.1:5000',
    'http://localhost:5000',
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "localhost:3001",
        "localhost:3003",
        "localhost:3002",
        "localhost:5000",
        "laughing-lamp-v69qqqv7q57gcpxvg-3000.app.github.dev",
        "laughing-lamp-v69qqqv7q57gcpxvg-3001.app.github.dev",
        "laughing-lamp-v69qqqv7q57gcpxvg-3002.app.github.dev",
        "laughing-lamp-v69qqqv7q57gcpxvg-3003.app.github.dev",
        "*.app.github.dev",
        "*.replit.dev",
        "*.pike.replit.dev",
      ],
    },
  },
};

module.exports = nextConfig;
