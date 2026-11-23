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
      <body className="min-h-full flex flex-col font-sans bg-[#fbf9f9] text-[#140d12] antialiased selection:bg-rose-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
