import type { NextConfig } from 'next';

// React dev mode needs eval() for callstack reconstruction. Never in production.
const isDev = process.env.NODE_ENV !== 'production';

const securityHeaders = [
	{ key: 'X-Frame-Options', value: 'DENY' },
	{ key: 'X-Content-Type-Options', value: 'nosniff' },
	{ key: 'Referrer-Policy', value: 'no-referrer' },
	{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet, noimageindex' },
	{
		key: 'Permissions-Policy',
		value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
	},
	{
		key: 'Content-Security-Policy',
		value: [
			"default-src 'self'",
			`script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data: blob:",
			"font-src 'self' data:",
			"connect-src 'self'",
			"object-src 'none'",
			"base-uri 'self'",
			"form-action 'self'",
			"frame-ancestors 'none'",
		].join('; '),
	},
];

const nextConfig: NextConfig = {
	output: 'standalone',
	reactCompiler: true,
	poweredByHeader: false,
	async headers() {
		return [{ source: '/:path*', headers: securityHeaders }];
	},
};

export default nextConfig;
