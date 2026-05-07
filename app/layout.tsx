import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "TOKYO GANG",
  description: "TOKYO GANG FiveM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar">
      <body className={cairo.className}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}