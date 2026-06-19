import { db } from './db'
import type { Exercise, Workout, WorkoutExercise, WorkoutSet } from './types'

export interface BackupData {
  app: 'workout-tracker'
  version: 1
  exportedAt: string
  exercises: Exercise[]
  workouts: Workout[]
  workoutExercises: WorkoutExercise[]
  sets: WorkoutSet[]
}

export async function exportBackup(): Promise<BackupData> {
  const [exercises, workouts, workoutExercises, sets] = await Promise.all([
    db.exercises.toArray(),
    db.workouts.toArray(),
    db.workoutExercises.toArray(),
    db.sets.toArray(),
  ])
  return {
    app: 'workout-tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises,
    workouts,
    workoutExercises,
    sets,
  }
}

export function downloadBackup(data: BackupData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `workout-backup-${data.exportedAt.slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function isBackup(data: unknown): data is BackupData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    d.app === 'workout-tracker' &&
    Array.isArray(d.exercises) &&
    Array.isArray(d.workouts) &&
    Array.isArray(d.workoutExercises) &&
    Array.isArray(d.sets)
  )
}

/**
 * Restore from a backup. 'replace' wipes current data first; 'merge' upserts on
 * top of existing data (ids collide-safe via bulkPut).
 */
export async function importBackup(
  raw: unknown,
  mode: 'replace' | 'merge' = 'replace',
): Promise<{ exercises: number; workouts: number }> {
  if (!isBackup(raw)) {
    throw new Error('Not a valid workout-tracker backup file.')
  }
  await db.transaction(
    'rw',
    [db.exercises, db.workouts, db.workoutExercises, db.sets],
    async () => {
      if (mode === 'replace') {
        await Promise.all([
          db.exercises.clear(),
          db.workouts.clear(),
          db.workoutExercises.clear(),
          db.sets.clear(),
        ])
      }
      await db.exercises.bulkPut(raw.exercises)
      await db.workouts.bulkPut(raw.workouts)
      await db.workoutExercises.bulkPut(raw.workoutExercises)
      await db.sets.bulkPut(raw.sets)
    },
  )
  return { exercises: raw.exercises.length, workouts: raw.workouts.length }
}

export async function clearAllData(): Promise<void> {
  await db.transaction(
    'rw',
    [db.exercises, db.workouts, db.workoutExercises, db.sets],
    async () => {
      await Promise.all([
        db.exercises.clear(),
        db.workouts.clear(),
        db.workoutExercises.clear(),
        db.sets.clear(),
      ])
    },
  )
}

/** Ask the browser to keep our IndexedDB data persistent (reduces eviction). */
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage?.persist) {
    return navigator.storage.persist()
  }
  return false
}
