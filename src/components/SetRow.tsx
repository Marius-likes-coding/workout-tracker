import { useState } from 'react'
import { updateSet, removeSet } from '../db/queries'
import type { WorkoutSet } from '../db/types'

interface Props {
  set: WorkoutSet
  index: number
}

/**
 * One editable set row (load kg + reps). Local state keeps the input fluid;
 * every change is written straight to IndexedDB (no explicit save needed).
 * Parent renders this with key={set.id} so state re-inits per set.
 */
export default function SetRow({ set, index }: Props) {
  const [weight, setWeight] = useState(set.weightKg ? String(set.weightKg) : '')
  const [reps, setReps] = useState(set.reps ? String(set.reps) : '')

  function onWeight(v: string) {
    setWeight(v)
    const n = parseFloat(v)
    updateSet(set.id, { weightKg: Number.isFinite(n) ? n : 0 })
  }

  function onReps(v: string) {
    setReps(v)
    const n = parseInt(v, 10)
    updateSet(set.id, { reps: Number.isFinite(n) ? n : 0 })
  }

  return (
    <div className="set-grid">
      <div className="set-label">{index + 1}</div>
      <input
        className="num-input"
        type="number"
        inputMode="decimal"
        placeholder="0"
        min="0"
        step="0.5"
        value={weight}
        onChange={(e) => onWeight(e.target.value)}
        aria-label={`Set ${index + 1} weight in kg`}
      />
      <input
        className="num-input"
        type="number"
        inputMode="numeric"
        placeholder="0"
        min="0"
        step="1"
        value={reps}
        onChange={(e) => onReps(e.target.value)}
        aria-label={`Set ${index + 1} reps`}
      />
      <button
        className="btn-icon"
        onClick={() => removeSet(set.id)}
        aria-label={`Remove set ${index + 1}`}
      >
        ✕
      </button>
    </div>
  )
}
