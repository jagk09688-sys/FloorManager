/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // enables slim Docker image
  experimental: {
    serverActions: {},
    turbo: false, // 👈 disables Turbopack
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": __dirname,
    };
    return config;
  },
};

module.exports = nextConfig;