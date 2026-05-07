"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

const loadingMessages = [
  { percent: 10, message: "Escaneando terreno..." },
  { percent: 25, message: "Preparando los cimientos..." },
  { percent: 45, message: "Levantando muros de código..." },
  { percent: 65, message: "Instalando circuitos..." },
  { percent: 85, message: "Asegurando el techo tecnológico..." },
  { percent: 100, message: "¡Bienvenido a casa!" },
]

interface LoadingScreenProps {
  onComplete: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [currentMessage, setCurrentMessage] = useState(loadingMessages[0].message)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = Math.min(prev + 2, 100)
        
        const messageData = [...loadingMessages].reverse().find(m => newProgress >= m.percent)
        if (messageData) {
          setCurrentMessage(messageData.message)
        }

        if (newProgress >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 800)
        }

        return newProgress
      })
    }, 50)

    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
      exit={{
        clipPath: "circle(0% at 50% 50%)",
        transition: { duration: 0.8, ease: "easeInOut" }
      }}
    >
      {/* Animated Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-8"
      >
        <motion.div
          animate={{ 
            boxShadow: [
              "0 0 20px rgba(140, 198, 63, 0.3)",
              "0 0 40px rgba(140, 198, 63, 0.6)",
              "0 0 20px rgba(140, 198, 63, 0.3)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white p-2 flex items-center justify-center"
        >
          <Image
            src="/images/logo.png"
            alt="M&M Tech House"
            width={160}
            height={160}
            className="w-full h-full object-contain"
            priority
          />
        </motion.div>
        
        {/* Circuit paths animation */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 200 200"
        >
          <motion.circle
            cx="30"
            cy="50"
            r="3"
            fill="#8CC63F"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
          />
          <motion.circle
            cx="170"
            cy="50"
            r="3"
            fill="#004A99"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          />
          <motion.circle
            cx="100"
            cy="30"
            r="3"
            fill="#00b4d8"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
          />
        </svg>
      </motion.div>

      {/* Progress bar */}
      <div className="w-64 md:w-80 mb-4">
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      {/* Progress text */}
      <div className="text-center">
        <motion.p
          key={currentMessage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-muted-foreground text-sm md:text-base font-mono"
        >
          {currentMessage}
        </motion.p>
        <p className="text-accent font-bold text-lg mt-2">{progress}%</p>
      </div>
    </motion.div>
  )
}
