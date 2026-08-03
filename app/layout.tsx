import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "InsuranceFraudAi — Explainable Claim Fraud Triage",
  description:
    "A cost-sensitive decision-tree model that flags high-risk insurance claims for review, with a fully auditable decision path.",
  openGraph: {
    title: "InsuranceFraudAi",
    description:
      "Explainable, cost-sensitive fraud triage for insurance claims.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
