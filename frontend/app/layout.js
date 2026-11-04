import "./globals.css";
import { SettingsProvider } from "./components/SettingsProvider";

export const metadata = { title: "Kwana" };

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}