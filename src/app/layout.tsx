import type { Metadata } from 'next';

import PwaRegister from '@/components/PwaRegister';

import './globals.css';

export const metadata: Metadata = {
  title: 'Lingine',
  description: 'Daily modular learning workspace',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
