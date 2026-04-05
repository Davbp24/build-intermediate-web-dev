import type { NextConfig } from 'next'
import path from 'path'

const ANNOTATION_BACKEND =
  process.env.ANNOTATION_API_ORIGIN ?? 'http://127.0.0.1:3001'

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  /** Extension posts to localhost:3000/api/annotations — forward to Express (port 3001). */
  async rewrites() {
    return [
      {
        source: '/api/annotations',
        destination: `${ANNOTATION_BACKEND}/api/annotations`,
      },
    ]
  },
}

export default nextConfig
