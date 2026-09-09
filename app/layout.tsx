import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { I18nProvider, Locale } from "@/lib/i18n/context";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const ibmPlexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-ibm-plex-mono" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0d0e0e",
};

export const metadata: Metadata = {
  title: "Club Génie Industriel ENIT - Live Your Best Experiences",
  description: "Plateforme officielle du Club Génie Industriel de l'École Nationale d'Ingénieurs de Tunis (ENIT). Supply Chain, Production, Amélioration Continue et Industrie 4.0.",
  icons: {
    icon: [
      { url: "/favicon.png?v=3", type: "image/png" },
      { url: "/favicon.ico?v=3" },
    ],
    shortcut: "/favicon.png?v=3",
    apple: "/favicon.png?v=3",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value as Locale | undefined;
  const initialLocale: Locale = localeCookie === "en" ? "en" : "fr";

  return (
    <html lang={initialLocale} suppressHydrationWarning className="scroll-smooth">
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} min-h-screen flex flex-col antialiased bg-background text-foreground transition-colors duration-200`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider initialLocale={initialLocale}>
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
