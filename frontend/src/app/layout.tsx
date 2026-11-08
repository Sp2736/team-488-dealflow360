import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { DemoBootstrap } from "@/demo/DemoBootstrap";
import { DemoBanner } from "@/demo/ui/DemoBanner";
import { TourOverlay } from "@/demo/ui/TourOverlay";
import { TraceDrawer } from "@/demo/ui/TraceDrawer";

export const metadata: Metadata = {
  title: "DealFlow360 – Interactive Demo",
  description: "Sales & Operations Command Center (Interactive Browser-Side Demo)",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex" />
      </head>
      <body>
        <DemoBootstrap>
          <DemoBanner />
          <Providers>
            {children}
          </Providers>
          <TourOverlay />
          <TraceDrawer />
        </DemoBootstrap>
      </body>
    </html>
  );
}
