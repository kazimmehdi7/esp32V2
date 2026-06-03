// store/useActivityStore.ts
import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { LEVELS } from '@/lib/lessonConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityStore = {
  // Progress tracking
  completed: string[];                      // activity IDs fully completed
  stepProgress: Record<string, number>;     // { activityId: lastCompletedStep }
  completedLessons: string[];               // lesson IDs completed e.g. ['1-1', '1-2']
  streak: number;
  lastActive: string | null;
  overallProgress: number;
  totalActivities: number;
  userId: string;
  courseId: string;

  // Kit subscription tracking
  redeemedKits: string[];
  isCheckingSub: boolean;
  hasAccess: (courseId: string) => boolean;
  addRedeemedKit: (kitType: string) => void;

  // Sequential lesson/level access helpers
  isLessonCompleted: (lessonId: string) => boolean;
  isLevelCompleted: (levelId: number) => boolean;
  canAccessLevel: (levelId: number) => boolean;
  canAccessLesson: (levelId: number, lessonId: string) => boolean;
  markLessonComplete: (lessonId: string) => Promise<void>;

  // Activity actions
  initialize: () => Promise<void>;
  markStepComplete: (activityId: string, step: number) => Promise<void>;
  markActivityComplete: (activityId: string) => Promise<void>;
  getProgress: (activityId: string, totalSteps: number) => number;
  isCompleted: (activityId: string) => boolean;
  getLastStep: (activityId: string) => number;
  resetActivity: (activityId: string) => Promise<void>;
  resetAll: () => Promise<void>;
  _updateStreak: (userId: string) => Promise<void>;
  _updateOverallProgress: () => Promise<void>;
};

// ─── Shared upsert payload builder ────────────────────────────────────────────

const buildPayload = (state: ActivityStore, overrides: Partial<any> = {}) => ({
  user_id: state.userId,
  completed: state.completed,
  step_progress: state.stepProgress,
  completed_lessons: state.completedLessons,
  streak: state.streak,
  last_active: state.lastActive,
  user_progress: state.overallProgress,
  ...overrides,
});

// ─── Store ────────────────────────────────────────────────────────────────────

