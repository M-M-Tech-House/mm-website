"use client"

import { useRef, useEffect, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { ChevronDown } from "lucide-react"

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setMousePosition({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      })
    }

    const container = containerRef.current
    container?.addEventListener("mousemove", handleMouseMove)
    return () => container?.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const headline = "TECNOLOGÍA SIMPLE Y A TU MEDIDA"
  const words = headline.split(" ")

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Interactive mesh gradient background */}
      <div 
        className="absolute inset-0 transition-all duration-500 ease-out"
        style={{
          background: `
            radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(140, 198, 63, 0.3) 0%, transparent 40%),
            radial-gradient(at 20% 80%, rgba(0, 74, 153, 0.4) 0px, transparent 50%),
            radial-gradient(at 80% 20%, rgba(140, 198, 63, 0.25) 0px, transparent 50%),
            radial-gradient(at 40% 40%, rgba(0, 180, 216, 0.2) 0px, transparent 50%),
            #020617
          `
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-accent/30"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            }}
            animate={{
              y: [null, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8 flex justify-center"
        >
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white p-2 shadow-lg shadow-accent/20 animate-float flex items-center justify-center">
            <Image
              src="/images/logo.png"
              alt="M&M Tech House"
              width={160}
              height={160}
              className="w-full h-full object-contain"
              priority
            />
          </div>
        </motion.div>

        {/* Animated headline */}
        <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
          {words.map((word, wordIndex) => (
            <span key={wordIndex} className="inline-block mr-2 md:mr-4">
              {word.split("").map((letter, letterIndex) => (
                <motion.span
                  key={`${wordIndex}-${letterIndex}`}
                  initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    duration: 0.5,
                    delay: 0.5 + wordIndex * 0.1 + letterIndex * 0.03,
                    ease: "easeOut",
                  }}
                  className={`inline-block ${
                    word === "SIMPLE" || word === "MEDIDA"
                      ? "text-accent"
                      : "text-foreground"
                  }`}
                >
                  {letter}
                </motion.span>
              ))}
            </span>
          ))}
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.5 }}
          className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto"
        >
          Arquitectura de software que transforma problemas complejos en soluciones elegantes.{" "}
          <span className="text-accent font-semibold">Estás en casa.</span>
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.8 }}
        >
          <a
            href="#proceso"
            className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-lg rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,74,153,0.5)]"
          >
            <span className="relative z-10">Conoce nuestro proceso</span>
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-accent to-accent/80"
              initial={{ x: "-100%" }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-muted-foreground"
        >
          <ChevronDown className="w-8 h-8" />
        </motion.div>
      </motion.div>
    </section>
  )
}
