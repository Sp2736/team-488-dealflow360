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
  openGraph: {
    title: "DealFlow360 – Interactive Demo",
    description: "Enterprise Sales & Operations Command Center running pure business engines client-side.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DealFlow360 – Interactive Demo",
    description: "Enterprise Sales & Operations Command Center running pure business engines client-side.",
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
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;" />
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
