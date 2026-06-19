import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useParams } from 'react-router-dom'
import { db } from '../db/db'
import { addExerciseToWorkout, updateWorkout } from '../db/queries'
import { totalVolume, formatVolume } from '../utils/volume'
import ExerciseCard from '../components/ExerciseCard'
import ExerciseAutocomplete from '../components/ExerciseAutocomplete'

export default function WorkoutEditorPage() {
  const { id = '' } = useParams()

  const workout = useLiveQuery(
    () => db.workouts.get(id).then((w) => w ?? null),
    [id],
    undefined,
  )
  const exercises = useLiveQuery(
    () => db.workoutExercises.where('workoutId').equals(id).sortBy('order'),
    [id],
    [],
  )
  const total = useLiveQuery(
    async () => {
      const wes = await db.workoutExercises.where('workoutId').equals(id).toArray()
      const sets = await db.sets
        .where('workoutExerciseId')
        .anyOf(wes.map((w) => w.id))
        .toArray()
      return totalVolume(sets)
    },
    [id],
    0,
  )

  if (workout === undefined) {
    return <div className="page empty">Loading…</div>
  }
  if (workout === null) {
    return (
      <div className="page empty">
        Workout not found. <Link to="/">Back to workouts</Link>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/" className="btn-icon" aria-label="Back">
          ←
        </Link>
        <h1 style={{ fontSize: '1.25rem' }}>Edit workout</h1>
        <span className="pill" style={{ marginLeft: 'auto' }}>
          {formatVolume(total)}
        </span>
      </div>

      <div className="card">
        <input
          className="input"
          placeholder="Workout name (optional)"
          defaultValue={workout.name ?? ''}
          onChange={(e) => updateWorkout(id, { name: e.target.value })}
          style={{ marginBottom: 10 }}
        />
        <input
          className="input"
          type="date"
          defaultValue={workout.date}
          onChange={(e) => e.target.value && updateWorkout(id, { date: e.target.value })}
        />
      </div>

      {exercises.map((we, i) => (
        <ExerciseCard
          key={we.id}
          we={we}
          isFirst={i === 0}
          isLast={i === exercises.length - 1}
        />
      ))}

      {exercises.length === 0 && (
        <p className="subtitle" style={{ textAlign: 'center', margin: '12px 0' }}>
          No exercises yet — add your first one below.
        </p>
      )}

      <div className="card">
        <div className="set-head" style={{ marginBottom: 8 }}>
          Add exercise
        </div>
        <ExerciseAutocomplete onSelect={(name) => addExerciseToWorkout(id, name)} />
      </div>
    </div>
  )
}
