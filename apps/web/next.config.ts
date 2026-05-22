import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@loop/db', '@loop/orchestrator', '@loop/ai'],
}

export default nextConfig
