import type { Metadata } from 'next';
import './styles.css';
export const metadata: Metadata = { title: 'Marketing OS', description: 'Un espace pour préparer et organiser votre marketing.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
