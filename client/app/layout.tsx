import type { Metadata, Viewport } from "next";
import { Bangers, Inter, Geist_Mono } from "next/font/google";
import { WalletContextProvider } from "./components/WalletContextProvider";
import "./globals.css";

const SITE_NAME = "Limit Break";
const SITE_TITLE = `${SITE_NAME} — Trade Dragon Ball Card Perpetuals`;
const SITE_DESCRIPTION =
  "The first decentralized derivatives platform for Dragon Ball Super TCG collectibles. Go long or short on real card prices with leverage.";

const bangers = Bangers({
  variable: "--font-bangers",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Dragon Ball",
    "DBZ",
    "TCG",
    "trading card perpetuals",
    "Solana",
    "perps",
    "leverage trading",
    "crypto",
  ],
  authors: [{ name: SITE_NAME }],
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#060504",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bangers.variable} ${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-zinc-100 font-sans">
        <WalletContextProvider>{children}</WalletContextProvider>
      </body>
    </html>
  );
}
