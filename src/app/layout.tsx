import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { ConditionalSiteFooter } from "@/components/conditional-site-footer";
import { business } from "@/lib/business";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chibodycare.com.au"),
  title: {
    default: `${business.name} — Massage, Acupuncture & Wellness in Adelaide`,
    template: `%s | ${business.name}`,
  },
  description:
    "Chi Body Care offers relaxation & remedial massage, acupuncture, foot care and Chinese medicine across Adelaide. Book your restorative treatment online today.",
  keywords: [
    "massage Adelaide",
    "remedial massage",
    "acupuncture",
    "Chinese medicine",
    "foot care",
    "wellness spa",
    "Chi Body Care",
  ],
  openGraph: {
    title: `${business.name} — Restorative Wellness in Adelaide`,
    description:
      "Relaxation & remedial massage, acupuncture, foot care and Chinese medicine. Book online.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-cream-100 text-brown-900">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <ConditionalSiteFooter />
      </body>
    </html>
  );
}
