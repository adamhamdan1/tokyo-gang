import type { Metadata } from "next";
import { Cairo, Changa } from "next/font/google";
import { Providers } from "./providers";
import { PageTransitionOverlay } from "./PageTransitionOverlay";
import { ToastProvider } from "./ToastProvider";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic"],
});

const changa = Changa({
  subsets: ["arabic", "latin"],
  variable: "--font-changa",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.tokyo-gang.com"),
  title: "T O K Y O G A N G",
  description: "الموقع الرسمي لعصابة TOKYO GANG داخل عالم FiveM",
  openGraph: {
    title: "T O K Y O G A N G",
    description: "هيبة، سيطرة، ولاء — الموقع الرسمي لعصابة TOKYO GANG",
    url: "https://www.tokyo-gang.com",
    siteName: "T O K Y O G A N G",
    images: [
      {
        url: "/preview.png",
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
    images: ["/preview.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar">
      <body className={`${cairo.className} ${changa.variable}`}>
        <Providers>
          <ToastProvider>
            <PageTransitionOverlay />
            {children}
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
