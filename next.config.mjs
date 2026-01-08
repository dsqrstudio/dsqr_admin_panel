/** @type {import('next').NextConfig} */

const nextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/api/admin/media-items/:path*',
        destination: 'http://localhost:4000/api/admin/media-items/:path*',
      },
      {
        source: '/api/admin/before-after-pairs/:path*',
        destination:
          'http://localhost:4000/api/admin/before-after-pairs/:path*',
      },
      {
        source: '/api/admin/before-after-pairs',
        destination: 'http://localhost:4000/api/admin/before-after-pairs',
      },
    ]
  },
}

export default nextConfig
