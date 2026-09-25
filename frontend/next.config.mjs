import createNextIntlPlugin from 'next-intl/plugin';
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000' },
      { protocol: 'https', hostname: 'minio-alorchoya.newsmartagent.com' }
    ]
  },
  async rewrites() {
    const backendHost = process.env.INTERNAL_API_URL || 'http://backend:8000/api';
    const destinationBase = backendHost.replace(/\/+$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${destinationBase}/:path*`,
      },
    ];
  }
};
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
export default withNextIntl(nextConfig);
