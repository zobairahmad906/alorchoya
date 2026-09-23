import createNextIntlPlugin from 'next-intl/plugin';
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000' },
      { protocol: 'https', hostname: 'minio-alorchoya.newsmartagent.com' }
    ]
  }
};
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
export default withNextIntl(nextConfig);
