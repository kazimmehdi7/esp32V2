'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'

interface LayoutProps {
  aiBar?: React.ReactNode
  liveBar?: React.ReactNode
  sidebar: React.ReactNode
  canvas: React.ReactNode
  codePanel: React.ReactNode
}

export default function Layout({ aiBar, liveBar, sidebar, canvas, codePanel }: LayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [codePanelWidth, setCodePanelWidth] = useState(980)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = containerRect.right - e.clientX
      const minWidth = 300
      const maxWidth = containerRect.width * 0.75
      setCodePanelWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging])

  return (
    <div ref={containerRef} className="h-[calc(100vh-56px)] overflow-hidden bg-[#EDEDED] flex flex-col">
      {aiBar && <div>{aiBar}</div>}
      {liveBar && <div>{liveBar}</div>}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col w-[260px] bg-white rounded-xl shadow-sm overflow-y-auto m-3">
          {sidebar}
        </div>
        <div className="flex-1 overflow-hidden my-3">
          {canvas}
        </div>

        {/* Drag Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`w-2 cursor-col-resize flex items-center justify-center my-3 group transition-colors rounded-full ${
            isDragging ? 'bg-[#2E4862]/30' : 'hover:bg-[#2E4862]/10'
          }`}
          title="Drag to resize"
        >
          <div className={`w-1 h-10 rounded-full transition-colors ${
            isDragging ? 'bg-[#2E4862]' : 'bg-gray-300 group-hover:bg-[#2E4862]/50'
          }`} />
        </div>

        <div
          className="flex flex-col bg-white rounded-xl shadow-sm overflow-hidden m-3"
          style={{ width: `${codePanelWidth}px`, flexShrink: 0 }}
        >
          {codePanel}
        </div>
      </div>
    </div>
  )
}