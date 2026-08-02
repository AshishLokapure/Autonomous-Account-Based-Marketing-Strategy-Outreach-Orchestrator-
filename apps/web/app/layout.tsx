import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/providers/auth-provider";
import { CampaignProvider } from "@/stores/campaign-store";

export const metadata: Metadata = {
  title: "AccountPilot AI",
  description: "Autonomous account intelligence for enterprise teams.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CampaignProvider>{children}</CampaignProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
