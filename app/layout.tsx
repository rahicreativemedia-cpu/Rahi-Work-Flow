import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAHI Flowdesk | Creative Agency Management Platform",
  description: "Enterprise four-portal creative agency management system by RAHI Creative Media",
  icons: {
    icon: "/rahi-logo.png",
    apple: "/rahi-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col font-sans bg-neutral-50 text-neutral-900 antialiased selection:bg-black selection:text-white">
        {children}
      </body>
    </html>
  );
}
