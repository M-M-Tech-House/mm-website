import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'EnCaja | Controla tu Caja Menor',
  description: 'Lleva el control de tus finanzas locales y sincronízalas directamente en tus Hojas de Cálculo de Google. 100% privado y seguro.',
}

export default function EnCajaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
