import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BadalonaMar",
  description:
    "Actualitat, platges, agenda i recomanacions de Canyadó, Casagemes, Centre i la Badalona de mar.",
  applicationName: "BadalonaMar",
  appleWebApp: {
    capable: true,
    title: "BadalonaMar",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#dff1ed",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ca">
      <body>
        <div className="root min-h-svh">{children}</div>
      </body>
    </html>
  );
}
