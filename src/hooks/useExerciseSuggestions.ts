import { useLiveQuery } from 'dexie-react-hooks'
import { suggestExercises } from '../db/queries'
import type { Exercise } from '../db/types'

/** Live, usage-ranked exercise suggestions for the given query. */
export function useExerciseSuggestions(query: string, limit = 8): Exercise[] {
  return useLiveQuery(() => suggestExercises(query, limit), [query, limit], [])
}
