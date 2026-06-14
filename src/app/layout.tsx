import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Economic X-Ray Vision",
  description: "Local-first constraint intelligence for healthcare administration."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
