import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/query-provider";
import { ThemeProvider } from "@/lib/providers/theme-provider";
import { Toaster } from "react-hot-toast";
import { GlobalAIAssistant } from "@/components/global-ai-assistant";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "I-si - Climate Risk Prediction Platform",
  description: "Climate risk prediction and visualization platform for Rwanda using satellite data",
  keywords: ["climate", "risk", "prediction", "Rwanda", "satellite", "NASA", "CHIRPS", "NDVI"],
  authors: [{ name: "I-si Team" }],
  openGraph: {
    title: "I-si - Climate Risk Prediction Platform",
    description: "Climate risk prediction and visualization platform for Rwanda using satellite data",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "I-si - Climate Risk Prediction Platform",
    description: "Climate risk prediction and visualization platform for Rwanda using satellite data",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <GlobalAIAssistant />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
