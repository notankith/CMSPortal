import path from "path"

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // Add an alias to shim a missing file some packages expect to find inside es-toolkit.
  // This avoids editing node_modules and lets Next/Turbopack resolve the required module.
  webpack(config) {
    config.resolve = config.resolve || {}
    config.resolve.alias = config.resolve.alias || {}

    // Map the path that failed to a local shim we provide in the repo
    config.resolve.alias["es-toolkit/dist/compat/array/last.js"] = path.resolve(
      process.cwd(),
      "shims/es-toolkit/dist/compat/array/last.js",
    )

    return config
  },
  // Provide an (empty) turbopack config to avoid Turbopack/webpack mismatch errors.
  turbopack: {},
}

export default nextConfig
