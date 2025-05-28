import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AKPsi Alumni Network',
  description: 'Connecting Alpha Kappa Psi brothers across generations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
