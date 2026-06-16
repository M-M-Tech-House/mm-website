import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
});
const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: "--font-geist-mono"
});

export const metadata: Metadata = {
  title: 'M&M Tech House | Tecnología Simple y a Tu Medida',
  description: 'Arquitectura de software que transforma problemas complejos en soluciones elegantes. Cloud Architecture, SaaS Development y Consultoría Estratégica.',
  keywords: ['software', 'arquitectura', 'cloud', 'aws', 'saas', 'desarrollo', 'colombia'],
  authors: [{ name: 'M&M Tech House' }],
  creator: 'M&M Tech House',
  icons: {
    icon: '/images/logo.png',
    apple: '/images/logo.png',
  },
  openGraph: {
    title: 'M&M Tech House | Tecnología Simple y a Tu Medida',
    description: 'Arquitectura de software que transforma problemas complejos en soluciones elegantes.',
    type: 'website',
    locale: 'es_CO',
  },
}

export const viewport: Viewport = {
  themeColor: '#f8fafc',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18241555037"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'AW-18241555037');
          `}
        </Script>
      </body>
    </html>
  )
}
