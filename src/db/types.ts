// Core data model for the workout tracker. All ids are uuid strings.

export interface Exercise {
  id: string
  name: string // display name, e.g. "Barbell Bench Press"
  nameLower: string // lowercased, for case-insensitive search/autocomplete
  useCount: number // how many times added to a workout (ranks suggestions)
  lastUsedAt: number // epoch ms, tie-breaker for suggestions
  createdAt: number
}

/** A single training session. The "draft" being edited is just a Workout. */
export interface Workout {
  id: string
  date: string // ISO date 'YYYY-MM-DD' (the day of the session)
  name?: string
  notes?: string
  createdAt: number
  updatedAt: number
}

/** An exercise placed into a workout, preserving order within the session. */
export interface WorkoutExercise {
  id: string
  workoutId: string
  exerciseId: string
  order: number
}

/** One logged set: a load in kg and a rep count. */
export interface WorkoutSet {
  id: string
  workoutExerciseId: string
  order: number
  weightKg: number
  reps: number
}
