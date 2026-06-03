-- Migration: Add completed_lessons to user_activities table
ALTER TABLE public.user_activities 
  ADD COLUMN IF NOT EXISTS completed_lessons text[] DEFAULT '{}';
