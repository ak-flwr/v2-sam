import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SND Delivery Control Link v2.5.1",
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
