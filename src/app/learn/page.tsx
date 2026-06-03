'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import Header from '@/components/Header';
import { LEVELS } from '@/lib/lessonConfig';
import { useActivityStore } from '@/store/useActivityStore';

export default function LearnPage() {
  const router = useRouter();
  const {
    hasAccess,
    isLessonCompleted,
    canAccessLevel,
    canAccessLesson,
    isLevelCompleted,
    initialize,
    isCheckingSub,
  } = useActivityStore();
  const hasEsp32 = hasAccess('esp32');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initialize().then(() => setMounted(true));
  }, [initialize]);

  if (!mounted || isCheckingSub) {
    return (
      <main className="min-h-screen bg-[#EDEDED] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2E4862] border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-gray-500 font-medium">Loading learning path...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#EDEDED]">
      <Header />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="text-sm text-gray-500 hover:text-[#2E4862]"
        >
          ← Dashboard
        </button>

        <h1 className="mt-6 text-2xl font-bold text-[#2E4862]">📚 Learning Path</h1>
        <p className="mt-1 text-sm text-gray-500">Master ESP32 from basics to IoT cloud projects</p>

        {/* Unlock banner for users without kit access */}
        {!hasEsp32 && (
          <div className="mt-6 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-amber-800">🔒 Limited Preview Mode</p>
              <p className="mt-1 text-xs text-amber-600">Only Lesson 1-1 is available. Activate your hardware kit to unlock all levels and lessons.</p>
            </div>
            <Link
              href="/redeem"
              className="flex-shrink-0 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:from-amber-300 hover:to-orange-400 transition-all hover:scale-[1.02]"
            >
              Unlock Full Access →
            </Link>
          </div>
        )}

        <section className="mt-8 flex flex-col gap-6">
          {LEVELS.map((level) => {
            const levelAccessible = canAccessLevel(level.id);
            const levelDone = isLevelCompleted(level.id);
            const completedCount = level.lessons.filter((l) => isLessonCompleted(l.id)).length;
            const levelProgress = level.lessons.length > 0 ? Math.round((completedCount / level.lessons.length) * 100) : 0;

            return (
              <div
                key={level.id}
                className={`relative rounded-2xl p-6 ${
                  !levelAccessible
                    ? 'bg-white opacity-60 cursor-not-allowed shadow-sm'
                    : 'bg-white shadow-sm transition-all hover:shadow-md'
                }`}
              >
                <div className="flex gap-4">
                  <div className="text-4xl">{level.icon}</div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex rounded-full bg-[#2E4862]/10 px-2 py-0.5 text-xs text-[#2E4862]">
                        Level {level.id}
                      </span>
                      {levelDone && (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          ✅ Completed
                        </span>
                      )}
                    </div>
                    <h2 className="mt-2 text-lg font-bold text-[#2E4862]">{level.title}</h2>
                    <p className="mt-1 text-sm text-gray-500">{level.description}</p>

                    {/* Level progress bar */}
                    {levelAccessible && completedCount > 0 && (
                      <div className="mt-3 max-w-xs">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>{completedCount}/{level.lessons.length} lessons</span>
                          <span>{levelProgress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100">
                          <div className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${levelProgress}%` }} />
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {level.lessons.map((lesson) => {
                        const lessonAccessible = canAccessLesson(level.id, lesson.id);
                        const lessonDone = isLessonCompleted(lesson.id);

                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (lessonAccessible) {
                                router.push(`/learn/level/${level.id}/lesson/${lesson.id}`);
                              } else if (!hasEsp32) {
                                router.push('/redeem');
                              }
                            }}
                            className={`rounded-lg border px-3 py-1.5 text-xs flex items-center gap-1.5 ${
                              lessonDone
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-pointer hover:bg-emerald-100'
                                : lessonAccessible
                                  ? 'bg-gray-50 border-gray-100 text-gray-600 cursor-pointer hover:bg-[#2E4862]/5 hover:border-[#2E4862]/20'
                                  : 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed opacity-75'
                            }`}
                          >
                            <span>
                              {lessonDone ? '✅' : ''} {lesson.icon} {lesson.title}
                            </span>
                            {!lessonAccessible && <span className="text-[10px]" title="Locked">🔒</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Lock overlay for inaccessible levels */}
                {!levelAccessible && (
                  <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                    <div className="text-center">
                      <div className="text-3xl mb-2">🔒</div>
                      {!hasEsp32 ? (
                        <Link
                          href="/redeem"
                          className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:scale-[1.02] transition-all"
                        >
                          Unlock Full Access →
                        </Link>
                      ) : (
                        <p className="text-xs text-gray-500 font-medium">Complete previous level to unlock</p>
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
