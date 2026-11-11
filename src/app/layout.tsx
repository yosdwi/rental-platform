import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { Providers } from "@/components/shell/providers";

export const metadata: Metadata = {
  title: "lajur — sewa motor tanpa ribet",
  description: "Sewa motor dari rental terdekat. Untuk pemilik rental: booking, lokasi, zona, dan servis dalam satu aplikasi.",
  applicationName: "lajur",
  appleWebApp: { capable: true, title: "lajur", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#1e2a78",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
