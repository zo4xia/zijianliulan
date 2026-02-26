import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  
  // 外部化 MCP SDK，避免编译时解析错误
  serverExternalPackages: ['@modelcontextprotocol/sdk'],
};

export default nextConfig;
