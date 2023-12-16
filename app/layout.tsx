import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Trivia Game powered by GPT',
  description: 'Demo by SImone Leonelli forked from  Syndicate.io ,GitHub repo by ian @syndicateio in couple hours with OpenAI and Syndicate.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
