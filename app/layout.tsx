import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAM v2 - Delivery Control Link",
  description: "Resolution Engine for last-mile delivery control",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
