import './globals.css'

export const metadata = {
  title: 'Attendance Tracker',
  description: 'Login and role-based dashboards',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
