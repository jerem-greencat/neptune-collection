import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		// Affiches de films servies par TMDB.
		remotePatterns: [
			{
				protocol: "https",
				hostname: "image.tmdb.org",
				pathname: "/t/p/**",
			},
		],
	},
};

export default nextConfig;
