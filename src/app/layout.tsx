import type { Metadata } from 'next';
import './styles.css';
export const metadata: Metadata = { title: 'Marketing OS', description: 'Espace marketing' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
