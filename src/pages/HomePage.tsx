import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router-dom'
import {
  getWorkoutSummaries,
  createBlankWorkout,
  cloneWorkout,
  deleteWorkout,
} from '../db/queries'
import { formatDate } from '../utils/date'
import { formatVolume } from '../utils/volume'

export default function HomePage() {
  const summaries = useLiveQuery(getWorkoutSummaries, [], undefined)
  const navigate = useNavigate()

  async function newBlank() {
    const id = await createBlankWorkout()
    navigate(`/workout/${id}`)
  }

  async function draftFrom(id: string) {
    const newId = await cloneWorkout(id)
    navigate(`/workout/${newId}`)
  }

  async function remove(id: string) {
    if (confirm('Delete this workout? This cannot be undone.')) {
      await deleteWorkout(id)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>🏋️ Workouts</h1>
      </div>

      <button className="btn btn-primary btn-block" onClick={newBlank}>
        + New blank workout
      </button>

      {summaries && summaries.length > 0 && (
        <p className="subtitle" style={{ margin: '20px 4px 8px' }}>
          Tap a workout to view or continue it, or start a new draft from it.
        </p>
      )}

      {summaries === undefined && <p className="empty">Loading…</p>}

      {summaries && summaries.length === 0 && (
        <div className="empty">
          No workouts yet.
          <br />
          Create your first one above to start logging sets.
        </div>
      )}

      {summaries?.map((w) => (
        <div className="card" key={w.id}>
          <Link to={`/workout/${w.id}`} className="card-row">
            <div>
              <div style={{ fontWeight: 600 }}>{w.name || formatDate(w.date)}</div>
              <div className="subtitle">
                {formatDate(w.date)} · {w.exerciseCount}{' '}
                {w.exerciseCount === 1 ? 'exercise' : 'exercises'} · {w.setCount}{' '}
                {w.setCount === 1 ? 'set' : 'sets'}
              </div>
            </div>
            <span className="pill">{formatVolume(w.volume)}</span>
          </Link>
          <div className="row-gap" style={{ marginTop: 12 }}>
            <button className="btn btn-sm" onClick={() => draftFrom(w.id)}>
              Use as draft →
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => remove(w.id)}
              aria-label="Delete workout"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
