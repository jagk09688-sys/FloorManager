/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {},
  },
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;