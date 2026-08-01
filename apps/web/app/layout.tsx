import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AccountPilot AI",
  description: "Autonomous account intelligence for enterprise teams."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
