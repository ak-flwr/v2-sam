'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

interface Message {
  role: 'user' | 'agent'
  content: string
  timestamp: Date
  audioUrl?: string
}

interface ShipmentData {
  shipment_id: string
  status: string
  eta: string
  window: {
    start: string
    end: string
  }
  address: {
    text: string
    text_ar?: string
  }
  geo_pin: {
    lat: number
    lng: number
  }
  instructions?: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'agent',
      content: 'مرحبا! أنا هنا لمساعدتك في تعديل تفاصيل التسليم. كيف يمكنني مساعدتك؟',
      timestamp: new Date(),
    },
  ])
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [shipment, setShipment] = useState<ShipmentData | null>(null)

  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load default shipment on mount
  useEffect(() => {
    loadShipment('SHP-2025-001')
  }, [])

  const loadShipment = async (shipmentId: string) => {
    try {
      const response = await fetch(`/api/shipments/${shipmentId}`)
      const data = await response.json()
      setShipment(data)
    } catch (error) {
      console.error('Failed to load shipment:', error)
    }
  }

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('متصفحك لا يدعم التعرف على الصوت. يرجى استخدام Chrome أو Edge.')
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = 'ar-SA' // Arabic (Saudi Arabia)
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript
      await handleUserMessage(transcript)
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognition.start()
    recognitionRef.current = recognition
    setIsRecording(true)
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
  }

  const handleUserMessage = async (text: string) => {
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])

    setIsProcessing(true)

    try {
      // Send to backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          shipment_id: shipment?.shipment_id || 'SHP-2025-001',
        }),
      })

      const data = await response.json()

      // Add agent response
      const agentMessage: Message = {
        role: 'agent',
        content: data.text,
        timestamp: new Date(),
        audioUrl: data.audioUrl,
      }
      setMessages(prev => [...prev, agentMessage])

      // Play audio if available
      if (data.audioUrl) {
        playAudio(data.audioUrl)
      }

      // Update shipment if changed
      if (data.updatedShipment) {
        setShipment(data.updatedShipment)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: Message = {
        role: 'agent',
        content: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const playAudio = (url: string) => {
    setIsPlaying(true)
    const audio = new Audio(url)
    audio.onended = () => setIsPlaying(false)
    audio.onerror = () => setIsPlaying(false)
    audio.play()
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - Chat Transcript */}
      <div className="w-1/2 flex flex-col border-r border-gray-200 bg-white">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <h1 className="text-xl font-bold arabic-text">SAM v2 - نظام التحكم بالتسليم</h1>
          <p className="text-sm opacity-90">Resolution Engine</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="arabic-text whitespace-pre-wrap">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {msg.timestamp.toLocaleTimeString('ar-SA')}
                </p>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* PTT Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={isProcessing}
            className={`w-full py-4 rounded-lg font-bold text-white transition-all ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 scale-105'
                : 'bg-blue-600 hover:bg-blue-700'
            } disabled:bg-gray-400 disabled:cursor-not-allowed`}
          >
            {isRecording ? '🎤 جاري التسجيل... اترك الزر للإرسال' : '🎤 اضغط مع الاستمرار للتحدث'}
          </button>
        </div>
      </div>

      {/* Right Panel - Avatar & Shipment Info */}
      <div className="w-1/2 flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
        {/* Avatar Section */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className={`relative ${isPlaying ? 'pulse-avatar' : ''}`}>
            <Image
              src="/avatar.svg"
              alt="Saudi Assistant"
              width={200}
              height={200}
              className="rounded-full shadow-lg"
            />
          </div>

          {/* Waveform when speaking */}
          {isPlaying && (
            <div className="flex items-end space-x-1 mt-4 h-10">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="waveform-bar w-2 bg-blue-500 rounded-full"
                />
              ))}
            </div>
          )}

          <p className="text-gray-600 mt-4 text-center arabic-text">
            {isPlaying ? 'جاري التحدث...' : 'في انتظار طلبك'}
          </p>
        </div>

        {/* Shipment Context Card */}
        {shipment && (
          <div className="p-6 bg-white border-t border-gray-200">
            <h2 className="text-lg font-bold mb-4 arabic-text">تفاصيل الشحنة</h2>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">رقم الشحنة</p>
                <p className="font-mono text-sm">{shipment.shipment_id}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">الحالة</p>
                <p className="font-semibold text-sm">
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded">
                    {shipment.status === 'OUT_FOR_DELIVERY' ? 'في الطريق' : shipment.status}
                  </span>
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 arabic-text">وقت الوصول المتوقع</p>
                <p className="font-semibold">{formatTime(shipment.eta)}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 arabic-text">العنوان</p>
                <p className="text-sm arabic-text">{shipment.address.text_ar || shipment.address.text}</p>
              </div>

              {shipment.instructions && (
                <div>
                  <p className="text-xs text-gray-500 arabic-text">ملاحظات التسليم</p>
                  <p className="text-sm">{shipment.instructions}</p>
                </div>
              )}

              {/* Simple map placeholder */}
              <div className="mt-4 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500 text-sm">
                  📍 {shipment.geo_pin.lat.toFixed(4)}, {shipment.geo_pin.lng.toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