export const useActivityStore = create<ActivityStore>()((set, get) => ({
  completed: [],
  stepProgress: {},
  completedLessons: [],
  streak: 0,
  lastActive: null,
  overallProgress: 0,
  totalActivities: 0,
  userId: '',
  redeemedKits: [],
  isCheckingSub: true,
  courseId: '',

  // ── Kit access ──
  hasAccess: (courseId) => get().redeemedKits.includes(courseId),

  addRedeemedKit: (kitType) => {
    set((state) => ({
      redeemedKits: state.redeemedKits.includes(kitType)
        ? state.redeemedKits
        : [...state.redeemedKits, kitType],
    }));
  },

  // ── Lesson / Level completion helpers ──

  isLessonCompleted: (lessonId) => get().completedLessons.includes(lessonId),

  isLevelCompleted: (levelId) => {
    const level = LEVELS.find((l) => l.id === levelId);
    if (!level) return false;
    return level.lessons.every((lesson) => get().completedLessons.includes(lesson.id));
  },

  canAccessLevel: (levelId) => {
    if (levelId === 1) return true; // Level 1 always visible (lesson 1-1 is free)
    if (!get().hasAccess('esp32')) return false;
    return get().isLevelCompleted(levelId - 1);
  },

  canAccessLesson: (levelId, lessonId) => {
    // Only lesson 1-1 is free
    if (levelId === 1 && lessonId === '1-1') return true;
    // Everything else requires kit
    if (!get().hasAccess('esp32')) return false;
    const level = LEVELS.find((l) => l.id === levelId);
    if (!level) return false;
    const lessonIndex = level.lessons.findIndex((l) => l.id === lessonId);
    if (lessonIndex === -1) return false;
    if (lessonIndex === 0) {
      // First lesson of a level needs the previous level fully done
      return levelId === 1 ? true : get().isLevelCompleted(levelId - 1);
    }
    // Otherwise need the immediately preceding lesson done
    return get().isLessonCompleted(level.lessons[lessonIndex - 1].id);
  },

  markLessonComplete: async (lessonId) => {
    const { completedLessons, userId } = get();
    if (completedLessons.includes(lessonId)) return;
    const newCompletedLessons = [...completedLessons, lessonId];
    set({ completedLessons: newCompletedLessons });
    if (!userId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('user_activities')
      .upsert(buildPayload(get(), { completed_lessons: newCompletedLessons }), {
        onConflict: 'user_id',
      });
    if (error) console.error('[markLessonComplete] error:', error);
  },

  // ── Initialize ──

  initialize: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) {
      set({ isCheckingSub: false });
      return;
    }

    const [{ data: userData }, { count }, { data: activeCodes }] = await Promise.all([
      supabase.from('user_activities').select('*').eq('user_id', userId).single(),
      supabase.from('activities').select('id', { count: 'exact', head: true }),
      supabase
        .from('kit_codes')
        .select('kit_type')
        .eq('redeemed_by', userId)
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`),
    ]);

    const redeemedKits = activeCodes ? activeCodes.map((c) => c.kit_type) : [];

    if (userData) {
      set({
        userId,
        completed: userData.completed || [],
        stepProgress: userData.step_progress || {},
        completedLessons: userData.completed_lessons || [],
        overallProgress: userData.user_progress || 0,
        streak: userData.streak || 0,
        lastActive: userData.last_active || null,
        totalActivities: count ?? 0,
        redeemedKits,
        isCheckingSub: false,
      });
    } else {
      set({ userId, totalActivities: count ?? 0, redeemedKits, isCheckingSub: false });
    }
  },

  // ── Activity progress ──

  markStepComplete: async (activityId, step) => {
    const supabase = createClient();
    const current = get().stepProgress[activityId] ?? 0;
    if (step <= current) return;

    const newStepProgress = { ...get().stepProgress, [activityId]: step };
    set({ stepProgress: newStepProgress });

    const { error } = await supabase
      .from('user_activities')
      .upsert(buildPayload(get(), { step_progress: newStepProgress }), { onConflict: 'user_id' });

    if (error) {
      console.error('[markStepComplete] Supabase error:', error);
      return;
    }
    await get()._updateOverallProgress();
  },

  markActivityComplete: async (activityId) => {
    const newCompleted = get().completed.includes(activityId)
      ? get().completed
      : [...get().completed, activityId];
    set({ completed: newCompleted });
    const supabase = createClient();
    await supabase
      .from('user_activities')
      .upsert(buildPayload(get(), { completed: newCompleted }), { onConflict: 'user_id' });
    await get()._updateStreak(get().userId);
    await get()._updateOverallProgress();
  },

  getProgress: (activityId, totalSteps) => {
    if (get().completed.includes(activityId)) return 100;
    const lastStep = get().stepProgress[activityId] ?? 0;
    return Math.round((lastStep / (totalSteps - 1)) * 100);
  },

  isCompleted: (activityId) => get().completed.includes(activityId),
  getLastStep: (activityId) => get().stepProgress[activityId] ?? 0,

  resetActivity: async (activityId) => {
    const newCompleted = get().completed.filter((id) => id !== activityId);
    const newStepProgress = Object.fromEntries(
      Object.entries(get().stepProgress).filter(([k]) => k !== activityId)
    );
    set({ completed: newCompleted, stepProgress: newStepProgress });
    const supabase = createClient();
    await supabase
      .from('user_activities')
      .upsert(buildPayload(get(), { completed: newCompleted, step_progress: newStepProgress }), {
        onConflict: 'user_id',
      });
  },

  _updateStreak: async (userId) => {
    const today = new Date().toISOString().split('T')[0];
    const { lastActive, streak } = get();
    if (lastActive === today) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = lastActive === yesterday ? streak + 1 : 1;
    set({ lastActive: today, streak: newStreak });
    const supabase = createClient();
    await supabase
      .from('user_activities')
      .upsert(buildPayload(get(), { last_active: today, streak: newStreak }), {
        onConflict: 'user_id',
      });
  },

  resetAll: async () => {
    set({ completed: [], stepProgress: {}, completedLessons: [], streak: 0, lastActive: null, overallProgress: 0 });
    const supabase = createClient();
    await supabase.from('user_activities').upsert(
      {
        user_id: get().userId,
        completed: [],
        step_progress: {},
        completed_lessons: [],
        streak: 0,
        last_active: null,
        user_progress: 0,
      },
      { onConflict: 'user_id' }
    );
  },

  _updateOverallProgress: async () => {
    const total = get().totalActivities;
    const completedCount = get().completed.length;
    const overall = total === 0 ? 0 : Math.round((completedCount / total) * 100);
    set({ overallProgress: overall });
    const supabase = createClient();
    await supabase
      .from('user_activities')
      .upsert(buildPayload(get(), { user_progress: overall }), { onConflict: 'user_id' });
  },
}));