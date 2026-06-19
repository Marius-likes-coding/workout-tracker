import type { WorkoutSet } from '../db/types'

/** Volume of one set = load × reps (kg). */
export function setVolume(s: Pick<WorkoutSet, 'weightKg' | 'reps'>): number {
  return s.weightKg * s.reps
}

/** Total volume across a collection of sets. */
export function totalVolume(sets: Pick<WorkoutSet, 'weightKg' | 'reps'>[]): number {
  return sets.reduce((sum, s) => sum + setVolume(s), 0)
}

/** Heaviest load among a collection of sets (kg). */
export function topSetLoad(sets: Pick<WorkoutSet, 'weightKg'>[]): number {
  return sets.reduce((max, s) => Math.max(max, s.weightKg), 0)
}

/** Estimated 1RM via the Epley formula, using the best set. */
export function estimatedOneRepMax(
  sets: Pick<WorkoutSet, 'weightKg' | 'reps'>[],
): number {
  let best = 0
  for (const s of sets) {
    if (s.reps <= 0 || s.weightKg <= 0) continue
    const e1rm = s.weightKg * (1 + s.reps / 30)
    if (e1rm > best) best = e1rm
  }
  return Math.round(best * 10) / 10
}

/** Compact volume formatting, e.g. 12450 → "12,450 kg". */
export function formatVolume(kg: number): string {
  return `${Math.round(kg).toLocaleString()} kg`
}
