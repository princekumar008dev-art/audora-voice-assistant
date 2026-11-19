import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Echo - AI Voice Assistant | Amazon Echo & Alexa Web App',
  description: 'Futuristic AI Voice Assistant web app inspired by Amazon Echo & Alexa. Powered by Web Speech, Next.js, and Supabase.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2245%22 fill=%22%2300d2ff%22/></svg>" />
      </head>
      <body className="antialiased selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
