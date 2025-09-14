import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MarketingApp',
  description: 'Created by Sean Diaz',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
