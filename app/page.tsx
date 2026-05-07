"use client"

import { useState } from "react"
import { AnimatePresence } from "framer-motion"
import { LoadingScreen } from "@/components/loading-screen"
import { HeroSection } from "@/components/hero-section"
import { StorytellingSection } from "@/components/storytelling-section"
import { ServicesSection } from "@/components/services-section"
import { Footer } from "@/components/footer"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <LoadingScreen onComplete={() => setIsLoading(false)} />
        )}
      </AnimatePresence>

      {!isLoading && (
        <main className="min-h-screen">
          <HeroSection />
          <StorytellingSection />
          <ServicesSection />
          <Footer />
        </main>
      )}
    </>
  )
}
