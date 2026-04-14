import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'PPTX Agent - Conversational PowerPoint Editor',
  description: 'Generate and edit PowerPoint presentations through natural conversation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}