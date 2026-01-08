import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import QueryProvider from './QueryProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata = {
  title: 'DSQR Studio',
  description: 'Creative Studio',
  icons: {
    icon: '/dsqr_logo.png', // tab favicon (small)
  },
  openGraph: {
    title: 'DSQR Studio',
    description: 'Creative Studio',
    url: 'dsqr.studio',
    siteName: 'DSQR Studio',
    images: [
      {
        url: '/dsqr_logo.png', // big preview image
        width: 1200,
        height: 630,
        alt: 'DSQR Studio',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DSQR Studio',
    description: 'Creative Studio',
    images: ['/dsqr_logo.png'], // same as OG
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
