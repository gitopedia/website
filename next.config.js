/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  transpilePackages: ['remark', 'remark-html']
};

module.exports = nextConfig;


