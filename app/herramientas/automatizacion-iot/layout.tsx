import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Constructor de Automatizaciones IoT Online | Simulación de Nodos',
  description: 'Diseña, conecta y simula automatizaciones domóticas e IoT de forma visual por nodos. Simulación de protocolos Zigbee y Matter sin escribir código.',
  keywords: [
    'constructor automatizaciones iot',
    'programacion visual iot por nodos',
    'simulador domotica online',
    'creador de flujos inteligentes zigbee',
    'disparadores y acciones iot',
    'simulador protocolo matter gratis'
  ],
  openGraph: {
    title: 'Constructor de Automatizaciones IoT por Nodos | M&M Tech House',
    description: 'Diseña, conecta y simula automatizaciones domóticas de forma visual por nodos. Elige protocolos como Matter y Zigbee en tiempo real.',
    url: 'https://mmtechhouse.com/herramientas/automatizacion-iot',
    siteName: 'M&M Tech House',
    locale: 'es_CO',
    type: 'website',
    images: [
      {
        url: 'https://mmtechhouse.com/images/og-automatizacion-iot.jpg',
        width: 1200,
        height: 630,
        alt: 'Constructor Visual de Automatizaciones IoT - M&M Tech House',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Constructor de Automatizaciones IoT por Nodos | M&M Tech House',
    description: 'Diseña y simula flujos inteligentes IoT por nodos de forma visual y gratuita.',
    images: ['https://mmtechhouse.com/images/og-automatizacion-iot.jpg'],
  }
}

export default function AutomatizacionIotLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
