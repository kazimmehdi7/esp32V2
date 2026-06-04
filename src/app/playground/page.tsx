'use client'

import React from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useMQTT } from '@/hooks/useMQTT'
import { blocksToCommands, validateBlocks } from '@/lib/utils'
import Header from '@/components/Header'
import Layout from '@/components/Layout'
import Sidebar from '@/components/Sidebar'
import Canvas from '@/components/Canvas'
import CodePanel from '@/components/CodePanel'
import LiveBar from '@/components/LiveBar'
import FlashModal from '@/components/FlashModal'
import AIAssistant from '@/components/AIAssistant'
import TemplatesModal from '@/components/TemplatesModal'

export default function Home() {
  const blocks = useAppStore((state) => state.blocks)
  const activeDeviceId = useAppStore((state) => state.activeDeviceId)
  const loopMode = useAppStore((state) => state.loopMode)
  const setActiveDeviceId = useAppStore((state) => state.setActiveDeviceId)

  const [flashModalOpen, setFlashModalOpen] = React.useState(false)
  const [templatesOpen, setTemplatesOpen] = React.useState(false)

  const { connect, disconnect, runProgram, saveProgram, clearSavedProgram } = useMQTT()

  const handleConnect = () => {
    if (!activeDeviceId) return
    connect(activeDeviceId)
  }

  const handleRun = () => {
    const errors = validateBlocks(blocks)
    if (errors.size > 0) {
      alert('Fix block errors before running')
      return
    }
    const commands = blocksToCommands(blocks)
    if (!commands.length) {
      alert('No executable commands found')
      return
    }
    runProgram(commands)
  }

  const handleSave = () => {
    const errors = validateBlocks(blocks)
    if (errors.size > 0) {
      alert('Fix block errors before saving')
      return
    }
    const commands = blocksToCommands(blocks)
    if (!commands.length) {
      alert('No executable commands found')
      return
    }
    saveProgram(commands, loopMode)
  }

  const handleDeviceLinked = (deviceId: string) => {
    setActiveDeviceId(deviceId)
    connect(deviceId)
  }

  React.useEffect(() => {
    const handler = () => setFlashModalOpen(true)
    window.addEventListener('open-flash-modal', handler)
    return () => window.removeEventListener('open-flash-modal', handler)
  }, [])

  React.useEffect(() => {
    const handler = () => setTemplatesOpen(true)
    window.addEventListener('open-templates', handler)
    return () => window.removeEventListener('open-templates', handler)
  }, [])

  return (
    <main className="min-h-screen bg-[#EDEDED]">
      <Header />
      <Layout
        liveBar={
          <LiveBar
            onConnect={handleConnect}
            onDisconnect={disconnect}
            onRun={handleRun}
            onSave={handleSave}
            onClearSaved={clearSavedProgram}
            hasBlocks={blocks.length > 0}
          />
        }
        sidebar={<Sidebar />}
        canvas={<Canvas />}
        codePanel={<CodePanel />}
      />
      <FlashModal
        isOpen={flashModalOpen}
        onClose={() => setFlashModalOpen(false)}
        onDeviceLinked={handleDeviceLinked}
      />
      <AIAssistant />
      <TemplatesModal
        isOpen={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
      />
    </main>
  )
}