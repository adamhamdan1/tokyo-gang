import type { Metadata, Viewport } from "next";
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
  applicationName: "TOKYO GANG Command Portal",
  title: {
    default: "TOKYO GANG | البوابة الرسمية",
    template: "%s | TOKYO GANG",
  },
  description: "البوابة الرسمية لعصابة TOKYO GANG داخل عالم FiveM — القيادة، القوانين، العمليات، التقديم، وإدارة الأعضاء.",
  keywords: ["TOKYO GANG", "FiveM", "Tokyo Gang Portal", "عصابة توكيو", "Discord", "Kick Streamers"],
  authors: [{ name: "TOKYO GANG" }],
  creator: "TOKYO GANG",
  publisher: "TOKYO GANG",
  category: "gaming",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/icon", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/icon", type: "image/png", sizes: "512x512" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "TOKYO GANG | البوابة الرسمية",
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

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.className} ${changa.variable}`}>
        <Providers>
          <ToastProvider>
            <PageTransitionOverlay />
            {children}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Organization",
                  name: "TOKYO GANG",
                  url: "https://www.tokyo-gang.com",
                  logo: "https://www.tokyo-gang.com/icon",
                  sameAs: ["https://discord.gg/xTxcswpzNN"],
                }).replace(/</g, "\\u003c"),
              }}
            />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
