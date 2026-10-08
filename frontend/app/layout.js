export const metadata = { title: "Kwana" };

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "sans-serif", padding: 24 }}>{children}</body>
    </html>
  );
}