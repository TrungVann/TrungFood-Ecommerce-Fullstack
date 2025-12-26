const { composePlugins, withNx } = require("@nx/next");
const path = require("path");

const nextConfig = {
  nx: {
    svgr: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.pinimg.com",
        pathname: "/**",
      },
    ],
  },
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  experimental: {
    esmExternals: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@packages": require("path").resolve(__dirname, "../../packages"),
    };
    return config;
  },
};

const plugins = [withNx];

module.exports = composePlugins(...plugins)(nextConfig);
