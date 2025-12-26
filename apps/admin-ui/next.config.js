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
    ],
  },
  output: "standalone",
  experimental: {
    esmExternals: false,
    outputFileTracingRoot: path.join(__dirname, "../../"),
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
