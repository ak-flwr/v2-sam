import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SND Admin v2.5.1",
  description: "Resolution Engine for last-mile delivery control",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
