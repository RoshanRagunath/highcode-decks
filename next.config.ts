import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;

// Enable Cloudflare bindings (D1, etc.) under `next dev` via OpenNext.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
