import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import {
  addSet,
  removeWorkoutExercise,
  moveWorkoutExercise,
} from '../db/queries'
import type { WorkoutExercise } from '../db/types'
import { totalVolume, formatVolume } from '../utils/volume'
import SetRow from './SetRow'

interface Props {
  we: WorkoutExercise
  isFirst: boolean
  isLast: boolean
}

export default function ExerciseCard({ we, isFirst, isLast }: Props) {
  const exercise = useLiveQuery(() => db.exercises.get(we.exerciseId), [we.exerciseId])
  const sets = useLiveQuery(
    () => db.sets.where('workoutExerciseId').equals(we.id).sortBy('order'),
    [we.id],
    [],
  )

  const volume = totalVolume(sets)

  async function remove() {
    if (confirm(`Remove ${exercise?.name ?? 'this exercise'} from the workout?`)) {
      await removeWorkoutExercise(we.id)
    }
  }

  return (
    <div className="card">
      <div className="card-row">
        <div>
          <div style={{ fontWeight: 600 }}>{exercise?.name ?? '…'}</div>
          <div className="subtitle">{formatVolume(volume)} volume</div>
        </div>
        <div className="row-gap">
          <button
            className="btn-icon"
            disabled={isFirst}
            onClick={() => moveWorkoutExercise(we.id, -1)}
            aria-label="Move up"
            style={{ opacity: isFirst ? 0.3 : 1 }}
          >
            ↑
          </button>
          <button
            className="btn-icon"
            disabled={isLast}
            onClick={() => moveWorkoutExercise(we.id, 1)}
            aria-label="Move down"
            style={{ opacity: isLast ? 0.3 : 1 }}
          >
            ↓
          </button>
          <button className="btn-icon btn-danger" onClick={remove} aria-label="Remove exercise">
            🗑
          </button>
        </div>
      </div>

      <div className="set-grid" style={{ marginTop: 12 }}>
        <div className="set-head" style={{ textAlign: 'center' }}>
          #
        </div>
        <div className="set-head" style={{ textAlign: 'center' }}>
          kg
        </div>
        <div className="set-head" style={{ textAlign: 'center' }}>
          reps
        </div>
        <div />
      </div>

      {sets.map((s, i) => (
        <SetRow key={s.id} set={s} index={i} />
      ))}

      <button
        className="btn btn-sm btn-block"
        style={{ marginTop: 10 }}
        onClick={() => addSet(we.id)}
      >
        + Add set
      </button>
    </div>
  )
}
