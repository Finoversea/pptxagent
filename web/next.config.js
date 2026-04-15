/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Docker deployment
  output: 'standalone',
  // Allow images from backend preview service
  images: {
    domains: ['localhost'],
  },
  // Environment variables for API
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001',
  },
  // Proxy API requests to backend to avoid CORS issues in development
  async rewrites() {
    return [
      {
        source: '/api/deck/:path*',
        destination: 'http://localhost:8001/deck/:path*',
      },
    ];
  },
}

module.exports = nextConfig