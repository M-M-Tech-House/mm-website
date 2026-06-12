import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Generador de Cuenta de Cobro Gratis | En Línea y PDF',
  description: 'Crea tu cuenta de cobro online gratis en segundos. Formato profesional en PDF para Colombia listo para descargar. Ideal para independientes y PYMEs.',
  keywords: [
    'generador de cuenta de cobro gratis',
    'cuenta de cobro para imprimir',
    'crear cuenta de cobro online',
    'formato de cuenta de cobro colombia',
    'plantilla cuenta de cobro',
    'generar cuenta de cobro pdf'
  ],
  openGraph: {
    title: 'Generador de Cuenta de Cobro Gratis | En Línea y PDF',
    description: 'Crea tu cuenta de cobro online gratis en segundos. Formato profesional en PDF para Colombia listo para descargar e imprimir.',
    url: 'https://mmtechhouse.com/herramientas/cuenta-de-cobro',
    siteName: 'M&M Tech House',
    locale: 'es_CO',
    type: 'website',
    images: [
      {
        url: 'https://mmtechhouse.com/images/og-cuenta-de-cobro.jpg',
        width: 1200,
        height: 630,
        alt: 'Generador de Cuenta de Cobro Gratis - M&M Tech House',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Generador de Cuenta de Cobro Gratis | En Línea y PDF',
    description: 'Crea tu cuenta de cobro online gratis en segundos. Formato profesional en PDF para Colombia listo para descargar e imprimir.',
    images: ['https://mmtechhouse.com/images/og-cuenta-de-cobro.jpg'],
  }
}

export default function CuentaDeCobroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
