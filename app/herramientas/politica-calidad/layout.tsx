import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Asistente y Generador de Políticas SGC ISO 9001 | M&M Tech House',
  description: 'Evalúa la madurez de tu organización y genera tu Política de Calidad bajo la norma ISO 9001:2015 de forma interactiva y profesional.',
  keywords: [
    'generador politica calidad iso 9001',
    'politica sgc iso 9001 gratis',
    'sgc iso 9001 2015',
    'enfoque comercial politica de calidad',
    'politica de calidad de una empresa',
    'formato politica de calidad pdf'
  ],
  openGraph: {
    title: 'Generador de Políticas SGC ISO 9001 & Diagnóstico de Madurez | M&M Tech House',
    description: 'Genera el formato de Política de Calidad ISO 9001:2015 adaptado a tu sector y tamaño de empresa en minutos.',
    url: 'https://mmtechhouse.com/herramientas/politica-calidad',
    siteName: 'M&M Tech House',
    locale: 'es_CO',
    type: 'website',
    images: [
      {
        url: 'https://mmtechhouse.com/images/og-politica-calidad.jpg',
        width: 1200,
        height: 630,
        alt: 'Generador de Políticas SGC ISO 9001 - M&M Tech House',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Generador de Políticas SGC ISO 9001 & Diagnóstico de Madurez | M&M Tech House',
    description: 'Genera tu Política de Calidad ISO 9001:2015 obligatoria gratis.',
    images: ['https://mmtechhouse.com/images/og-politica-calidad.jpg'],
  }
}

export default function PoliticaCalidadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
