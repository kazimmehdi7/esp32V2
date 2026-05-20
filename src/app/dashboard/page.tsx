'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useActivityStore } from '@/store/useActivityStore';

import { PROJECT_TEMPLATES } from '@/lib/projectTemplates';
import { ACTIVITIES } from '@/lib/activitiesData';
import { useAppStore } from '@/store/useAppStore';
import Header from '@/components/Header';


export default function DashboardPage() {
  const router = useRouter();
  const activeDeviceId = useAppStore((state) => state.activeDeviceId);
  const addBlock = useAppStore((state) => state.addBlock);
  const clearBlocks = useAppStore((state) => state.clearBlocks);
  const { completed, streak, lastActive, isCompleted } = useActivityStore();
  const totalActivities = ACTIVITIES.length;

  // Initialize activity store with logged-in user
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await useActivityStore.getState().initialize(session.user.id);
        await useActivityStore.getState()._updateStreak(session.user.id);
      }
    };
    init();
  }, []);

  // ── Hydration fix ──
  // All localStorage-dependent values start as safe defaults on server.
  // useEffect only runs on client — safe to read real values there.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use safe defaults until client is ready
  const completedCount = mounted ? completed.length : 0;
  const clientStreak   = mounted ? streak : 0;
  const deviceId       = mounted ? (activeDeviceId || 'Not linked') : 'Not linked';
  const completedList  = mounted ? ACTIVITIES.filter((a) => isCompleted(a.id)) : [];

  const handleLoadTemplate = (templateId: string) => {
    const template = PROJECT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    clearBlocks();
    template.blocks.forEach((block) => addBlock(block));
    router.push('/');
  };

  return (
    <main className="min-h-screen bg-[#EDEDED]">
      <Header />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <section>
          <h1 className="text-2xl font-bold text-[#2E4862]">Welcome back! 👋</h1>
          <p className="mt-1 text-sm text-gray-500">What would you like to do today?</p>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Playground */}
          <div
            onClick={() => router.push('/')}
            className="cursor-pointer rounded-2xl bg-[#2E4862] p-6 text-white shadow-lg transition-transform hover:scale-[1.02]"
          >
            <div className="text-5xl">🧩</div>
            <h2 className="mt-4 text-xl font-bold">Playground</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Build freely with blocks or English. Test your ideas on real hardware instantly.
            </p>
            <p className="mt-6 text-sm font-semibold text-white/90">Open Playground →</p>
          </div>

          {/* Learn */}
          <div
            onClick={() => router.push('/learn')}
            className="cursor-pointer rounded-2xl bg-white p-6 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md"
          >
            <div className="text-5xl">📚</div>
            <h2 className="mt-4 text-xl font-bold text-[#2E4862]">Learn</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Structured lessons from LED basics to IoT cloud projects. Learn step by step.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <span className="rounded-full bg-[#2E4862]/10 px-3 py-1 text-xs font-semibold text-[#2E4862]">
                5 Levels
              </span>
              <span className="rounded-full bg-[#2E4862]/10 px-3 py-1 text-xs font-semibold text-[#2E4862]">
                25 Lessons
              </span>
            </div>
          </div>

          {/* Activities */}
          <div
            onClick={() => router.push('/activities')}
            className="cursor-pointer rounded-2xl bg-white p-6 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md"
          >
            <div className="text-5xl">⚡</div>
            <h2 className="mt-4 text-xl font-bold text-[#2E4862]">Activities</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Guided projects with wiring diagrams, simulations, and step-by-step code.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <span className="rounded-full bg-[#2E4862]/10 px-3 py-1 text-xs font-semibold text-[#2E4862]">
                {totalActivities} Projects
              </span>
              {completedCount > 0 && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  {completedCount} Done ✓
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#2E4862]">🚀 Quick Start</h3>
            <button onClick={() => router.push('/')} className="text-xs text-gray-500 hover:text-[#2E4862]">
              Open Playground →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {PROJECT_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleLoadTemplate(template.id)}
                className="cursor-pointer rounded-xl bg-white p-4 text-left shadow-sm transition-all hover:scale-[1.01] hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{template.icon}</span>
                  <span className="text-[10px] text-gray-400">{template.blocks.length} blocks</span>
                </div>
                <p className="mt-2 text-sm font-bold text-[#2E4862]">{template.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{template.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {template.teaches.map((t) => (
                    <span key={t} className="rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-[10px] text-green-700">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {template.components.slice(0, 2).map((c) => (
                    <span key={c} className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600">
                      {c}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">🎯 Current Level</p>
            <p className="mt-1 text-sm font-semibold text-[#2E4862]">Level 1</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">⚡ Activities Done</p>
            <p className="mt-1 text-sm font-semibold text-[#2E4862]">
              {completedCount} / {totalActivities}
            </p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">🔥 Day Streak</p>
            <p className="mt-1 text-sm font-semibold text-[#2E4862]">
              {clientStreak} {clientStreak === 1 ? 'day' : 'days'}
            </p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">📡 Device</p>
            <p className="mt-1 text-sm font-semibold text-[#2E4862]">{deviceId}</p>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mt-10">
          <h3 className="mb-4 text-lg font-bold text-[#2E4862]">Recent Activity</h3>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            {completedList.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center">
                <div className="text-2xl">📭</div>
                <p className="mt-2 text-sm text-gray-400">
                  No activity yet. Start with an Activity or the Playground!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {completedList.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl bg-[#EDEDED] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{a.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-[#2E4862]">{a.title}</p>
                        <p className="text-xs text-gray-400">{a.difficulty} · {a.duration}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                      ✓ Completed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}