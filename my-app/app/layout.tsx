import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GovCheck",
  description: "Consulta trámites oficiales fácilmente y de forma segura.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}