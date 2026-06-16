import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://mmtechhouse.com'
  
  const routes = [
    '',
    '/encaja',
    '/herramientas/cuenta-de-cobro',
    '/herramientas/dashboard-oee',
    '/herramientas/automatizacion-iot',
    '/herramientas/politica-sst',
    '/herramientas/politica-calidad',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: route === '' ? 1.0 : 0.8,
  }))
}
