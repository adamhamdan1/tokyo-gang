import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "T O K Y O G A N G",
  description: "الموقع الرسمي لعصابة TOKYO GANG داخل عالم FiveM",
  openGraph: {
    title: "T O K Y O G A N G",
    description: "هيبة، سيطرة، ولاء — الموقع الرسمي لعصابة TOKYO GANG",
    url: "https://tokyo-gang.vercel.app",
    siteName: "T O K Y O G A N G",
    images: [
      {
        url: "https://tokyo-gang.vercel.app/preview.png",
        width: 1200,
        height: 630,
        alt: "T O K Y O G A N G",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "T O K Y O G A N G",
    description: "هيبة، سيطرة، ولاء — الموقع الرسمي لعصابة TOKYO GANG",
    images: ["https://tokyo-gang.vercel.app/preview.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar">
      <body className={cairo.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
