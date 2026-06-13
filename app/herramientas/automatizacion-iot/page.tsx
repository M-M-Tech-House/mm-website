"use client"

import React, { useState, useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContactModal } from "@/components/contact-modal"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Activity,
  Play, 
  Trash2, 
  Plus, 
  Sliders, 
  Settings, 
  Upload, 
  CheckCircle2, 
  Lock, 
  Wifi, 
  Sun, 
  Moon, 
  Clock, 
  MessageSquare, 
  HelpCircle, 
  RefreshCw, 
  User, 
  Mail, 
  Building, 
  LogIn, 
  LogOut, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Sparkles,
  Info,
  Database,
  Thermometer,
  Zap,
  Filter,
  Lightbulb,
  Bell
} from "lucide-react"
import { auth, db, googleProvider } from "@/lib/firebase"
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from "firebase/auth"
import { collection, doc, setDoc, addDoc } from "firebase/firestore"

// Define custom node types
interface NodeTemplate {
  type: "trigger" | "filter" | "action"
  name: string
  icon: React.ReactNode
  color: string
  glowColor: string
  description: string
  defaultValues: Record<string, any>
}

// Sidebar Templates
const TEMPLATES: Record<string, NodeTemplate> = {
  // Triggers
  motion_sensor: {
    type: "trigger",
    name: "Sensor de Movimiento",
    icon: <Zap className="w-5 h-5" />,
    color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    glowColor: "shadow-emerald-500/20",
    description: "Se activa cuando detecta presencia física.",
    defaultValues: { protocol: "zigbee", sensitivity: "alta", topic: "zigbee2mqtt/motion", jsonKey: "occupancy", triggerValue: "true" }
  },
  temp_sensor: {
    type: "trigger",
    name: "Sensor de Temperatura",
    icon: <Thermometer className="w-5 h-5" />,
    color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    glowColor: "shadow-emerald-500/20",
    description: "Monitorea cambios de temperatura ambiente.",
    defaultValues: { protocol: "matter", threshold: 25, condition: "greater", topic: "matter/temp", jsonKey: "temperature", triggerValue: "26" }
  },
  smart_button: {
    type: "trigger",
    name: "Botón Inalámbrico",
    icon: <Plus className="w-5 h-5 rotate-45" />,
    color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    glowColor: "shadow-emerald-500/20",
    description: "Se activa al pulsar físicamente el botón.",
    defaultValues: { protocol: "zigbee", clickType: "simple", topic: "zigbee2mqtt/button", jsonKey: "action", triggerValue: "single" }
  },

  // Filters
  is_night: {
    type: "filter",
    name: "Filtro: Es de Noche",
    icon: <Moon className="w-5 h-5" />,
    color: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    glowColor: "shadow-amber-500/20",
    description: "Solo permite pasar la señal si es horario nocturno.",
    defaultValues: { startHour: "18:00", endHour: "06:00" }
  },
  temp_threshold: {
    type: "filter",
    name: "Filtro: Temp > 25°C",
    icon: <Filter className="w-5 h-5" />,
    color: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    glowColor: "shadow-amber-500/20",
    description: "Solo si la temperatura supera el límite definido.",
    defaultValues: { minTemp: 25 }
  },
  time_range: {
    type: "filter",
    name: "Filtro: Rango Horario",
    icon: <Clock className="w-5 h-5" />,
    color: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    glowColor: "shadow-amber-500/20",
    description: "Restringe el flujo lógico a horas hábiles.",
    defaultValues: { days: "Lunes a Viernes", hours: "08:00 - 18:00" }
  },

  // Actions
  smart_bulb: {
    type: "action",
    name: "Encender Bombillo",
    icon: <Lightbulb className="w-5 h-5" />,
    color: "bg-pink-500/10 border-pink-500/30 text-pink-400",
    glowColor: "shadow-pink-500/20",
    description: "Enciende o cambia de color una bombilla smart.",
    defaultValues: { protocol: "matter", action: "on", brightness: 100, color: "#ffffff", topic: "matter/bulb", payloadOn: '{"state": "ON", "brightness": 100}', payloadOff: '{"state": "OFF"}' }
  },
  smart_lock: {
    type: "action",
    name: "Bloquear Cerradura",
    icon: <Lock className="w-5 h-5" />,
    color: "bg-pink-500/10 border-pink-500/30 text-pink-400",
    glowColor: "shadow-pink-500/20",
    description: "Asegura o libera un cerrojo inteligente.",
    defaultValues: { protocol: "matter", action: "lock", topic: "matter/lock", payloadOn: '{"state": "LOCK"}', payloadOff: '{"state": "UNLOCK"}' }
  },
  whatsapp_alert: {
    type: "action",
    name: "Enviar Alerta WhatsApp",
    icon: <MessageSquare className="w-5 h-5" />,
    color: "bg-pink-500/10 border-pink-500/30 text-pink-400",
    glowColor: "shadow-pink-500/20",
    description: "Despacha un mensaje de alerta a un celular.",
    defaultValues: { protocol: "zigbee", phone: "", message: "¡Alerta IoT: Actividad detectada!", topic: "zigbee2mqtt/whatsapp_bridge", payloadOn: '{"message": "¡Alerta IoT: Actividad detectada!"}', payloadOff: '{}' }
  }
}

interface NodeInstance {
  id: string
  templateKey: keyof typeof TEMPLATES
  type: "trigger" | "filter" | "action"
  name: string
  x: number
  y: number
  protocol?: "matter" | "zigbee"
  values: Record<string, any>
  simulatedActive?: boolean
}

interface Connection {
  id: string
  fromId: string
  toId: string
}

