import type { Metadata } from "next";
import "./globals.css";
import { PlanningProvider } from "./context/PlanningContext";
import { CRMProvider } from "./context/CRMContext";

export const metadata: Metadata = {
  title: "Produktionsplanungstool",
  description: "Production Planning Tool for Manufacturing with CRM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="font-sans antialiased bg-slate-100">
        <PlanningProvider>
          <CRMProvider>
            {children}
          </CRMProvider>
        </PlanningProvider>
      </body>
    </html>
  );
}
