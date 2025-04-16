/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // This ensures that static HTML files are generated with the .html extension
  // which is important for hosting on traditional servers like cPanel
  trailingSlash: true,
};

module.exports = nextConfig;