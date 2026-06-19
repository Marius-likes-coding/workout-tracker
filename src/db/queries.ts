import { db, uid } from './db'
import type { Exercise, Workout, WorkoutSet } from './types'
import { todayISO, isoWeekKey } from '../utils/date'
import { totalVolume, topSetLoad, estimatedOneRepMax } from '../utils/volume'

function groupBy<T, K>(items: T[], key: (t: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>()
  for (const item of items) {
    const k = key(item)
    const arr = map.get(k)
    if (arr) arr.push(item)
    else map.set(k, [item])
  }
  return map
}

// ---------------------------------------------------------------------------
// Exercises & autocomplete
// ---------------------------------------------------------------------------

export async function findOrCreateExercise(rawName: string): Promise<Exercise> {
  const name = rawName.trim()
  const nameLower = name.toLowerCase()
  const existing = await db.exercises.where('nameLower').equals(nameLower).first()
  if (existing) return existing
  const ex: Exercise = {
    id: uid(),
    name,
    nameLower,
    useCount: 0,
    lastUsedAt: 0,
    createdAt: Date.now(),
  }
  await db.exercises.add(ex)
  return ex
}

/** Google-style suggestions ranked by usage, with prefix matches first. */
export async function suggestExercises(query: string, limit = 8): Promise<Exercise[]> {
  const q = query.trim().toLowerCase()
  const all = await db.exercises.toArray()
  const matched = q ? all.filter((e) => e.nameLower.includes(q)) : all
  return matched
    .sort((a, b) => {
      if (q) {
        const ap = a.nameLower.startsWith(q) ? 0 : 1
        const bp = b.nameLower.startsWith(q) ? 0 : 1
        if (ap !== bp) return ap - bp
      }
      return (
        b.useCount - a.useCount ||
        b.lastUsedAt - a.lastUsedAt ||
        a.name.localeCompare(b.name)
      )
    })
    .slice(0, limit)
}

// ---------------------------------------------------------------------------
// Workouts (sessions)
// ---------------------------------------------------------------------------

export async function createBlankWorkout(): Promise<string> {
  const now = Date.now()
  const w: Workout = { id: uid(), date: todayISO(), createdAt: now, updatedAt: now }
  await db.workouts.add(w)
  return w.id
}

/** Clone a previous workout into a fresh draft dated today (values editable). */
export async function cloneWorkout(sourceId: string): Promise<string> {
  return db.transaction(
    'rw',
    [db.workouts, db.workoutExercises, db.sets, db.exercises],
    async () => {
      const src = await db.workouts.get(sourceId)
      if (!src) throw new Error('Workout not found')
      const now = Date.now()
      const newId = uid()
      await db.workouts.add({
        id: newId,
        date: todayISO(),
        name: src.name,
        notes: src.notes,
        createdAt: now,
        updatedAt: now,
      })
      const wes = await db.workoutExercises
        .where('workoutId')
        .equals(sourceId)
        .sortBy('order')
      for (const we of wes) {
        const newWeId = uid()
        await db.workoutExercises.add({
          id: newWeId,
          workoutId: newId,
          exerciseId: we.exerciseId,
          order: we.order,
        })
        const ex = await db.exercises.get(we.exerciseId)
        if (ex) await db.exercises.update(ex.id, { useCount: ex.useCount + 1, lastUsedAt: now })
        const sets = await db.sets
          .where('workoutExerciseId')
          .equals(we.id)
          .sortBy('order')
        for (const s of sets) {
          await db.sets.add({
            id: uid(),
            workoutExerciseId: newWeId,
            order: s.order,
            weightKg: s.weightKg,
            reps: s.reps,
          })
        }
      }
      return newId
    },
  )
}

export async function updateWorkout(
  id: string,
  patch: Partial<Pick<Workout, 'name' | 'notes' | 'date'>>,
): Promise<void> {
  await db.workouts.update(id, { ...patch, updatedAt: Date.now() })
}

export async function touchWorkout(id: string): Promise<void> {
  await db.workouts.update(id, { updatedAt: Date.now() })
}

export async function deleteWorkout(id: string): Promise<void> {
  await db.transaction('rw', [db.workouts, db.workoutExercises, db.sets], async () => {
    const weIds = (
      await db.workoutExercises.where('workoutId').equals(id).toArray()
    ).map((w) => w.id)
    await db.sets.where('workoutExerciseId').anyOf(weIds).delete()
    await db.workoutExercises.where('workoutId').equals(id).delete()
    await db.workouts.delete(id)
  })
}

// ---------------------------------------------------------------------------
// Exercises within a workout
// ---------------------------------------------------------------------------

export async function addExerciseToWorkout(
  workoutId: string,
  name: string,
): Promise<string> {
  return db.transaction(
    'rw',
    [db.exercises, db.workoutExercises, db.sets, db.workouts],
    async () => {
      const ex = await findOrCreateExercise(name)
      await db.exercises.update(ex.id, { useCount: ex.useCount + 1, lastUsedAt: Date.now() })
      const count = await db.workoutExercises.where('workoutId').equals(workoutId).count()
      const weId = uid()
      await db.workoutExercises.add({
        id: weId,
        workoutId,
        exerciseId: ex.id,
        order: count,
      })
      // start with one blank set so the user can type immediately
      await db.sets.add({ id: uid(), workoutExerciseId: weId, order: 0, weightKg: 0, reps: 0 })
      await touchWorkout(workoutId)
      return weId
    },
  )
}

export async function removeWorkoutExercise(id: string): Promise<void> {
  await db.transaction('rw', [db.workoutExercises, db.sets], async () => {
    await db.sets.where('workoutExerciseId').equals(id).delete()
    await db.workoutExercises.delete(id)
  })
}

/** Move an exercise up (-1) or down (+1) within its workout. */
export async function moveWorkoutExercise(id: string, direction: -1 | 1): Promise<void> {
  const we = await db.workoutExercises.get(id)
  if (!we) return
  const siblings = await db.workoutExercises
    .where('workoutId')
    .equals(we.workoutId)
    .sortBy('order')
  const idx = siblings.findIndex((s) => s.id === id)
  const swapIdx = idx + direction
  if (swapIdx < 0 || swapIdx >= siblings.length) return
  const other = siblings[swapIdx]
  await db.transaction('rw', db.workoutExercises, async () => {
    await db.workoutExercises.update(we.id, { order: other.order })
    await db.workoutExercises.update(other.id, { order: we.order })
  })
}

// ---------------------------------------------------------------------------
// Sets
// ---------------------------------------------------------------------------

export async function addSet(workoutExerciseId: string): Promise<string> {
  const existing = await db.sets
    .where('workoutExerciseId')
    .equals(workoutExerciseId)
    .sortBy('order')
  const last = existing[existing.length - 1]
  const newSet: WorkoutSet = {
    id: uid(),
    workoutExerciseId,
    order: existing.length,
    weightKg: last?.weightKg ?? 0, // prefill from previous set for fast logging
    reps: last?.reps ?? 0,
  }
  await db.sets.add(newSet)
  return newSet.id
}

export async function updateSet(
  id: string,
  patch: Partial<Pick<WorkoutSet, 'weightKg' | 'reps'>>,
): Promise<void> {
  await db.sets.update(id, patch)
}

export async function removeSet(id: string): Promise<void> {
  await db.sets.delete(id)
}

// ---------------------------------------------------------------------------
// Aggregations for lists & charts
// ---------------------------------------------------------------------------

export interface WorkoutSummary extends Workout {
  volume: number
  exerciseCount: number
  setCount: number
}

export async function getWorkoutSummaries(): Promise<WorkoutSummary[]> {
  const [workouts, wes, sets] = await Promise.all([
    db.workouts.toArray(),
    db.workoutExercises.toArray(),
    db.sets.toArray(),
  ])
  const setsByWe = groupBy(sets, (s) => s.workoutExerciseId)
  const wesByWorkout = groupBy(wes, (w) => w.workoutId)
  return workouts
    .map((w) => {
      const myWes = wesByWorkout.get(w.id) ?? []
      let volume = 0
      let setCount = 0
      for (const we of myWes) {
        const ss = setsByWe.get(we.id) ?? []
        volume += totalVolume(ss)
        setCount += ss.length
      }
      return { ...w, volume, exerciseCount: myWes.length, setCount }
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
}

export interface VolumePoint {
  date: string
  label: string
  volume: number
}

/** Total workout volume per session, chronological. */
export async function getVolumeSeries(): Promise<VolumePoint[]> {
  const summaries = await getWorkoutSummaries()
  return summaries
    .filter((w) => w.setCount > 0)
    .map((w) => ({ date: w.date, label: w.name || w.date, volume: w.volume }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export interface WeeklyPoint {
  week: string
  volume: number
}

/** Total volume bucketed by ISO week, chronological. */
export async function getWeeklySeries(): Promise<WeeklyPoint[]> {
  const summaries = await getWorkoutSummaries()
  const byWeek = new Map<string, number>()
  for (const w of summaries) {
    if (w.setCount === 0) continue
    const key = isoWeekKey(w.date)
    byWeek.set(key, (byWeek.get(key) ?? 0) + w.volume)
  }
  return [...byWeek.entries()]
    .map(([week, volume]) => ({ week, volume }))
    .sort((a, b) => a.week.localeCompare(b.week))
}

export interface ExerciseProgressPoint {
  date: string
  topLoad: number
  volume: number
  e1rm: number
}

/** Per-session progress for one exercise (top load, volume, est. 1RM). */
export async function getExerciseProgress(
  exerciseId: string,
): Promise<ExerciseProgressPoint[]> {
  const wes = await db.workoutExercises.where('exerciseId').equals(exerciseId).toArray()
  if (wes.length === 0) return []
  const weIds = wes.map((w) => w.id)
  const sets = await db.sets.where('workoutExerciseId').anyOf(weIds).toArray()
  const weToWorkout = new Map(wes.map((w) => [w.id, w.workoutId]))
  const workoutIds = [...new Set(wes.map((w) => w.workoutId))]
  const workouts = await db.workouts.bulkGet(workoutIds)
  const dateByWorkout = new Map(
    workouts.filter((w): w is Workout => !!w).map((w) => [w.id, w.date]),
  )
  const setsByWorkout = groupBy(sets, (s) => weToWorkout.get(s.workoutExerciseId)!)
  const points: ExerciseProgressPoint[] = []
  for (const [workoutId, ss] of setsByWorkout) {
    const date = dateByWorkout.get(workoutId)
    if (!date || ss.length === 0) continue
    points.push({
      date,
      topLoad: topSetLoad(ss),
      volume: totalVolume(ss),
      e1rm: estimatedOneRepMax(ss),
    })
  }
  return points.sort((a, b) => a.date.localeCompare(b.date))
}

/** Exercises that appear in at least one workout, most-used first. */
export async function getTrackedExercises(): Promise<Exercise[]> {
  const [exercises, wes] = await Promise.all([
    db.exercises.toArray(),
    db.workoutExercises.toArray(),
  ])
  const used = new Set(wes.map((w) => w.exerciseId))
  return exercises
    .filter((e) => used.has(e.id))
    .sort((a, b) => b.useCount - a.useCount || a.name.localeCompare(b.name))
}
