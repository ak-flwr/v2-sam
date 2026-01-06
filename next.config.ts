import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable compression for better performance
  compress: true,

  // Disable source maps in production to reduce bundle size and protect source code
  productionBrowserSourceMaps: false,

  // Security headers for production
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on"
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload"
          },
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(self), interest-cohort=()"
          }
        ]
      }
    ];
  },

  // Optimize images
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
  },

  // Configure output for cPanel deployment
  output: "standalone",

  // Optimize React in production
  reactStrictMode: true,

  // Configure redirects if needed (example)
  async redirects() {
    return [];
  },

  // Configure rewrites if needed (example)
  async rewrites() {
    return [];
  },
};

export default nextConfig;