export default function AutomatizacionIotPage() {
  // Core Auth and Lead State
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  // Lead capture form
  const [leadForm, setLeadForm] = useState({ nombre: "", email: "", empresa: "" })
  const [isLeadSending, setIsLeadSending] = useState(false)
  const [leadError, setLeadError] = useState<string | null>(null)

  // Local Storage Session State (for manual registration without google)
  const [isLocallyRegistered, setIsLocallyRegistered] = useState(false)

  // Node Canvas State
  const [nodes, setNodes] = useState<NodeInstance[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // Pan and Zoom
  const [scale, setScale] = useState(1.0)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Connection Drag-Drawing State
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationStep, setSimulationStep] = useState(0) // 0: Idle, 1: Signal traveling, 2: Action triggered

  // Real Connection State
  const [connectionMode, setConnectionMode] = useState<"virtual" | "real">("virtual")
  const [wsService, setWsService] = useState<"zigbee2mqtt" | "matter">("zigbee2mqtt")
  const [wsUrl, setWsUrl] = useState<string>("ws://localhost:8080")
  const [wsStatus, setWsStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected")
  const [wsErrorMsg, setWsErrorMsg] = useState<string>("")

  // Node Dragging State (Lienzo)
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const canvasRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<WebSocket | null>(null)

  // Calculate Limits
  const isRegisteredUser = !!user || isLocallyRegistered
  const maxNodes = isRegisteredUser ? 15 : 4
  const maxDevices = isRegisteredUser ? 8 : 2

  // Count active device nodes
  const getDeviceCount = (currentNodes: NodeInstance[]) => {
    return currentNodes.filter(n => n.type === "trigger" || n.type === "action").length
  }

  // Load Auth State
  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setIsAuthLoading(false)
    })

    // Load local registration status
    const locallyReg = localStorage.getItem("mm_iot_registered")
    if (locallyReg === "true") {
      setIsLocallyRegistered(true)
    }

    // Load initial nodes
    const savedNodes = localStorage.getItem("mm_iot_nodes")
    const savedConnections = localStorage.getItem("mm_iot_connections")
    if (savedNodes && savedConnections) {
      try {
        setNodes(JSON.parse(savedNodes))
        setConnections(JSON.parse(savedConnections))
      } catch (e) {
        console.error("Error loading nodes from storage", e)
      }
    } else {
      // Load default demo automation
      const defaultNodes: NodeInstance[] = [
        {
          id: "node_1",
          templateKey: "motion_sensor",
          type: "trigger",
          name: "Sensor de Movimiento",
          x: 80,
          y: 120,
          protocol: "zigbee",
          values: { protocol: "zigbee", sensitivity: "alta", topic: "zigbee2mqtt/motion", jsonKey: "occupancy", triggerValue: "true" }
        },
        {
          id: "node_2",
          templateKey: "is_night",
          type: "filter",
          name: "Filtro: Es de Noche",
          x: 280,
          y: 200,
          values: { startHour: "18:00", endHour: "06:00" }
        },
        {
          id: "node_3",
          templateKey: "smart_bulb",
          type: "action",
          name: "Encender Bombillo",
          x: 480,
          y: 120,
          protocol: "matter",
          values: { protocol: "matter", action: "on", brightness: 100, color: "#ffffff", topic: "matter/bulb", payloadOn: '{"state": "ON", "brightness": 100}', payloadOff: '{"state": "OFF"}' }
        }
      ]
      const defaultConnections: Connection[] = [
        { id: "conn_1", fromId: "node_1", toId: "node_2" },
        { id: "conn_2", fromId: "node_2", toId: "node_3" }
      ]
      setNodes(defaultNodes)
      setConnections(defaultConnections)
    }

    return () => unsubscribe()
  }, [])

  // Auto-persist canvas state locally
  useEffect(() => {
    if (nodes.length > 0) {
      localStorage.setItem("mm_iot_nodes", JSON.stringify(nodes))
      localStorage.setItem("mm_iot_connections", JSON.stringify(connections))
    } else {
      localStorage.removeItem("mm_iot_nodes")
      localStorage.removeItem("mm_iot_connections")
    }
  }, [nodes, connections])

  // Google Login
  const handleGoogleLogin = async () => {
    if (!auth) return
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      console.error("Google Sign-In Error", e)
    }
  }

  // Logout
  const handleLogout = async () => {
    if (!auth) return
    try {
      await signOut(auth)
      setIsLocallyRegistered(false)
      localStorage.removeItem("mm_iot_registered")
      // Trim current workspace if it exceeds limits
      setNodes(prev => {
        const sliced = prev.slice(0, 4)
        const devicesOnly = sliced.filter(n => n.type === "trigger" || n.type === "action")
        if (devicesOnly.length > 2) {
          // Remove excess devices
          const keepers: NodeInstance[] = []
          let devCount = 0
          sliced.forEach(n => {
            if (n.type === "trigger" || n.type === "action") {
              if (devCount < 2) {
                keepers.push(n)
                devCount++
              }
            } else {
              keepers.push(n)
            }
          })
          return keepers
        }
        return sliced
      })
      setConnections(prev => {
        return prev.filter(c => 
          nodes.some(n => n.id === c.fromId) && nodes.some(n => n.id === c.toId)
        )
      })
    } catch (e) {
      console.error("Logout Error", e)
    }
  }

  // Lead capture submit
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadForm.nombre || !leadForm.email || !leadForm.empresa) {
      setLeadError("Por favor completa todos los campos.")
      return
    }

    setIsLeadSending(true)
    setLeadError(null)

    try {
      if (db) {
        await addDoc(collection(db, "leads_iot"), {
          nombre: leadForm.nombre,
          email: leadForm.email,
          empresa: leadForm.empresa,
          timestamp: new Date()
        })
      }
      // Upgrade session locally
      setIsLocallyRegistered(true)
      localStorage.setItem("mm_iot_registered", "true")
      setIsLeadModalOpen(false)
      alert("¡Registro exitoso! Tus límites de construcción han sido ampliados.")
    } catch (err) {
      console.error("Error storing lead in Firestore:", err)
      // Fallback: succeed locally even if Firebase hits an issue
      setIsLocallyRegistered(true)
      localStorage.setItem("mm_iot_registered", "true")
      setIsLeadModalOpen(false)
    } finally {
      setIsLeadSending(false)
    }
  }

  // Handle Drag Over (HTML5 Drag & Drop)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Handle Drop on Canvas
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const templateKey = e.dataTransfer.getData("text/plain") as keyof typeof TEMPLATES
    if (!TEMPLATES[templateKey]) return

    const template = TEMPLATES[templateKey]

    // 1. Check Node Limits
    if (nodes.length >= maxNodes) {
      setIsLeadModalOpen(true)
      return
    }

    // 2. Check Device Limits (if the dropped node represents a physical device)
    const isDevice = template.type === "trigger" || template.type === "action"
    if (isDevice && getDeviceCount(nodes) >= maxDevices) {
      setIsLeadModalOpen(true)
      return
    }

    // Calculate position relative to canvas coordinate space
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const clientX = e.clientX - rect.left
    const clientY = e.clientY - rect.top

    // Reverse the pan and zoom formulas: screen = (canvas * scale) + pan
    const x = Math.round((clientX - panX) / scale - 80) // offset half typical width
    const y = Math.round((clientY - panY) / scale - 30) // offset half typical height

    const newNode: NodeInstance = {
      id: `node_${Date.now()}`,
      templateKey,
      type: template.type,
      name: template.name,
      x,
      y,
      protocol: isDevice ? (template.defaultValues.protocol || "zigbee") : undefined,
      values: { ...template.defaultValues }
    }

    setNodes(prev => [...prev, newNode])
    setSelectedNodeId(newNode.id)
  }

  // Add node via click in mobile
  const addNodeViaClick = (key: keyof typeof TEMPLATES) => {
    const template = TEMPLATES[key]

    if (nodes.length >= maxNodes) {
      setIsLeadModalOpen(true)
      return
    }

    const isDevice = template.type === "trigger" || template.type === "action"
    if (isDevice && getDeviceCount(nodes) >= maxDevices) {
      setIsLeadModalOpen(true)
      return
    }

    // Place node at the center of current viewport
    const x = Math.round((400 - panX) / scale)
    const y = Math.round((200 - panY) / scale)

    const newNode: NodeInstance = {
      id: `node_${Date.now()}`,
      templateKey: key,
      type: template.type,
      name: template.name,
      x,
      y,
      protocol: isDevice ? (template.defaultValues.protocol || "zigbee") : undefined,
      values: { ...template.defaultValues }
    }

    setNodes(prev => [...prev, newNode])
    setSelectedNodeId(newNode.id)
  }

  // Node Dragging Start (Internal movement on Canvas)
  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    if (isSimulating) return
    setSelectedNodeId(nodeId)
    setDraggingNodeId(nodeId)

    const targetNode = nodes.find(n => n.id === nodeId)
    if (!targetNode || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    // Calculate click coordinates in canvas scale
    const mouseX = (e.clientX - rect.left - panX) / scale
    const mouseY = (e.clientY - rect.top - panY) / scale

    setDragOffset({
      x: mouseX - targetNode.x,
      y: mouseY - targetNode.y
    })
  }

  // Canvas Mouse Move (Handles node dragging, connecting, and panning)
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()

    // 1. Handle Connecting Line Preview
    if (connectingFromId) {
      const mouseCanvasX = (e.clientX - rect.left - panX) / scale
      const mouseCanvasY = (e.clientY - rect.top - panY) / scale
      setMousePos({ x: mouseCanvasX, y: mouseCanvasY })
    }

    // 2. Handle Node Dragging
    if (draggingNodeId && dragOffset) {
      const mouseCanvasX = (e.clientX - rect.left - panX) / scale
      const mouseCanvasY = (e.clientY - rect.top - panY) / scale

      setNodes(prev => prev.map(n => 
        n.id === draggingNodeId
          ? { ...n, x: Math.round(mouseCanvasX - dragOffset.x), y: Math.round(mouseCanvasY - dragOffset.y) }
          : n
      ))
    }

    // 3. Handle Canvas Panning
    if (isPanning) {
      const deltaX = e.clientX - panStart.x
      const deltaY = e.clientY - panStart.y
      setPanX(prev => prev + deltaX)
      setPanY(prev => prev + deltaY)
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }

  // Canvas Mouse Up
  const handleCanvasMouseUp = () => {
    setDraggingNodeId(null)
    setIsPanning(false)
  }

  // Canvas Mouse Down (Initiate panning if background clicked)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      // Clicked on background, deselect node
      setSelectedNodeId(null)
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }

  // Zoom helpers
  const handleZoom = (zoomIn: boolean) => {
    setScale(prev => {
      const delta = zoomIn ? 0.1 : -0.1
      const next = prev + delta
      return Math.min(Math.max(next, 0.5), 1.5)
    })
  }

  const handleResetZoomAndPan = () => {
    setScale(1.0)
    setPanX(0)
    setPanY(0)
  }

  // Node Port Clicking (Connection Logic)
  const handlePortClick = (e: React.MouseEvent, nodeId: string, portType: "in" | "out") => {
    e.stopPropagation()
    if (isSimulating) return

    if (portType === "out") {
      setConnectingFromId(nodeId)
      // Set initial mouse position at output port location
      const sourceNode = nodes.find(n => n.id === nodeId)
      if (sourceNode) {
        setMousePos({ x: sourceNode.x + 200, y: sourceNode.y + 40 })
      }
    } else {
      // Clicked "in" port. Complete connection if we came from another node.
      if (connectingFromId && connectingFromId !== nodeId) {
        // Prevent duplicate connections
        const exists = connections.some(c => c.fromId === connectingFromId && c.toId === nodeId)
        if (!exists) {
          // Rule: triggers go to filters or actions; filters go to filters or actions. Actions cannot output.
          const fromNode = nodes.find(n => n.id === connectingFromId)
          if (fromNode && fromNode.type !== "action") {
            const newConn: Connection = {
              id: `conn_${Date.now()}`,
              fromId: connectingFromId,
              toId: nodeId
            }
            setConnections(prev => [...prev, newConn])
          }
        }
      }
      setConnectingFromId(null)
    }
  }

  // Delete Node & its connections
  const handleDeleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId))
    setConnections(prev => prev.filter(c => c.fromId !== nodeId && c.toId !== nodeId))
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null)
    }
  }

  // Change device protocol
  const handleProtocolChange = (nodeId: string, protocol: "matter" | "zigbee") => {
    setNodes(prev => prev.map(n => 
      n.id === nodeId
        ? { ...n, protocol, values: { ...n.values, protocol } }
        : n
    ))
  }

  // Update node specific custom values
  const handleValueChange = (nodeId: string, key: string, val: any) => {
    setNodes(prev => prev.map(n => 
      n.id === nodeId
        ? { ...n, values: { ...n.values, [key]: val } }
        : n
    ))
  }

  // Clear Canvas
  const handleClearCanvas = () => {
    if (confirm("¿Seguro que quieres borrar todo tu flujo de automatización?")) {
      setNodes([])
      setConnections([])
      setSelectedNodeId(null)
    }
  }

  // Sync refs for WebSocket closures
  const nodesRef = useRef<NodeInstance[]>([])
  const connectionsRef = useRef<Connection[]>([])

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  useEffect(() => {
    connectionsRef.current = connections
  }, [connections])

  // Real Action command sender
  const sendRealActionCommand = (actionNode: NodeInstance, isActive: boolean = true) => {
    if (connectionMode !== "real" || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    const topic = actionNode.values.topic || ""
    const rawPayload = isActive ? (actionNode.values.payloadOn || "{}") : (actionNode.values.payloadOff || "{}")
    
    if (!topic) return

    try {
      let parsedPayload: any = {}
      try {
        parsedPayload = JSON.parse(rawPayload)
      } catch (e) {
        parsedPayload = rawPayload
      }

      const message = {
        topic: topic,
        payload: parsedPayload,
        timestamp: new Date().toISOString()
      }

      socketRef.current.send(JSON.stringify(message))
      console.log("Sent real command via WebSocket:", message)
    } catch (e) {
      console.error("Error sending WebSocket message", e)
    }
  }

  // Trigger flow automatically when WebSocket event matches trigger values
  const triggerFlowFromNode = (triggerId: string) => {
    setIsSimulating(true)
    setSimulationStep(1) // Step 1: Signal pulse traveling

    // Reset visual state except for the trigger
    setNodes(prev => prev.map(n => 
      n.id === triggerId ? { ...n, simulatedActive: true } : { ...n, simulatedActive: false }
    ))

    // Activate Filters
    setTimeout(() => {
      setNodes(prev => {
        const connectedToTrigger = connectionsRef.current
          .filter(c => c.fromId === triggerId)
          .map(c => c.toId)

        return prev.map(n => 
          connectedToTrigger.includes(n.id) && n.type === "filter"
            ? { ...n, simulatedActive: true } 
            : n
        )
      })
      setSimulationStep(2)
    }, 1200)

    // Activate Actions & dispatch command
    setTimeout(() => {
      setNodes(prev => {
        const activeFilterIds = prev.filter(n => n.type === "filter" && n.simulatedActive).map(n => n.id)
        
        const activatedActionIds = connectionsRef.current
          .filter(c => (activeFilterIds.includes(c.fromId) || c.fromId === triggerId))
          .map(c => c.toId)

        return prev.map(n => {
          if (activatedActionIds.includes(n.id) && n.type === "action") {
            sendRealActionCommand(n, true)
            return { ...n, simulatedActive: true }
          }
          return n
        })
      })
      setSimulationStep(3)
    }, 2400)

    // End visual simulation
    setTimeout(() => {
      setIsSimulating(false)
      setSimulationStep(0)
      setNodes(prev => prev.map(n => ({ ...n, simulatedActive: false })))
    }, 5500)
  }

  // WebSocket Manager useEffect
  useEffect(() => {
    if (connectionMode !== "real" || !wsUrl) {
      if (socketRef.current) {
        socketRef.current.close()
        socketRef.current = null
      }
      setWsStatus("disconnected")
      return
    }

    setWsStatus("connecting")
    setWsErrorMsg("")

    let socket: WebSocket
    try {
      socket = new WebSocket(wsUrl)
      socketRef.current = socket
    } catch (e: any) {
      setWsStatus("error")
      setWsErrorMsg("La dirección WebSocket no tiene un formato válido.")
      return
    }

    socket.onopen = () => {
      setWsStatus("connected")
    }

    socket.onclose = () => {
      setWsStatus("disconnected")
    }

    socket.onerror = () => {
      setWsStatus("error")
      setWsErrorMsg("Error de conexión. Asegúrate de que tu servidor WebSocket local esté en línea.")
    }

    socket.onmessage = (event) => {
      try {
        console.log("WebSocket raw data received:", event.data)
        const data = JSON.parse(event.data)
        
        // Structure expected: {"topic": "...", "payload": {...}}
        const topic = data.topic || data.device || data.id
        const payload = data.payload !== undefined ? data.payload : data

        console.log("Parsed Topic:", topic, "Payload:", payload)

        if (!topic) return

        // Evaluate triggers using nodesRef
        let shouldTrigger = false
        let matchedTriggerId = ""

        console.log("Comparing against nodes:", nodesRef.current)

        nodesRef.current.forEach(n => {
          if (n.type === "trigger") {
            const nodeTopic = n.values.topic || ""
            const jsonKey = n.values.jsonKey || ""
            const expectedVal = n.values.triggerValue

            console.log(`Trigger Node [${n.name}]: topic=${nodeTopic}, jsonKey=${jsonKey}, expectedVal=${expectedVal}`)

            if (nodeTopic && topic.toLowerCase().trim() === nodeTopic.toLowerCase().trim()) {
              const actualVal = jsonKey ? payload[jsonKey] : payload
              console.log(`Topic match! actualVal=${actualVal}, expectedVal=${expectedVal}`)
              if (actualVal !== undefined && String(actualVal).toLowerCase().trim() === String(expectedVal).toLowerCase().trim()) {
                shouldTrigger = true
                matchedTriggerId = n.id
                console.log(`✓ Condition met for Node ID: ${n.id}`)
              }
            }
          }
        })

        if (shouldTrigger && matchedTriggerId) {
          console.log(`🚀 Dispatching triggerFlowFromNode for ID: ${matchedTriggerId}`)
          triggerFlowFromNode(matchedTriggerId)
        } else {
          console.log("No matching trigger condition succeeded.")
        }

      } catch (e) {
        console.error("WebSocket message parsing error", e)
      }
    }

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [connectionMode, wsUrl, wsService])

  // Simulate flow
  const handleRunSimulation = () => {
    if (nodes.length === 0) {
      alert("Crea al menos un flujo arrastrando nodos para simular.")
      return
    }

    if (connections.length === 0) {
      alert("Conecta los puertos de los nodos para probar la automatización lógica.")
      return
    }

    // Verify there is at least one trigger node connected
    const triggersConnected = connections.some(c => {
      const fromNode = nodes.find(n => n.id === c.fromId)
      return fromNode?.type === "trigger"
    })

    if (!triggersConnected) {
      alert("Tu flujo debe iniciar con un Nodo de Entrada (Trigger) para iniciar la señal.")
      return
    }

    setIsSimulating(true)
    setSimulationStep(1) // Step 1: Signal pulse traveling

    // Animate visual nodes activation based on connection chains
    // Simple simulation timeline:
    // 0ms: Signal pulses from triggers
    // 1000ms: Signal passes through filters / conditions
    // 2000ms: Signal activates actions (LED bulb shines, whatsapp alert, door locks)
    // 3500ms: Simulation end

    // Turn off all nodes simulated state
    setNodes(prev => prev.map(n => ({ ...n, simulatedActive: false })))

    // Activate Triggers
    setTimeout(() => {
      setNodes(prev => prev.map(n => 
        n.type === "trigger" ? { ...n, simulatedActive: true } : n
      ))
    }, 200)

    // Activate Filters
    setTimeout(() => {
      setNodes(prev => {
        // Find nodes connected to triggers
        const triggerConnectedIds = connections
          .filter(c => prev.find(n => n.id === c.fromId)?.type === "trigger")
          .map(c => c.toId)

        return prev.map(n => 
          triggerConnectedIds.includes(n.id) && n.type === "filter"
            ? { ...n, simulatedActive: true } 
            : n
        )
      })
      setSimulationStep(2)
    }, 1200)

    // Activate Actions
    setTimeout(() => {
      setNodes(prev => {
        // Find nodes connected to filters or directly to triggers
        const activeFilterIds = prev.filter(n => n.type === "filter" && n.simulatedActive).map(n => n.id)
        const triggerIds = prev.filter(n => n.type === "trigger").map(n => n.id)
        
        const activatedIds = connections
          .filter(c => activeFilterIds.includes(c.fromId) || triggerIds.includes(c.fromId))
          .map(c => c.toId)

        return prev.map(n => 
          activatedIds.includes(n.id) && n.type === "action"
            ? { ...n, simulatedActive: true } 
            : n
        )
      })
      setSimulationStep(3)
    }, 2400)

    // End simulation
    setTimeout(() => {
      setIsSimulating(false)
      setSimulationStep(0)
      setNodes(prev => prev.map(n => ({ ...n, simulatedActive: false })))
    }, 5500)
  }

  // Draw Bezier Connection Line
  const drawConnectionPath = (fromNode: NodeInstance, toNode: NodeInstance) => {
    // Port Out coordinate (right side of node card: x + 200, y + 40)
    const x1 = fromNode.x + 200
    const y1 = fromNode.y + 40

    // Port In coordinate (left side of node card: x, y + 40)
    const x2 = toNode.x
    const y2 = toNode.y + 40

    // Control points for smooth bezier curve
    const controlOffset = Math.max(Math.abs(x2 - x1) * 0.5, 40)
    const cp1x = x1 + controlOffset
    const cp1y = y1
    const cp2x = x2 - controlOffset
    const cp2y = y2

    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`
  }

  // Draw Draft Bezier Connection Line (Connecting preview)
  const drawDraftPath = (fromNode: NodeInstance, mx: number, my: number) => {
    const x1 = fromNode.x + 200
    const y1 = fromNode.y + 40

    const controlOffset = Math.max(Math.abs(mx - x1) * 0.5, 40)
    const cp1x = x1 + controlOffset
    const cp1y = y1
    const cp2x = mx - controlOffset
    const cp2y = my

    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${mx} ${my}`
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-[#457bb3] selection:text-white pb-12 overflow-x-hidden">
      
      {/* Dynamic SVG Connection Line dashoffset Animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes iot-dash {
          to {
            stroke-dashoffset: -80;
          }
        }
        .animate-iot-dash {
          animation: iot-dash 1.5s linear infinite;
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -80;
          }
        }
      `}} />
      
      {/* Structured SEO data JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Constructor Visual de Automatizaciones IoT por Nodos",
            "url": "https://mmtechhouse.com/herramientas/automatizacion-iot",
            "applicationCategory": "DeveloperApplication",
            "operatingSystem": "All",
            "browserRequirements": "Requires JavaScript. Requires HTML5 Canvas.",
            "offers": {
              "@type": "Offer",
              "price": "0.00",
              "priceCurrency": "COP"
            },
            "description": "Simulador interactivo y constructor de flujos inteligentes de IoT y domótica por nodos. Prueba protocolos Zigbee y Matter en tiempo real."
          })
        }}
      />

      <Header />

      {/* Hero section */}
      <section className="relative overflow-hidden pt-32 pb-10 px-6 text-center bg-[#f9fafc] border-b border-slate-200/40">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-tr from-[#264164]/5 to-[#457bb3]/10 rounded-full blur-3xl pointer-events-none z-0" />
        
        <div className="relative z-10 space-y-4">
          <span className="px-3.5 py-1 bg-[#264164]/5 border border-[#264164]/10 rounded-full text-xs font-bold text-[#264164] inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Lead Magnet Técnico — Simulador IoT
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Constructor Visual de <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">Automatizaciones IoT</span>
          </h1>
          <p className="mt-4 text-slate-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Arrastra, conecta y modela flujos inteligentes de domótica y hardware. Simula la latencia e infraestructura usando protocolos de comunicación reales como <strong className="text-sky-600">Matter</strong> y <strong className="text-emerald-600">Zigbee</strong>.
          </p>
        </div>
      </section>

      {/* Auth & Limitations Banner Info */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 mt-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isRegisteredUser ? "bg-emerald-500/10 text-emerald-400" : "bg-sky-500/10 text-sky-400"}`}>
              <Database className="w-4 h-4" />
            </div>
            <div className="text-left leading-tight">
              <p className="text-xs font-bold text-slate-200">
                Límites de simulación: <span className="text-white font-extrabold">{nodes.length}/{maxNodes} nodos</span> | <span className="text-white font-extrabold">{getDeviceCount(nodes)}/{maxDevices} dispositivos</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {isRegisteredUser ? (
                  <span>
                    ✓ Plan Registrado Activo. Tienes acceso ampliado para modelar esquemas completos.{" "}
                    <button
                      type="button"
                      onClick={() => setIsContactModalOpen(true)}
                      className="text-sky-400 hover:text-sky-350 hover:underline font-extrabold cursor-pointer ml-1 inline-flex items-center gap-0.5"
                    >
                      ¿Necesitas más? Contáctanos (SOS)
                    </button>
                  </span>
                ) : (
                  "Modo Invitado. Límite de 4 nodos. Regístrate gratis para aumentar tu capacidad a 15 nodos."
                )}
              </p>
            </div>
          </div>

          {/* Session actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isAuthLoading ? (
              <span className="text-xs text-slate-500 font-bold">Verificando...</span>
            ) : user ? (
              <div className="flex items-center gap-2">
                {user.photoURL && (
                  <img src={user.photoURL} alt="Avatar" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full border border-slate-800 shrink-0" />
                )}
                <span className="text-xs font-bold text-slate-300 truncate max-w-[120px]">{user.displayName || "Usuario"}</span>
                <button 
                  onClick={handleLogout}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer"
                >
                  Salir
                </button>
              </div>
            ) : isLocallyRegistered ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Registrado (Lead)
                </span>
                <button 
                  onClick={() => {
                    setIsLocallyRegistered(false)
                    localStorage.removeItem("mm_iot_registered")
                  }}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[9px] font-bold rounded"
                >
                  Reset
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="px-3.5 py-1.5 bg-[#264164] hover:bg-[#1f3552] text-white border border-[#457bb3]/30 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 text-[#457bb3]" /> Registrarse con Google
              </button>
            )}

            {!isRegisteredUser && (
              <button 
                onClick={() => setIsLeadModalOpen(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Ampliar Capacidad
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Board Editor */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 mt-8 grid lg:grid-cols-12 gap-8 relative z-10">
        
        {/* SIDEBAR: Draggable Nodes Palette (3 cols on large screens) */}
        <section className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 space-y-6">
            <div>
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-sky-400" />
                Librería de Nodos
              </h2>
              <p className="text-[10px] text-slate-500 mt-1">
                Arrastra los bloques al lienzo o haz clic en ellos para agregarlos.
              </p>
            </div>

            {/* Triggers Category */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block border-b border-slate-800 pb-1">
                Entradas (Triggers)
              </span>
              <div className="space-y-2">
                {Object.entries(TEMPLATES)
                  .filter(([_, t]) => t.type === "trigger")
                  .map(([key, item]) => (
                    <div
                      key={key}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", key)}
                      onClick={() => addNodeViaClick(key)}
                      className="bg-slate-950 hover:bg-slate-900/60 border border-slate-800 hover:border-emerald-500/30 rounded-xl p-3 flex items-start gap-2.5 cursor-grab active:cursor-grabbing transition-all select-none group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-all">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{item.name}</h4>
                        <p className="text-[9px] text-slate-500 leading-tight mt-0.5">{item.description}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Filters Category */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block border-b border-slate-800 pb-1">
                Condiciones (Filters)
              </span>
              <div className="space-y-2">
                {Object.entries(TEMPLATES)
                  .filter(([_, t]) => t.type === "filter")
                  .map(([key, item]) => (
                    <div
                      key={key}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", key)}
                      onClick={() => addNodeViaClick(key)}
                      className="bg-slate-950 hover:bg-slate-900/60 border border-slate-800 hover:border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 cursor-grab active:cursor-grabbing transition-all select-none group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-all">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{item.name}</h4>
                        <p className="text-[9px] text-slate-500 leading-tight mt-0.5">{item.description}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Actions Category */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-extrabold text-pink-400 uppercase tracking-widest block border-b border-slate-800 pb-1">
                Salidas (Actions)
              </span>
              <div className="space-y-2">
                {Object.entries(TEMPLATES)
                  .filter(([_, t]) => t.type === "action")
                  .map(([key, item]) => (
                    <div
                      key={key}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", key)}
                      onClick={() => addNodeViaClick(key)}
                      className="bg-slate-950 hover:bg-slate-900/60 border border-slate-800 hover:border-pink-500/30 rounded-xl p-3 flex items-start gap-2.5 cursor-grab active:cursor-grabbing transition-all select-none group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-all">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{item.name}</h4>
                        <p className="text-[9px] text-slate-500 leading-tight mt-0.5">{item.description}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {connectionMode === "real" && (
            <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 space-y-4">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Ajustes de Red Local
                </h3>
                <p className="text-[9px] text-slate-500 mt-0.5">
                  Conecta el lienzo a tu pasarela local.
                </p>
              </div>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label htmlFor="ws-service-select" className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Servidor IoT</label>
                  <select
                    id="ws-service-select"
                    value={wsService}
                    onChange={(e) => setWsService(e.target.value as any)}
                    className="w-full mt-1.5 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-all font-bold"
                  >
                    <option value="zigbee2mqtt">Zigbee2MQTT (Bridge)</option>
                    <option value="matter">Matter.js Controller</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="ws-url-input" className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Dirección WebSocket</label>
                  <input
                    id="ws-url-input"
                    type="text"
                    value={wsUrl}
                    onChange={(e) => setWsUrl(e.target.value)}
                    placeholder={wsService === "zigbee2mqtt" ? "ws://localhost:9001" : "ws://localhost:8080"}
                    className="w-full mt-1.5 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-[10px] focus:outline-none focus:border-sky-500 transition-all"
                  />
                </div>

                {/* Network Status Badge */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Estado de Red</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      wsStatus === "connected" ? "bg-emerald-500 animate-pulse" :
                      wsStatus === "connecting" ? "bg-amber-500 animate-pulse" :
                      wsStatus === "error" ? "bg-red-500" : "bg-slate-650"
                    }`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      wsStatus === "connected" ? "text-emerald-400" :
                      wsStatus === "connecting" ? "text-amber-400" :
                      wsStatus === "error" ? "text-red-400" : "text-slate-400"
                    }`}>
                      {wsStatus === "connected" ? "Conectado" :
                       wsStatus === "connecting" ? "Conectando..." :
                       wsStatus === "error" ? "Error Red" : "Desconectado"}
                    </span>
                  </div>
                </div>

                {wsStatus === "error" && wsErrorMsg && (
                  <div className="p-2 bg-red-950/20 border border-red-900/20 text-red-400 text-[9px] font-bold rounded-lg leading-normal">
                    {wsErrorMsg}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* LIENZO DE NODOS: Interactive Canvas Frame (6 cols on large screens) */}
        <section className="lg:col-span-6 space-y-4">
          
          {/* Top Canvas Controls */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[9px] font-black uppercase tracking-wider shrink-0">
                <button
                  type="button"
                  onClick={() => setConnectionMode("virtual")}
                  className={`px-2 py-1 rounded transition-all cursor-pointer ${connectionMode === "virtual" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Simulación
                </button>
                <button
                  type="button"
                  onClick={() => setConnectionMode("real")}
                  className={`px-2 py-1 rounded transition-all cursor-pointer ${connectionMode === "real" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Conexión Real
                </button>
              </div>
              
              <div className="hidden xl:flex items-center gap-1.5 min-w-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${isSimulating ? "bg-emerald-500 animate-ping" : "bg-slate-600"}`} />
                <span className="text-[10px] font-bold text-slate-300 truncate">
                  {isSimulating 
                    ? simulationStep === 1 
                      ? "Simulando: Enviando pulsos de señal..." 
                      : "Simulando: ¡Actuadores activados!" 
                    : "Lienzo de Programación IoT"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => handleZoom(false)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-all cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[9px] font-bold text-slate-400 px-1.5 w-10 text-center select-none">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => handleZoom(true)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-all cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoomAndPan}
                  className="p-1 hover:bg-slate-800 text-slate-500 hover:text-slate-350 rounded transition-all cursor-pointer"
                  title="Centrar lienzo"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>

              {/* Action Simulation Buttons */}
              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(16,185,129,0.15)] shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Probar Flujo
              </button>

              <button
                type="button"
                onClick={handleClearCanvas}
                disabled={isSimulating}
                className="p-2 border border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400 bg-slate-950 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                title="Limpiar Lienzo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Drag & Drop Area */}
          <div 
            ref={canvasRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseDown={handleCanvasMouseDown}
            className={`w-full h-[540px] bg-slate-950 border border-slate-900 rounded-3xl overflow-hidden relative cursor-grab select-none shadow-[inset_0_4px_30px_rgba(0,0,0,0.4)] ${isPanning ? "cursor-grabbing" : ""} ${connectingFromId ? "cursor-crosshair" : ""}`}
          >
            {/* SVG Background Grid Pattern & Connection Lines */}
            <svg 
              className="absolute inset-0 pointer-events-none w-full h-full"
              style={{ transform: `scale(${scale})`, transformOrigin: "0 0", width: `${100 / scale}%`, height: `${100 / scale}%` }}
            >
              <defs>
                {/* SVG repeating grid pattern */}
                <pattern 
                  id="canvas-grid" 
                  width="30" 
                  height="30" 
                  patternUnits="userSpaceOnUse"
                  x={panX / scale}
                  y={panY / scale}
                >
                  <circle cx="2" cy="2" r="1.2" fill="#334155" fillOpacity="0.4" />
                </pattern>
                
                {/* Protocol linear gradients for connection lines */}
                <linearGradient id="zigbee-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="matter-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="neutral-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="100%" stopColor="#475569" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* The Grid */}
              <rect width="100%" height="100%" fill="url(#canvas-grid)" />

              {/* Group wrapper to translate lines with panning */}
              <g transform={`translate(${panX}, ${panY})`}>
                {/* Render Existing Connection Lines */}
                {connections.map((conn) => {
                  const fromNode = nodes.find(n => n.id === conn.fromId)
                  const toNode = nodes.find(n => n.id === conn.toId)
                  if (!fromNode || !toNode) return null

                  // Determine line color based on protocol
                  let strokeColor = "url(#neutral-gradient)"
                  let strokeClass = "stroke-slate-700"
                  
                  if (fromNode.protocol) {
                    if (fromNode.protocol === "zigbee") {
                      strokeColor = "url(#zigbee-gradient)"
                      strokeClass = "stroke-emerald-500/80"
                    } else if (fromNode.protocol === "matter") {
                      strokeColor = "url(#matter-gradient)"
                      strokeClass = "stroke-sky-500/80"
                    }
                  }

                  const d = drawConnectionPath(fromNode, toNode)

                  return (
                    <g key={conn.id}>
                      {/* Background wider hit-path */}
                      <path d={d} fill="none" stroke="transparent" strokeWidth="10" className="cursor-pointer" />
                      {/* Visual connection path */}
                      <path 
                        d={d} 
                        fill="none" 
                        stroke={strokeColor} 
                        strokeWidth="2.5" 
                        className={`transition-colors duration-300 ${strokeClass}`} 
                      />

                      {/* Simulation signal pulse running along paths */}
                      {isSimulating && simulationStep === 1 && (
                        <path
                          d={d}
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="3.5"
                          strokeDasharray="12 40"
                          className="animate-iot-dash"
                          style={{
                            filter: "drop-shadow(0 0 5px #38bdf8)"
                          }}
                        />
                      )}
                    </g>
                  )
                })}

                {/* Render Connecting Line Draft (User dragging connection) */}
                {connectingFromId && (() => {
                  const fromNode = nodes.find(n => n.id === connectingFromId)
                  if (!fromNode) return null
                  const d = drawDraftPath(fromNode, mousePos.x, mousePos.y)
                  return (
                    <path 
                      d={d} 
                      fill="none" 
                      stroke="#475569" 
                      strokeWidth="2" 
                      strokeDasharray="4 4" 
                    />
                  )
                })()}
              </g>
            </svg>

            {/* Canvas Transformation Container (Holds absolute HTML node blocks) */}
            <div 
              style={{
                transform: `scale(${scale}) translate(${panX}px, ${panY}px)`,
                transformOrigin: "0 0",
                width: "100%",
                height: "100%",
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none" // Enable clicks to bypass to absolute children
              }}
            >
              {nodes.map((node) => {
                const template = TEMPLATES[node.templateKey]
                const isSelected = selectedNodeId === node.id
                const isTrigger = node.type === "trigger"
                const isAction = node.type === "action"
                const hasProtocol = isTrigger || isAction

                // Dynamic protocol colors
                let protocolBadge = ""
                let nodeBorder = "border-slate-800"
                let activePulseClass = ""

                if (hasProtocol && node.protocol) {
                  if (node.protocol === "zigbee") {
                    protocolBadge = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    nodeBorder = isSelected ? "border-emerald-400 ring-2 ring-emerald-500/20" : "border-emerald-500/20 hover:border-emerald-500/40"
                    if (node.simulatedActive) activePulseClass = "shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-102 border-emerald-400"
                  } else if (node.protocol === "matter") {
                    protocolBadge = "bg-sky-500/10 text-sky-400 border-sky-500/30"
                    nodeBorder = isSelected ? "border-sky-400 ring-2 ring-sky-500/20" : "border-sky-500/20 hover:border-sky-500/40"
                    if (node.simulatedActive) activePulseClass = "shadow-[0_0_20px_rgba(14,165,233,0.5)] scale-102 border-sky-400"
                  }
                } else {
                  nodeBorder = isSelected ? "border-slate-350 ring-2 ring-white/10" : "border-slate-800 hover:border-slate-700"
                  if (node.simulatedActive) activePulseClass = "shadow-[0_0_20px_rgba(251,191,36,0.4)] scale-102 border-amber-300"
                }

                return (
                  <div
                    key={node.id}
                    onMouseDown={(e) => handleNodeDragStart(e, node.id)}
                    className={`absolute w-[200px] bg-slate-900 border rounded-2xl p-3 flex flex-col justify-between cursor-grab select-none pointer-events-auto transition-all ${nodeBorder} ${activePulseClass} ${isSelected ? "shadow-lg" : "shadow-md"}`}
                    style={{ left: node.x, top: node.y }}
                  >
                    {/* Header: Node Icon & Name */}
                    <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${template.color} ${template.glowColor} ${node.simulatedActive ? "animate-pulse" : ""}`}>
                        {template.icon}
                      </div>
                      <div className="min-w-0 leading-tight">
                        <span className="text-[10px] font-black text-slate-100 block truncate uppercase tracking-wider">{node.name}</span>
                        {hasProtocol && node.protocol && (
                          <span className={`text-[8px] font-black uppercase tracking-wider border rounded-md px-1 py-0.5 mt-0.5 inline-block ${protocolBadge}`}>
                            {node.protocol}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Node Configuration / Details */}
                    <div className="py-2.5 text-[10px] text-slate-400">
                      {node.templateKey === "temp_sensor" && (
                        <div className="flex items-center justify-between gap-1">
                          <span>Disparar si Temp:</span>
                          <span className="text-emerald-400 font-extrabold">&gt; {node.values.threshold || 25}°C</span>
                        </div>
                      )}
                      {node.templateKey === "motion_sensor" && (
                        <div className="flex items-center justify-between gap-1">
                          <span>Sensibilidad:</span>
                          <span className="text-slate-300 font-bold uppercase text-[9px]">{node.values.sensitivity}</span>
                        </div>
                      )}
                      {node.templateKey === "smart_button" && (
                        <div className="flex items-center justify-between gap-1">
                          <span>Tipo de Click:</span>
                          <span className="text-slate-300 font-bold uppercase text-[9px]">{node.values.clickType}</span>
                        </div>
                      )}
                      {node.templateKey === "is_night" && (
                        <div className="flex items-center justify-between gap-1">
                          <span>Horario Lógico:</span>
                          <span className="text-amber-400 font-bold text-[9px]">{node.values.startHour} - {node.values.endHour}</span>
                        </div>
                      )}
                      {node.templateKey === "temp_threshold" && (
                        <div className="flex items-center justify-between gap-1">
                          <span>Temperatura Mín:</span>
                          <span className="text-amber-400 font-bold">{node.values.minTemp}°C</span>
                        </div>
                      )}
                      {node.templateKey === "time_range" && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-500 font-semibold">{node.values.days}</span>
                          <span className="text-amber-400 font-bold text-[9px]">{node.values.hours}</span>
                        </div>
                      )}
                      {node.templateKey === "smart_bulb" && (
                        <div className="flex items-center justify-between gap-1">
                          <span>Acción Luz:</span>
                          <span className="text-pink-400 font-bold uppercase text-[9px]">{node.values.action} ({node.values.brightness}%)</span>
                        </div>
                      )}
                      {node.templateKey === "smart_lock" && (
                        <div className="flex items-center justify-between gap-1">
                          <span>Acción Cerradura:</span>
                          <span className="text-pink-400 font-bold uppercase text-[9px]">{node.values.action === "lock" ? "Bloquear" : "Liberar"}</span>
                        </div>
                      )}
                      {node.templateKey === "whatsapp_alert" && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-500 truncate leading-none text-[8.5px]">{node.values.message}</span>
                        </div>
                      )}
                    </div>

                    {/* Ports: Connections anchor dots */}
                    {/* Input Port (Left side) - Show on everything except Triggers */}
                    {node.type !== "trigger" && (
                      <button
                        type="button"
                        onClick={(e) => handlePortClick(e, node.id, "in")}
                        className={`absolute w-3.5 h-3.5 rounded-full border border-slate-700 bg-slate-950 flex items-center justify-center -left-1.5 top-1/2 -translate-y-1/2 hover:scale-125 transition-all cursor-crosshair z-25 group-hover:border-sky-500/40`}
                        title="Conectar Entrada"
                        style={{ pointerEvents: "auto" }}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full bg-slate-500 ${connectingFromId && connectingFromId !== node.id ? "bg-sky-400 animate-pulse scale-110" : ""}`} />
                      </button>
                    )}

                    {/* Output Port (Right side) - Show on everything except Actions */}
                    {node.type !== "action" && (
                      <button
                        type="button"
                        onClick={(e) => handlePortClick(e, node.id, "out")}
                        className={`absolute w-3.5 h-3.5 rounded-full border border-slate-700 bg-slate-950 flex items-center justify-center -right-1.5 top-1/2 -translate-y-1/2 hover:scale-125 transition-all cursor-crosshair z-25 ${connectingFromId === node.id ? "border-emerald-500 bg-emerald-950" : ""}`}
                        title="Conectar Salida"
                        style={{ pointerEvents: "auto" }}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full bg-slate-500 ${connectingFromId === node.id ? "bg-emerald-400" : "hover:bg-emerald-400"}`} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* DETAILS/CONFIGURATION DRAWER (3 cols on large screens) */}
        <section className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 space-y-5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-3">
              <Settings className="w-4 h-4 text-sky-400" />
              Configurador
            </h2>

            {selectedNodeId ? (() => {
              const node = nodes.find(n => n.id === selectedNodeId)
              if (!node) return <div className="text-xs text-slate-500">Nodo no encontrado.</div>
              const isDevice = node.type === "trigger" || node.type === "action"

              return (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">ID de Nodo</span>
                    <p className="font-mono text-slate-400 mt-1">{node.id}</p>
                  </div>

                  <div>
                    <label htmlFor="node-name-input" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Nombre Personalizado
                    </label>
                    <input
                      id="node-name-input"
                      type="text"
                      value={node.name}
                      onChange={(e) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, name: e.target.value } : n))}
                      className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 transition-all font-bold"
                    />
                  </div>

                  {/* Device Wireless Protocol Selector */}
                  {isDevice && (
                    <div>
                      <label htmlFor="node-protocol-select" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                        Protocolo Inalámbrico
                      </label>
                      <select
                        id="node-protocol-select"
                        value={node.protocol || "zigbee"}
                        onChange={(e) => handleProtocolChange(node.id, e.target.value as any)}
                        className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 transition-all font-bold uppercase tracking-wider text-[11px]"
                      >
                        <option value="zigbee">Zigbee (Zigbee2MQTT)</option>
                        <option value="matter">Matter (Matter.js Controller)</option>
                      </select>
                      <div className="mt-2 text-[10px] text-slate-500 leading-normal flex items-start gap-1">
                        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>
                          {node.protocol === "zigbee" && "Comunicación local eficiente mediante el bridge Zigbee2MQTT."}
                          {node.protocol === "matter" && "Estándar universal conectado a tu controlador local de Matter.js."}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Value inputs based on Node Type */}
                  {node.templateKey === "temp_sensor" && (
                    <div>
                      <label htmlFor="temp-threshold-input" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                        Umbral de Temperatura (°C)
                      </label>
                      <input
                        id="temp-threshold-input"
                        type="number"
                        value={node.values.threshold || 25}
                        onChange={(e) => handleValueChange(node.id, "threshold", parseInt(e.target.value) || 0)}
                        className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 transition-all font-bold"
                      />
                    </div>
                  )}

                  {node.templateKey === "motion_sensor" && (
                    <div>
                      <label htmlFor="motion-sensitivity-select" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                        Sensibilidad de Presencia
                      </label>
                      <select
                        id="motion-sensitivity-select"
                        value={node.values.sensitivity}
                        onChange={(e) => handleValueChange(node.id, "sensitivity", e.target.value)}
                        className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 transition-all font-bold"
                      >
                        <option value="alta">Alta (Micro-movimientos)</option>
                        <option value="media">Media (Cuerpo completo)</option>
                        <option value="baja">Baja (Mascotas ignoradas)</option>
                      </select>
                    </div>
                  )}

                  {node.templateKey === "is_night" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="night-start-input" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                          Hora Inicio
                        </label>
                        <input
                          id="night-start-input"
                          type="text"
                          value={node.values.startHour}
                          onChange={(e) => handleValueChange(node.id, "startHour", e.target.value)}
                          className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 transition-all font-bold text-center"
                        />
                      </div>
                      <div>
                        <label htmlFor="night-end-input" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                          Hora Fin
                        </label>
                        <input
                          id="night-end-input"
                          type="text"
                          value={node.values.endHour}
                          onChange={(e) => handleValueChange(node.id, "endHour", e.target.value)}
                          className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 transition-all font-bold text-center"
                        />
                      </div>
                    </div>
                  )}

                  {node.templateKey === "temp_threshold" && (
                    <div>
                      <label htmlFor="filter-temp-min-input" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                        Temperatura Límite Mínima
                      </label>
                      <input
                        id="filter-temp-min-input"
                        type="number"
                        value={node.values.minTemp}
                        onChange={(e) => handleValueChange(node.id, "minTemp", parseInt(e.target.value) || 0)}
                        className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 transition-all font-bold"
                      />
                    </div>
                  )}

                  {node.templateKey === "smart_bulb" && (
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="bulb-action-select" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                          Acción de Energía
                        </label>
                        <select
                          id="bulb-action-select"
                          value={node.values.action}
                          onChange={(e) => handleValueChange(node.id, "action", e.target.value)}
                          className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 transition-all font-bold"
                        >
                          <option value="on">Encender</option>
                          <option value="off">Apagar</option>
                          <option value="toggle">Alternar (Toggle)</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="bulb-brightness-input" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                          Brillo ({node.values.brightness}%)
                        </label>
                        <input
                          id="bulb-brightness-input"
                          type="range"
                          min="10"
                          max="100"
                          value={node.values.brightness}
                          onChange={(e) => handleValueChange(node.id, "brightness", parseInt(e.target.value) || 100)}
                          className="w-full mt-2 accent-sky-500"
                        />
                      </div>
                    </div>
                  )}

                  {node.templateKey === "smart_lock" && (
                    <div>
                      <label htmlFor="lock-action-select" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                        Acción de Cerrojo
                      </label>
                      <select
                        id="lock-action-select"
                        value={node.values.action}
                        onChange={(e) => handleValueChange(node.id, "action", e.target.value)}
                        className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 transition-all font-bold"
                      >
                        <option value="lock">Bloquear</option>
                        <option value="unlock">Liberar / Abrir</option>
                      </select>
                    </div>
                  )}

                  {node.templateKey === "whatsapp_alert" && (
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="whatsapp-phone-input" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                          Número Destinatario (Celular)
                        </label>
                        <input
                          id="whatsapp-phone-input"
                          type="tel"
                          value={node.values.phone}
                          onChange={(e) => handleValueChange(node.id, "phone", e.target.value)}
                          placeholder="Ej: +573001234567"
                          className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 transition-all font-bold"
                        />
                      </div>
                      <div>
                        <label htmlFor="whatsapp-message-textarea" className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                          Mensaje a Enviar
                        </label>
                        <textarea
                          id="whatsapp-message-textarea"
                          value={node.values.message}
                          onChange={(e) => handleValueChange(node.id, "message", e.target.value)}
                          rows={3}
                          className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 transition-all font-bold leading-normal resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Real connection settings in the properties panel */}
                  {connectionMode === "real" && (
                    <div className="pt-4 border-t border-slate-800 space-y-3.5">
                      <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5" /> Vinculación de Red Real
                      </h4>

                      {node.type === "trigger" && (
                        <>
                          <div>
                            <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">
                              Topic MQTT / ID Dispositivo
                            </label>
                            <input
                              type="text"
                              value={node.values.topic || ""}
                              onChange={(e) => handleValueChange(node.id, "topic", e.target.value)}
                              placeholder={wsService === "zigbee2mqtt" ? "zigbee2mqtt/my_sensor" : "device_12"}
                              className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 transition-all font-mono text-[10px]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">
                              Clave JSON a Monitorear
                            </label>
                            <input
                              type="text"
                              value={node.values.jsonKey || ""}
                              onChange={(e) => handleValueChange(node.id, "jsonKey", e.target.value)}
                              placeholder={node.templateKey === "temp_sensor" ? "temperature" : "occupancy"}
                              className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 transition-all font-mono text-[10px]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">
                              Valor de Activación
                            </label>
                            <input
                              type="text"
                              value={node.values.triggerValue !== undefined ? node.values.triggerValue : ""}
                              onChange={(e) => handleValueChange(node.id, "triggerValue", e.target.value)}
                              placeholder={node.templateKey === "temp_sensor" ? "25" : "true"}
                              className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 transition-all font-mono text-[10px]"
                            />
                          </div>
                        </>
                      )}

                      {node.type === "action" && (
                        <>
                          <div>
                            <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">
                              Topic MQTT / ID Destino
                            </label>
                            <input
                              type="text"
                              value={node.values.topic || ""}
                              onChange={(e) => handleValueChange(node.id, "topic", e.target.value)}
                              placeholder={wsService === "zigbee2mqtt" ? "zigbee2mqtt/my_bulb/set" : "device_bulb"}
                              className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 transition-all font-mono text-[10px]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">
                              Payload JSON al Activar (On)
                            </label>
                            <textarea
                              value={node.values.payloadOn || ""}
                              onChange={(e) => handleValueChange(node.id, "payloadOn", e.target.value)}
                              placeholder='{"state": "ON", "brightness": 100}'
                              rows={2}
                              className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 transition-all font-mono text-[10px] resize-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">
                              Payload JSON al Desactivar (Off)
                            </label>
                            <textarea
                              value={node.values.payloadOff || ""}
                              onChange={(e) => handleValueChange(node.id, "payloadOff", e.target.value)}
                              placeholder='{"state": "OFF"}'
                              rows={2}
                              className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 transition-all font-mono text-[10px] resize-none"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleDeleteNode(node.id)}
                      className="w-full px-4 py-2 bg-red-950/20 hover:bg-red-900/30 border border-red-900/30 hover:border-red-500/30 text-red-400 hover:text-red-300 font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" /> Eliminar Nodo
                    </button>
                  </div>
                </div>
              )
            })() : (
              <div className="text-center py-10 space-y-2 text-slate-500">
                <Info className="w-8 h-8 text-slate-650 mx-auto" />
                <p className="text-xs leading-normal">
                  Haz clic en cualquier nodo del lienzo para abrir sus propiedades de configuración, cambiar de protocolo inalámbrico o ajustar umbrales lógicos.
                </p>
              </div>
            )}
          </div>

          {/* Tips Info Card */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 space-y-3">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Tips de Simulación</span>
            <div className="text-[11px] text-slate-400 space-y-2 leading-relaxed">
              <p>
                1. <strong>Lógica de flujo</strong>: Conecta la salida (punto derecho) de un trigger a la entrada (punto izquierdo) de un filtro o de una acción.
              </p>
              <p>
                2. <strong>Prueba tu flujo</strong>: Al simular, verás un destello cruzando las líneas y los actuadores correspondientes brillarán en su estado activo.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-6 py-16 mt-16 border-t border-slate-900 relative z-10">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center tracking-tight mb-8">
          Preguntas Frecuentes sobre Programación de Automatizaciones IoT
        </h2>
        
        <div className="space-y-4">
          <FAQItem 
            question="¿Qué diferencias hay entre Zigbee y Matter en una red IoT?"
            answer="Zigbee trabaja en malla (Mesh) y consume muy poca energía, lo que es ideal para sensores alimentados por batería, pero requiere un Hub o puente intermedio (como Zigbee2MQTT). Matter es el nuevo estándar universal de conectividad local que corre sobre redes IP (como Ethernet o Thread) y permite la interoperabilidad directa e instantánea entre dispositivos de diferentes marcas sin depender de nubes propietarias."
          />
          <FAQItem 
            question="¿Por qué se restringen los flujos con Nodos de Condición (Filters)?"
            answer="Los filtros de condición impiden que las acciones se ejecuten siempre que el disparador se active. Por ejemplo, un sensor de movimiento (Trigger) no debería encender las luces en pleno mediodía; un filtro de 'Es de Noche' asegura que la luz inteligente solo se active si es necesario, optimizando el consumo energético."
          />
          <FAQItem 
            question="¿Cómo implementa M&M Tech House soluciones de IoT corporativas?"
            answer="Diseñamos e integramos infraestructuras completas de automatización local e industrial. Programamos gateways o middlewares personalizados, configuramos servidores locales (Edge Computing) y construimos dashboards de control web con protocolos seguros como MQTT, Modbus, Zigbee y Matter, integrándolos a sus sistemas de software existentes."
          />
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* CONTACT MODAL */}
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />

      {/* LEAD CAPTURE LIMIT MODAL */}
      <AnimatePresence>
        {isLeadModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setIsLeadModalOpen(false)}
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto z-50 w-full max-w-lg h-fit px-4"
            >
              <div className="bg-slate-900 border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl p-6 md:p-8 space-y-5 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-sky-500/10 to-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLeadModalOpen(false)}
                    className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer"
                  >
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-white leading-tight">
                    ¿Necesitas automatizar espacios sin límites?
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    En nuestra empresa de software desarrollamos middlewares de IoT a la medida, paneles de control corporativos y flujos lógicos avanzados conectando hardware real por Zigbee y Matter sin depender de terceros.
                  </p>
                  <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                    Registra tus datos a continuación para ampliar inmediatamente tu capacidad del constructor (hasta 15 nodos y 8 dispositivos) o agendar una consultoría gratuita sobre hardware y software inteligente.
                  </p>
                </div>

                {leadError && (
                  <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs font-bold rounded-xl">
                    {leadError}
                  </div>
                )}

                <form onSubmit={handleLeadSubmit} className="space-y-3 pt-2">
                  <div>
                    <label htmlFor="lead-name" className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Nombre Completo
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        id="lead-name"
                        type="text"
                        required
                        value={leadForm.nombre}
                        onChange={(e) => setLeadForm({ ...leadForm, nombre: e.target.value })}
                        placeholder="Ej. Luis Morales"
                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="lead-email" className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                        Correo Corporativo / Personal
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input
                          id="lead-email"
                          type="email"
                          required
                          value={leadForm.email}
                          onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                          placeholder="Ej. luismorales@empresa.com"
                          className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-all font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="lead-company" className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                        Empresa / Organización
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                          <Building className="w-4 h-4" />
                        </span>
                        <input
                          id="lead-company"
                          type="text"
                          required
                          value={leadForm.empresa}
                          onChange={(e) => setLeadForm({ ...leadForm, empresa: e.target.value })}
                          placeholder="Ej. M&M Tech House"
                          className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-all font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-3">
                    <button
                      type="submit"
                      disabled={isLeadSending}
                      className="flex-1 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isLeadSending ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        "Registrarse y Ampliar Límite"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isLeadSending}
                      className="py-2.5 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <LogIn className="w-4 h-4" /> Registro Rápido con Google
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Inner FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left font-bold text-slate-200 hover:text-white flex justify-between items-center gap-4 transition-colors cursor-pointer select-none"
      >
        <span className="text-xs md:text-sm">{question}</span>
        <span className={`text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}>
          <HelpCircle className="w-4 h-4" />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-950/60 pt-3">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
