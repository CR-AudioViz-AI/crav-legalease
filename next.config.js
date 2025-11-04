/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['kteobfyferrukqeolofj.supabase.co'],
  },
  // Remove experimental serverActions as it's stable in Next.js 14
}

module.exports = nextConfig
