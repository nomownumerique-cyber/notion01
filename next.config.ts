import type { NextConfig } from 'next';
const config: NextConfig = { poweredByHeader: false, outputFileTracingIncludes: { '/api/reports/content.pdf': ['./node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf', './node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf'], '/api/reports/competitors.pdf': ['./node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf', './node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf'] } };
export default config;
