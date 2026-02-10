import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SPOT - Simple Personal Output Trigger",
  description: "Self-hosted webhook-to-push notification gateway",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/LOGO.svg", type: "image/svg+xml" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/LOGO.svg",
  },
};


export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

