const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

module.exports = {
  trailingSlash: true,
  reactStrictMode: true,

  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` },
      { source: '/uploads/:path*', destination: `${BACKEND_URL}/uploads/:path*` },
    ];
  },

  redirects() {
    return [];
  },
  images: {
    remotePatterns: [],
    dangerouslyAllowSVG: true,
  },
};
