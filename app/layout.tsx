import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medical Necessity Evidence Prototype",
  description:
    "Assembles medical-necessity evidence from synthetic inpatient psychiatric stay records.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
