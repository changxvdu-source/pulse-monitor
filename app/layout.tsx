import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { getLocale } from "@/lib/i18n/server";
import "./globals.css";

const sans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
});

const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pulse",
  description: "HTTP(S) uptime monitor for a single Operator",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#f6f4ef] font-sans text-zinc-900">
        {children}
      </body>
    </html>
  );
}
