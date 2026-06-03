'use client';

import { useRouter } from 'next/navigation';

import Header from '@/components/Header';
import { LEVELS } from '@/lib/lessonConfig';
import { useActivityStore } from '@/store/useActivityStore';

export default function LearnPage() {
  const router = useRouter();
  const hasAccess = useActivityStore((state) => state.hasAccess);
  const hasEsp32 = hasAccess('esp32');

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

        <section className="mt-8 flex flex-col gap-6">
          {LEVELS.map((level) => {
            const isLevelLocked = !hasEsp32 && level.id > 1;

            return (
              <div
                key={level.id}
                onClick={() => {
                  if (!isLevelLocked) {
                    router.push(`/learn/level/${level.id}`);
                  } else {
                    router.push('/redeem');
                  }
                }}
                className={`relative rounded-2xl p-6 ${
                  isLevelLocked
                    ? 'bg-white opacity-60 cursor-not-allowed shadow-sm'
                    : 'bg-white cursor-pointer shadow-sm transition-all hover:shadow-md'
                }`}
              >
                <div className="flex gap-4">
                  <div className="text-4xl">{level.icon}</div>

                  <div className="flex-1">
                    <span className="inline-flex rounded-full bg-[#2E4862]/10 px-2 py-0.5 text-xs text-[#2E4862]">
                      Level {level.id}
                    </span>
                    <h2 className="mt-2 text-lg font-bold text-[#2E4862]">{level.title}</h2>
                    <p className="mt-1 text-sm text-gray-500">{level.description}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {level.lessons.map((lesson) => {
                        const isLessonLocked = !hasEsp32 && (level.id > 1 || lesson.id !== '1-1');

                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (!isLessonLocked) {
                                router.push(`/learn/level/${level.id}/lesson/${lesson.id}`);
                              } else {
                                alert('This lesson requires kit activation code! Redirecting to activation page...');
                                router.push('/redeem');
                              }
                            }}
                            className={`rounded-lg border px-3 py-1.5 text-xs flex items-center gap-1.5 ${
                              isLessonLocked
                                ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed opacity-75'
                                : 'bg-gray-50 border-gray-100 text-gray-600 cursor-pointer hover:bg-[#2E4862]/5 hover:border-[#2E4862]/20'
                            }`}
                          >
                            <span>{lesson.icon} {lesson.title}</span>
                            {isLessonLocked && <span className="text-[10px]" title="Requires kit activation">🔒</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {isLevelLocked && <div className="absolute right-6 top-6 text-2xl">🔒</div>}
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
