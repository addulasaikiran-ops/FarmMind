import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FarmMind — AI Farm Decision System",
  description: "Weather-aware irrigation intelligence for farmers.",
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}
