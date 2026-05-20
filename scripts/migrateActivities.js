// scripts/migrateActivities.js
import { config as loadEnv } from 'dotenv';
import path from 'path';
import { createClient } from '../src/utils/supabase/client.ts';
import { ACTIVITIES } from '../src/lib/activitiesData.ts';

// Load .env.local (or fallback to .env)
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

(async () => {
  const supabase = createClient();

  for (const a of ACTIVITIES) {
      const { error } = await supabase.from('activities').upsert({
        id: a.id,
        title: a.title,
        description: a.description,
        difficulty: a.difficulty,
        tags: a.tags,
        equipment: a.equipment,
        teaches: a.teaches,
        duration: a.duration,
        steps: a.steps,
        icon: a.icon,
        // New intro fields (nullable)
        intro_headline: a.intro?.headline ?? null,
        intro_what: a.intro?.what ?? null,
        intro_why: a.intro?.why ?? null,
        // Additional fields
        assemble: a.assemble,
        code: a.code,
        playgroundBlocks: a.playgroundBlocks,
        output: a.output,
        bonusChallenge: a.bonusChallenge ?? null,
        wiringComponent: a.wiringComponent ?? null,
      });

    if (error) {
      console.error(`❌ Failed to upsert activity ${a.id}:`, error);
    } else {
      console.log(`✅ Upserted activity ${a.id}`);
    }
  }

  console.log('✅ Migration complete.');
  process.exit(0);
})();