import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeStream AI — Live Technical Subtitles | Nerdearla 2026",
  description:
    "Subtitulado y traducción en tiempo real con IA para conferencias de tecnología",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2310b981'><polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2'/></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
