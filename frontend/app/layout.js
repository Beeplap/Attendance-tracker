import "./globals.css";

export const metadata = {
  title: "ScholarSync",
  description: "Login and role-based dashboards",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <body className="antialiased">{children}</body>
    </html>
  );
}
