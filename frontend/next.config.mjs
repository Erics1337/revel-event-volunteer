/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow API calls to the Cloudflare Worker backend
  async rewrites() {
    return [
      {
        source: '/bsw/api/:path*',
        destination: `${process.env.WORKER_URL || 'http://localhost:8787'}/bsw/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
