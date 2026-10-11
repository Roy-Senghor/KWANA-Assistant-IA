import "./globals.css";

export const metadata = { title: "Kwana" };

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}