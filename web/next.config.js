/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from backend preview service
  images: {
    domains: ['localhost'],
  },
  // Environment variables for API
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
}

module.exports = nextConfig