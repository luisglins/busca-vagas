import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";

// Títulos e números: Bricolage Grotesque (personalidade). Texto: DM Sans (leitura fácil).
const fonteTitulo = Bricolage_Grotesque({
  variable: "--fonte-titulo",
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz", "wdth"],
});

const fonteTexto = DM_Sans({
  variable: "--fonte-texto",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Busca Vagas",
  description: "Sugestões de vagas com nota de aderência e acompanhamento de candidaturas",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${fonteTitulo.variable} ${fonteTexto.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
