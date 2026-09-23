import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://website-asset-extractor.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Website Asset Extractor — Download Website Images & Media",
    template: "%s | Website Asset Extractor",
  },
  description:
    "Extract images from website pages, extract website media, and download website images with previews, filters, and ZIP export. Free website image downloader for public URLs.",
  keywords: [
    "Website Asset Extractor",
    "Extract Images From Website",
    "Extract Website Media",
    "Download Website Images",
    "Website Image Downloader",
  ],
  openGraph: {
    title: "Website Asset Extractor",
    description:
      "Scan any public website and download images, videos, audio, SVGs, and files.",
    type: "website",
    locale: "en_US",
    siteName: "Website Asset Extractor",
  },
  twitter: {
    card: "summary_large_image",
    title: "Website Asset Extractor",
    description: "Extract and download website media assets from public URLs.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
