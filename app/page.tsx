"use client"

import { useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import { LoadingScreen } from "@/components/loading-screen"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { StorytellingSection } from "@/components/storytelling-section"
import { ServicesSection } from "@/components/services-section"
import { Footer } from "@/components/footer"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash
      const timer = setTimeout(() => {
        if (hash === "#" || hash === "#/") {
          window.scrollTo({ top: 0, behavior: "smooth" })
        } else {
          try {
            const target = document.querySelector(hash)
            if (target) {
              target.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          } catch (e) {
            console.error("Error scrolling to hash:", hash, e)
          }
        }
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <LoadingScreen onComplete={() => setIsLoading(false)} />
        )}
      </AnimatePresence>

      {!isLoading && (
        <main className="min-h-screen relative">
          <Header />
          <HeroSection />
          <StorytellingSection />
          <ServicesSection />
          <Footer />
        </main>
      )}
    </>
  )
}
