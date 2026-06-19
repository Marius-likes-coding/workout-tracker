// Date helpers. Workout dates are stored as 'YYYY-MM-DD' strings.

/** Today's local date as 'YYYY-MM-DD'. */
export function todayISO(): string {
  const d = new Date()
  return toISODate(d)
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseISO(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Human-friendly date label, e.g. "Mon 19 Jun 2026". */
export function formatDate(date: string): string {
  return parseISO(date).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Compact date label for chart axes, e.g. "19 Jun". */
export function formatShortDate(date: string): string {
  return parseISO(date).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  })
}

/**
 * ISO-8601 week key 'YYYY-Www' (weeks start Monday). Used to bucket weekly
 * volume. Returns e.g. '2026-W25'.
 */
export function isoWeekKey(date: string): string {
  const d = parseISO(date)
  // Shift to Thursday of the current week to get the ISO week-year right.
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dayNr = (target.getDay() + 6) % 7 // Mon=0 .. Sun=6
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const firstDayNr = (firstThursday.getDay() + 6) % 7
  firstThursday.setDate(firstThursday.getDate() - firstDayNr + 3)
  const week =
    1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86400000))
  return `${target.getFullYear()}-W${String(week).padStart(2, '0')}`
}

/** Short label for a week key, e.g. "W25 '26". */
export function formatWeek(key: string): string {
  const [year, w] = key.split('-W')
  return `${w} '${year.slice(2)}`
}
