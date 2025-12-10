import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { FoodsProvider } from "@/lib/contexts/FoodsContext";
import { MealsProvider } from "@/lib/contexts/MealsContext";
import { UserProvider } from "@/lib/contexts/UserContext";
import { NotificationProvider } from "@/lib/contexts/NotificationContext";
import { CalorieProgressProvider } from "@/lib/contexts/CalorieProgressContext";
import { BadgeProviderWrapper } from "@/components/providers/BadgeProviderWrapper";


const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "QueComemos",
  description: "El sabor de la democracia en cada comida.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <UserProvider>
          <BadgeProviderWrapper>
            <FoodsProvider>
              <MealsProvider>
                <NotificationProvider>
                  <CalorieProgressProvider>
                    <ThemeProvider
                      attribute="class"
                      defaultTheme="system"
                      enableSystem
                      disableTransitionOnChange
                    >
                      {children}
                    </ThemeProvider>
                  </CalorieProgressProvider>
                </NotificationProvider>
              </MealsProvider>
            </FoodsProvider>
          </BadgeProviderWrapper>
        </UserProvider>
      </body>
    </html>
  );
}
