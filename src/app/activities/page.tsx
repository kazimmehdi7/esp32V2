'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ACTIVITIES } from '@/lib/activitiesData';
import { useActivityStore } from '@/store/useActivityStore';

const DIFF: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  Beginner:     { label: 'Easy',   color: 'text-emerald-700', dot: 'bg-emerald-500', bg: 'bg-emerald-50 border border-emerald-200' },
  Intermediate: { label: 'Medium', color: 'text-amber-700',   dot: 'bg-amber-500',   bg: 'bg-amber-50 border border-amber-200'     },
  Advanced:     { label: 'Hard',   color: 'text-red-700',     dot: 'bg-red-500',     bg: 'bg-red-50 border border-red-200'         },
};

const FILTERS = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const;
type Filter = typeof FILTERS[number];

export default function ActivitiesPage() {
  const router = useRouter();
  const { isCompleted, getProgress } = useActivityStore();

  const [completedCount, setCompletedCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<Filter>('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setCompletedCount(ACTIVITIES.filter((a) => isCompleted(a.id)).length);
    setMounted(true);
  }, []);

  const filtered = ACTIVITIES.filter((a) => {
    const matchFilter = filter === 'All' || a.difficulty === filter;
    const matchSearch = search === '' ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

  const pct = Math.round((completedCount / ACTIVITIES.length) * 100);

  return (
    <main className="min-h-screen bg-[#f0f2f5]">
      <Header />

      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* Hero Header */}
        <div className="mb-8 overflow-hidden rounded-3xl bg-[#1a2d45]">
          <div className="px-8 py-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">ESP32 IoT Platform</span>
                </div>
                <h1 className="text-3xl font-extrabold text-white">Activities</h1>
                <p className="mt-1.5 text-[13px] text-white/40">
                  Guided projects — wiring, code, simulation and output.
                </p>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Projects',  value: ACTIVITIES.length,                                              color: 'text-white'       },
                  { label: 'Completed', value: mounted ? completedCount : 0,                                   color: 'text-emerald-400' },
                  { label: 'Easy',      value: ACTIVITIES.filter(a => a.difficulty === 'Beginner').length,     color: 'text-emerald-300' },
                  { label: 'Medium',    value: ACTIVITIES.filter(a => a.difficulty === 'Intermediate').length, color: 'text-amber-300'   },
                  { label: 'Hard',      value: ACTIVITIES.filter(a => a.difficulty === 'Advanced').length,     color: 'text-red-300'     },
                ].map((s) => (
                  <div key={s.label} className="min-w-[60px] rounded-2xl bg-white/10 px-4 py-3 text-center">
                    <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-white/30">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall progress — only after mount */}
            {mounted && completedCount > 0 && (
              <div className="mt-6 rounded-2xl bg-white/10 px-5 py-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white/50">Overall Progress</span>
                  <span className="text-[11px] font-extrabold text-emerald-400">{completedCount}/{ACTIVITIES.length} completed</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-emerald-400 transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-xl px-4 py-2 text-[12px] font-bold transition-all duration-200 ${
                  filter === f
                    ? 'bg-[#1a2d45] text-white shadow-sm'
                    : 'bg-white text-gray-400 hover:text-[#1a2d45] shadow-sm'
                }`}
              >
                {f}
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                  filter === f ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {f === 'All' ? ACTIVITIES.length : ACTIVITIES.filter(a => a.difficulty === f).length}
                </span>
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activities..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-8 pr-4 text-[12px] text-gray-700 outline-none transition-all focus:border-[#1a2d45] focus:ring-2 focus:ring-[#1a2d45]/10 sm:w-56"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* No results */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm">
            <p className="text-4xl">🔍</p>
            <p className="mt-3 text-[14px] font-bold text-gray-400">No activities found</p>
            <button
              type="button"
              onClick={() => { setSearch(''); setFilter('All'); }}
              className="mt-3 rounded-xl bg-[#1a2d45] px-4 py-2 text-[11px] font-bold text-white"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((activity, idx) => {
            const done = mounted && isCompleted(activity.id);
            const progress = mounted ? getProgress(activity.id, 5) : 0;
            const diff = DIFF[activity.difficulty] ?? DIFF.Beginner;

            return (
              <button
                key={activity.id}
                type="button"
                onClick={() => router.push(`/activities/${activity.id}`)}
                className={`group relative flex flex-col rounded-2xl bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  done ? 'ring-2 ring-emerald-200' : 'hover:ring-1 hover:ring-[#1a2d45]/10'
                }`}
              >
                {/* Top row */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f4f8] text-3xl shadow-inner">
                    {activity.icon}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {done && (
                      <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                         Done
                      </span>
                    )}
                    <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${diff.bg} ${diff.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${diff.dot}`} />
                      {diff.label}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-[15px] font-extrabold leading-tight text-[#1a2d45] group-hover:text-[#243d5a]">
                  {activity.title}
                </h2>

                {/* Description */}
                <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-gray-400">
                  {activity.description}
                </p>

                {/* Progress bar */}
                {!done && progress > 0 && (
                  <div className="mt-3 rounded-xl bg-[#f8f9fb] px-3 py-2.5">
                    <div className="mb-1.5 flex justify-between">
                      <span className="text-[10px] font-semibold text-gray-400">In progress</span>
                      <span className="text-[10px] font-extrabold text-[#1a2d45]">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-[#1a2d45] transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {activity.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span>⏱ {activity.duration}</span>
                    <span>🔧 {activity.equipment.length} parts</span>
                  </div>
                  <span className="rounded-lg bg-[#1a2d45] px-2.5 py-1 text-[10px] font-bold text-white opacity-0 transition-all duration-200 group-hover:opacity-100">
                    {done ? 'Review →' : 'Start →'}
                  </span>
                </div>

                {/* Teaches */}
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {activity.teaches.slice(0, 3).map((t) => (
                    <span key={t} className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      {t}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}

          {/* Coming soon */}
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-white/60 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl">🚧</div>
            <div>
              <p className="text-[13px] font-bold text-gray-400">More coming soon</p>
              <p className="mt-0.5 text-[11px] text-gray-300">WiFi, MQTT, sensors & more</p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}