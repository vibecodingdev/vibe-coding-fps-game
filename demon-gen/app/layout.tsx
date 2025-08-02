import { Metadata } from "next";
import { PropsWithChildren } from "react";
import "styles/globals.css";

const title = "Monster Generator - AI-Powered Game Demon Creator";
const description =
  "Generate custom game demons using natural language and AI. Create, customize, and export JSON demon configurations for your DOOM-style FPS game.";

export const metadata: Metadata = {
  title: title,
  description: description,
  openGraph: {
    title: title,
    description: description,
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gaming-bg-primary font-gaming min-h-screen">
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
