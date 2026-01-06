import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PlanningProvider } from "./context/PlanningContext";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Produktionsplanungstool",
  description: "Production Planning Tool for Manufacturing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${inter.className} antialiased bg-slate-100`}>
        <PlanningProvider>
          {children}
        </PlanningProvider>
      </body>
    </html>
  );
}
