import { landingVisual } from '../../assets/landing-visual';
export function GET() {
  return new Response(Buffer.from(landingVisual, 'base64'), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' } });
}
