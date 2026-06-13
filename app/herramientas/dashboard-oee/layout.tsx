import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard OEE Interactivo | Medición de Eficiencia de Planta',
  description: 'Calcula y analiza la Eficiencia General de los Equipos (OEE) en tiempo real. Carga tus reportes CSV, evalúa Disponibilidad, Rendimiento y Calidad con gráficos interactivos.',
  keywords: [
    'dashboard oee',
    'calcular oee gratis',
    'eficiencia general de los equipos',
    'medidor oee svg',
    'analisis de paradas de maquina',
    'kpis de produccion industrial',
    'calcular disponibilidad rendimiento calidad'
  ],
  openGraph: {
    title: 'Dashboard OEE Interactivo | Medición de Eficiencia Industrial',
    description: 'Calcula y analiza el OEE de tu planta de producción. Tacómetro SVG interactivo con análisis de paradas y control de piezas defectuosas.',
    url: 'https://mmtechhouse.com/herramientas/dashboard-oee',
    siteName: 'M&M Tech House',
    locale: 'es_CO',
    type: 'website',
    images: [
      {
        url: 'https://mmtechhouse.com/images/og-dashboard-oee.jpg',
        width: 1200,
        height: 630,
        alt: 'Dashboard OEE Interactivo - M&M Tech House',
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dashboard OEE Interactivo | Medición de Eficiencia Industrial',
    description: 'Visualiza la disponibilidad, rendimiento y calidad de tus líneas de producción con nuestro velocímetro OEE en tiempo real.',
    images: ['https://mmtechhouse.com/images/og-dashboard-oee.jpg'],
  }
}

export default function DashboardOeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
