'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import Header from '@/components/Header';
import { LEVELS } from '@/lib/lessonConfig';
import { useActivityStore } from '@/store/useActivityStore';

export default function LevelPage() {
  const router = useRouter();
  const params = useParams<{ levelId: string }>();
  const {
    hasAccess,
    isLessonCompleted,
    canAccessLevel,
    canAccessLesson,
    initialize,
    isCheckingSub,
  } = useActivityStore();
  const hasEsp32 = hasAccess('esp32');
  const [mounted, setMounted] = useState(false);

  const levelId = Number(params.levelId);
  const level = LEVELS.find((l) => l.id === levelId);

  useEffect(() => {
    initialize().then(() => setMounted(true));
  }, [initialize]);

  if (!mounted || isCheckingSub) {
    return (
      <main className="min-h-screen bg-[#EDEDED] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2E4862] border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-gray-500 font-medium">Loading level...</p>
        </div>
      </main>
    );
  }

  if (!level) {
    return (
      <main className="min-h-screen bg-[#EDEDED]">
        <Header />
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h1 className="text-xl font-bold text-[#2E4862]">Level not found</h1>
            <button
              type="button"
              onClick={() => router.push('/learn')}
              className="mt-3 text-sm text-gray-500 hover:text-[#2E4862]"
            >
              ← Learning Path
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!canAccessLevel(levelId)) {
    return (
      <main className="min-h-screen bg-[#EDEDED]">
        <Header />
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="rounded-xl bg-white p-6 shadow-sm text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h1 className="text-xl font-bold text-[#2E4862]">Level Locked</h1>
            {!hasEsp32 ? (
              <>
                <p className="mt-2 text-sm text-gray-500">Activate your hardware kit to unlock this level.</p>
                <Link
                  href="/redeem"
                  className="mt-4 inline-block rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:scale-[1.02] transition-all"
                >
                  Unlock Full Access →
                </Link>
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Complete previous levels to unlock this content.</p>
            )}
            <button
              type="button"
              onClick={() => router.push('/learn')}
              className="mt-4 block text-sm text-gray-500 hover:text-[#2E4862]"
            >
              ← Learning Path
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#EDEDED]">
      <Header />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <button
          type="button"
          onClick={() => router.push('/learn')}
          className="text-sm text-gray-500 hover:text-[#2E4862]"
        >
          ← Learning Path
        </button>

        <div className="mt-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">{level.icon}</div>
            <div>
              <span className="inline-flex rounded-full bg-[#2E4862]/10 px-2 py-0.5 text-xs text-[#2E4862]">
                Level {level.id}
              </span>
              <h1 className="mt-1 text-2xl font-bold text-[#2E4862]">{level.title}</h1>
              <p className="mt-1 text-sm text-gray-500">{level.description}</p>
            </div>
          </div>
        </div>

        <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {level.lessons.map((lesson) => {
            const accessible = canAccessLesson(levelId, lesson.id);
            const done = isLessonCompleted(lesson.id);

            return (
              <div
                key={lesson.id}
                className={`relative rounded-2xl bg-white p-6 text-left shadow-sm transition-all ${
                  done
                    ? 'ring-2 ring-emerald-200 cursor-pointer hover:shadow-md hover:scale-[1.01]'
                    : accessible
                      ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]'
                      : 'opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Clickable area */}
                <button
                  type="button"
                  disabled={!accessible}
                  onClick={() => {
                    if (accessible) router.push(`/learn/level/${level.id}/lesson/${lesson.id}`);
                  }}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{lesson.icon}</span>
                    <div className="flex items-center gap-2">
                      {done && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          ✅ Done
                        </span>
                      )}
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        ⏱️ {lesson.estimatedMinutes} min
                      </span>
                    </div>
                  </div>

                  <h2 className="mt-3 text-lg font-bold text-[#2E4862]">{lesson.title}</h2>
                  <p className="mt-1 text-sm text-gray-500">{lesson.description}</p>

                  <div className="mt-4">
                    <p className="text-xs text-gray-400">{lesson.steps.length} steps</p>
                    <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                      <div className={`h-1.5 rounded-full ${done ? 'bg-emerald-500 w-full' : 'bg-gray-300 w-0'}`} />
                    </div>
                  </div>
                </button>

                {/* Lock overlay for inaccessible lessons */}
                {!accessible && (
                  <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🔒</div>
                      {!hasEsp32 ? (
                        <Link
                          href="/redeem"
                          className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-[10px] font-bold text-white shadow-sm hover:scale-[1.02] transition-all"
                        >
                          Unlock Full Access →
                        </Link>
                      ) : (
                        <p className="text-[10px] text-gray-500 font-medium">Complete previous lesson first</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
