import Dexie, { type Table } from 'dexie'
import type { Exercise, Workout, WorkoutExercise, WorkoutSet } from './types'

export class WorkoutDB extends Dexie {
  exercises!: Table<Exercise, string>
  workouts!: Table<Workout, string>
  workoutExercises!: Table<WorkoutExercise, string>
  sets!: Table<WorkoutSet, string>

  constructor() {
    super('workout-tracker')
    this.version(1).stores({
      // Primary key first, then secondary indexes used for lookups/sorting.
      exercises: 'id, nameLower, useCount, lastUsedAt',
      workouts: 'id, date, createdAt',
      workoutExercises: 'id, workoutId, exerciseId, [workoutId+order]',
      sets: 'id, workoutExerciseId, [workoutExerciseId+order]',
    })
  }
}

export const db = new WorkoutDB()

/** Stable uuid that works in all browsers (crypto.randomUUID where available). */
export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
