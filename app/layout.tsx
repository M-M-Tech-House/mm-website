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
  metadataBase: new URL('https://mmtechhouse.com'),
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

const schemaMarkup = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://mmtechhouse.com/#website",
      "url": "https://mmtechhouse.com",
      "name": "M&M Tech House",
      "alternateName": ["MM Tech House", "M&M Tech House S.A.S."],
      "description": "Arquitectura de software que transforma problemas complejos en soluciones elegantes."
    },
    {
      "@type": "Organization",
      "@id": "https://mmtechhouse.com/#organization",
      "name": "M&M Tech House",
      "alternateName": "MM Tech House",
      "url": "https://mmtechhouse.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://mmtechhouse.com/images/logo.png"
      },
      "sameAs": [
        "https://www.linkedin.com/company/111298213/",
        "https://x.com/mmtechhouse",
        "https://github.com/M-M-Tech-House"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "info@mmtechhouse.co",
        "contactType": "customer support"
      }
    },
    {
      "@type": "ItemList",
      "@id": "https://mmtechhouse.com/#sitelinks",
      "name": "Herramientas de M&M Tech House",
      "itemListElement": [
        {
          "@type": "SiteNavigationElement",
          "position": 1,
          "name": "Cuenta de Cobro",
          "description": "Generador de cuenta de cobro profesional gratis en Colombia",
          "url": "https://mmtechhouse.com/herramientas/cuenta-de-cobro"
        },
        {
          "@type": "SiteNavigationElement",
          "position": 2,
          "name": "Dashboard OEE",
          "description": "Medidor y analítica de eficiencia de planta de producción",
          "url": "https://mmtechhouse.com/herramientas/dashboard-oee"
        },
        {
          "@type": "SiteNavigationElement",
          "position": 3,
          "name": "Constructor IoT",
          "description": "Programación visual y simulación de automatizaciones IoT",
          "url": "https://mmtechhouse.com/herramientas/automatizacion-iot"
        },
        {
          "@type": "SiteNavigationElement",
          "position": 4,
          "name": "Políticas SG-SST",
          "description": "Generador y asistente de políticas SG-SST obligatorio",
          "url": "https://mmtechhouse.com/herramientas/politica-sst"
        },
        {
          "@type": "SiteNavigationElement",
          "position": 5,
          "name": "Políticas SGC ISO 9001",
          "description": "Asistente y generador de políticas SGC ISO 9001",
          "url": "https://mmtechhouse.com/herramientas/politica-calidad"
        },
        {
          "@type": "SiteNavigationElement",
          "position": 6,
          "name": "Encaja",
          "description": "Sincroniza tus bases de datos locales y offline a Google Sheets",
          "url": "https://mmtechhouse.com/encaja"
        }
      ]
    }
  ]
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
        />
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

            function gtag_report_conversion(url) {
              var callback = function () {
                if (typeof(url) != 'undefined') {
                  window.location = url;
                }
              };
              gtag('event', 'conversion', {
                  'send_to': 'AW-18241555037/7-1eCKaI078cEN2UoPpD',
                  'value': 1.0,
                  'currency': 'COP',
                  'event_callback': callback
              });
              return false;
            }
            window.gtag_report_conversion = gtag_report_conversion;
          `}
        </Script>
      </body>
    </html>
  )
}
