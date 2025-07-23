/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // 静的エクスポート用に画像最適化を無効化
    remotePatterns: [
      {
        protocol: "https",
        hostname: "localhost",
        port: "7144",
        pathname: "/emojis/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "7144",
        pathname: "/emojis/**",
      },
      {
        protocol: "https",
        hostname: "**",
        pathname: "/emojis/**",
      },
      {
        protocol: "https",
        hostname: "*.blob.core.windows.net",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
