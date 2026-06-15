import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Asistente y Generador de Políticas SG-SST | Colombia',
  description: 'Evalúa la clase de riesgo legal de tu empresa según el Decreto 1607 y genera la Política de Seguridad y Salud en el Trabajo (SG-SST) conforme al Decreto 1072 de 2015.',
  keywords: [
    'generador politica sst colombia',
    'decreto 1072 de 2015 sst',
    'clase de riesgo ciiu colombia',
    'decreto 1607 de 2002 ciiu',
    'politica de seguridad y salud en el trabajo',
    'formato politica sst gratis'
  ],
  openGraph: {
    title: 'Generador de Políticas SG-SST & Diagnóstico de Riesgos | M&M Tech House',
    description: 'Diagnostica la clase de riesgo legal de tu empresa y genera el formato de Política SG-SST obligatorio de forma gratuita y visual.',
    url: 'https://mmtechhouse.com/herramientas/politica-sst',
    siteName: 'M&M Tech House',
    locale: 'es_CO',
    type: 'website',
    images: [
      {
        url: 'https://mmtechhouse.com/images/og-politica-sst.jpg',
        width: 1200,
        height: 630,
        alt: 'Generador de Políticas SG-SST - M&M Tech House',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Generador de Políticas SG-SST & Diagnóstico de Riesgos | M&M Tech House',
    description: 'Genera el formato de Política SG-SST obligatorio y evalúa tu riesgo legal gratis en minutos.',
    images: ['https://mmtechhouse.com/images/og-politica-sst.jpg'],
  }
}

export default function PoliticaSstLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
