import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getTrackedExercises, getExerciseProgress } from '../db/queries'
import { formatShortDate } from '../utils/date'
import { LineChartCard } from '../components/Charts'

export default function ExerciseProgressPage() {
  const exercises = useLiveQuery(getTrackedExercises, [], undefined)
  const [selected, setSelected] = useState<string>('')

  // Default to the most-used exercise once data loads.
  useEffect(() => {
    if (!selected && exercises && exercises.length > 0) {
      setSelected(exercises[0].id)
    }
  }, [exercises, selected])

  const progress = useLiveQuery(
    () => (selected ? getExerciseProgress(selected) : Promise.resolve([])),
    [selected],
    [],
  )

  if (exercises === undefined) {
    return <div className="page empty">Loading…</div>
  }
  if (exercises.length === 0) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>📈 Progress</h1>
        </div>
        <div className="empty">
          Log some workouts first, then come back to see your progress per exercise.
        </div>
      </div>
    )
  }

  const bestLoad = progress.reduce((m, p) => Math.max(m, p.topLoad), 0)
  const bestVolume = progress.reduce((m, p) => Math.max(m, p.volume), 0)

  return (
    <div className="page">
      <div className="page-header">
        <h1>📈 Progress</h1>
      </div>

      <select
        className="select"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        style={{ marginBottom: 16 }}
      >
        {exercises.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.name}
          </option>
        ))}
      </select>

      <div className="stat-grid">
        <div className="stat">
          <div className="value">{bestLoad} kg</div>
          <div className="label">Best set load</div>
        </div>
        <div className="stat">
          <div className="value">{progress.length}</div>
          <div className="label">Sessions</div>
        </div>
      </div>

      <LineChartCard
        title="Top set load over time"
        seriesName="Top load"
        data={progress}
        xKey="date"
        yKey="topLoad"
        unit=" kg"
        xFormatter={formatShortDate}
      />
      <LineChartCard
        title="Volume over time"
        seriesName="Volume"
        data={progress}
        xKey="date"
        yKey="volume"
        color="#4ade80"
        unit=" kg"
        xFormatter={formatShortDate}
      />
      <LineChartCard
        title="Estimated 1RM (Epley)"
        seriesName="Est. 1RM"
        data={progress}
        xKey="date"
        yKey="e1rm"
        color="#fbbf24"
        unit=" kg"
        xFormatter={formatShortDate}
      />
      <p className="subtitle">Best single-session volume: {Math.round(bestVolume).toLocaleString()} kg</p>
    </div>
  )
}
