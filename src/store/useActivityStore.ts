// store/useActivityStore.ts
// DROP THIS FILE IN: src/store/useActivityStore.ts

import { create } from 'zustand';
// Removed static import; activity count will be fetched from Supabase
import { createClient } from '@/utils/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityStore = {
  // Progress tracking
  completed: string[];                      // activity IDs fully completed
  stepProgress: Record<string, number>;     // { activityId: lastCompletedStep }
  streak: number;                           // day streak
  lastActive: string | null;               // ISO date string
  overallProgress: number;                // overall progress percentage
  totalActivities: number;                 // total count of activities
  userId: string;

  // Kit subscription tracking
  redeemedKits: string[];                   // list of redeemed courses (e.g. ['esp32'])
  isCheckingSub: boolean;
  hasAccess: (courseId: string) => boolean;
  addRedeemedKit: (kitType: string) => void;

  // Actions
  initialize: () => Promise<void>;
  markStepComplete: (activityId: string, step: number) => Promise<void>;
  markActivityComplete: (activityId: string) => Promise<void>;
  getProgress: (activityId: string, totalSteps: number) => number; // returns 0-100
  isCompleted: (activityId: string) => boolean;
  getLastStep: (activityId: string) => number;
  resetActivity: (activityId: string) => Promise<void>;
  resetAll: () => Promise<void>;
  _updateStreak: (userId: string) => Promise<void>;
  _updateOverallProgress: () => Promise<void>;
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useActivityStore = create<ActivityStore>()((set, get) => ({
  completed: [],
  stepProgress: {},
  streak: 0,
  lastActive: null,
  overallProgress: 0,
  totalActivities: 0,
  userId: '' as string,
  redeemedKits: [],
  isCheckingSub: true,

  hasAccess: (courseId: string) => {
    return get().redeemedKits.includes(courseId);
  },

  addRedeemedKit: (kitType: string) => {
    set((state) => ({
      redeemedKits: state.redeemedKits.includes(kitType)
        ? state.redeemedKits
        : [...state.redeemedKits, kitType],
    }));
  },

  initialize: async () => {
    // Get the current authenticated user (UUID)
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) {
      console.warn('useActivityStore.initialize: No authenticated user found.');
      set({ isCheckingSub: false });
      return;
    }

    // Fetch user activities progress
    const { data: userData } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Fetch total activities count
    const { count } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true });

    // Fetch active redeemed kit codes (either unexpiring/null, or expiring in the future)
    const { data: activeCodes } = await supabase
      .from('kit_codes')
      .select('kit_type')
      .eq('redeemed_by', userId)
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    const redeemedKits = activeCodes ? activeCodes.map((c) => c.kit_type) : [];

    if (userData) {
      set({
        userId,
        completed: userData.completed || [],
        stepProgress: userData.step_progress || {},
        overallProgress: userData.user_progress || 0,
        streak: userData.streak || 0,
        lastActive: userData.last_active || null,
        totalActivities: count ?? 0,
        redeemedKits,
        isCheckingSub: false,
      });
    } else {
      // No user row yet – still set totalActivities and store userId
      set({ 
        userId, 
        totalActivities: count ?? 0,
        redeemedKits,
        isCheckingSub: false
      });
    }
  },

  markStepComplete: async (activityId, step) => {
    const current = get().stepProgress[activityId] ?? 0;
    if (step <= current) return;

    const newStepProgress = { ...get().stepProgress, [activityId]: step };
    set({ stepProgress: newStepProgress });
    
    // Sync with DB (include all fields so other fields are not overwritten)
    await createClient().from('user_activities').upsert({
      user_id: get().userId,
      completed: get().completed,
      step_progress: newStepProgress,
      streak: get().streak,
      last_active: get().lastActive,
      user_progress: get().overallProgress,
    });
    await get()._updateOverallProgress();
  },

  markActivityComplete: async (activityId) => {
    const newCompleted = get().completed.includes(activityId)
      ? get().completed
      : [...get().completed, activityId];
      
    set({ completed: newCompleted });
    await createClient().from('user_activities').upsert({
      user_id: get().userId,
      completed: newCompleted,
      step_progress: get().stepProgress,
      streak: get().streak,
      last_active: get().lastActive,
      user_progress: get().overallProgress,
    });
    // Update daily streak after marking activity complete
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
    await createClient().from('user_activities').upsert({
      user_id: get().userId,
      completed: newCompleted,
      step_progress: newStepProgress,
      streak: get().streak,
      last_active: get().lastActive,
      user_progress: get().overallProgress,
    });
  },

  // Update streak logic
  _updateStreak: async (userId) => {
    const today = new Date().toISOString().split('T')[0];
    const { lastActive, streak } = get();
    if (lastActive === today) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const isConsecutive = lastActive === yesterday;
    const newStreak = isConsecutive ? streak + 1 : 1;
    set({ lastActive: today, streak: newStreak });
    await createClient().from('user_activities').upsert({
      user_id: userId,
      completed: get().completed,
      step_progress: get().stepProgress,
      streak: newStreak,
      last_active: today,
      user_progress: get().overallProgress,
    });
  },

  resetAll: async () => {
    set({ completed: [], stepProgress: {}, streak: 0, lastActive: null, overallProgress: 0 });
    await createClient().from('user_activities').upsert({
      user_id: get().userId,
      completed: [],
      step_progress: {},
      streak: 0,
      last_active: null,
      user_progress: 0,
    });
  },

  // Compute and persist overall progress (percentage of activities completed)
  _updateOverallProgress: async () => {
    const total = get().totalActivities;
    const completedCount = get().completed.length;
    const overall = total === 0 ? 0 : Math.round((completedCount / total) * 100);
    set({ overallProgress: overall });
    // Persist to DB (using full row state to avoid resetting columns)
    await createClient().from('user_activities').upsert({
      user_id: get().userId,
      completed: get().completed,
      step_progress: get().stepProgress,
      streak: get().streak,
      last_active: get().lastActive,
      user_progress: overall,
    });
  },


}));