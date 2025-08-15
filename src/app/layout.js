import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "TXS Digital Invoicing - Smart Invoice Management",
  description: "TXS Digital Invoicing is the dedicated platform for invoice management that helps to grow your startup business quickly. Seamlessly integrate with FBR for automatic tax compliance.",
  keywords: "invoice management, FBR integration, digital invoicing, tax compliance, Pakistan",
  authors: [{ name: "TXS Digital Marketing" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
