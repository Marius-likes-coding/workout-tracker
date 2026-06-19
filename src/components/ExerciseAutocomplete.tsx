import { useRef, useState, type KeyboardEvent } from 'react'
import { useExerciseSuggestions } from '../hooks/useExerciseSuggestions'

interface Props {
  onSelect: (name: string) => void
}

type Item = { type: 'existing' | 'create'; name: string; useCount: number }

/** Google-style exercise input: live suggestions + "create new" option. */
export default function ExerciseAutocomplete({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestions = useExerciseSuggestions(query)

  const trimmed = query.trim()
  const hasExact = suggestions.some((s) => s.nameLower === trimmed.toLowerCase())
  const items: Item[] = [
    ...suggestions.map((s) => ({
      type: 'existing' as const,
      name: s.name,
      useCount: s.useCount,
    })),
    ...(trimmed.length > 0 && !hasExact
      ? [{ type: 'create' as const, name: trimmed, useCount: 0 }]
      : []),
  ]

  function choose(name: string) {
    onSelect(name)
    setQuery('')
    setActive(0)
    setOpen(false)
    inputRef.current?.focus()
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((a) => Math.min(a + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const it = items[active]
      if (it) choose(it.name)
      else if (trimmed) choose(trimmed)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="combo">
      <input
        ref={inputRef}
        className="input"
        placeholder="Add exercise…"
        value={query}
        autoCapitalize="words"
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setActive(0)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
      />
      {open && items.length > 0 && (
        <div className="combo-list">
          {items.map((it, i) => (
            <div
              key={it.type + ':' + it.name}
              className={'combo-item' + (i === active ? ' active' : '')}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                choose(it.name)
              }}
            >
              {it.type === 'create' ? (
                <span className="create">+ Create “{it.name}”</span>
              ) : (
                <span>{it.name}</span>
              )}
              {it.type === 'existing' && it.useCount > 0 && (
                <span className="pill">{it.useCount}×</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
