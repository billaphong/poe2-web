import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "PoE2 Path of Building",
  description: "Load and inspect Path of Exile 2 builds",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${geistMono.variable}`}
        style={{ fontFamily: "var(--font-geist, var(--sans))" }}
      >
        {children}
      </body>
    </html>
  );
}
