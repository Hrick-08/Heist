/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required: the pages use `export const instant` and lib/db.ts uses `io()`,
  // which only exist with Cache Components (Next 16).
  cacheComponents: true,
};

export default nextConfig;
