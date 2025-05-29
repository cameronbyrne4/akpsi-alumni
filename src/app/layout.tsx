import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ClientLayoutShell from '@/components/client-layout-shell'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Alpha Kappa Psi Alumni Network',
  description: 'Connecting brothers across generations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayoutShell>
          {children}
        </ClientLayoutShell>
      </body>
    </html>
  )
}
