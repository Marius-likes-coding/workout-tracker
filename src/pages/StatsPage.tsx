import { useLiveQuery } from 'dexie-react-hooks'
import { getVolumeSeries, getWeeklySeries } from '../db/queries'
import { formatShortDate, formatWeek, isoWeekKey, todayISO } from '../utils/date'
import { formatVolume } from '../utils/volume'
import { LineChartCard, BarChartCard } from '../components/Charts'

export default function StatsPage() {
  const series = useLiveQuery(getVolumeSeries, [], undefined)
  const weekly = useLiveQuery(getWeeklySeries, [], [])

  if (series === undefined) {
    return <div className="page empty">Loading…</div>
  }

  const totalVol = series.reduce((s, p) => s + p.volume, 0)
  const sessions = series.length
  const avg = sessions ? totalVol / sessions : 0
  const thisWeekKey = isoWeekKey(todayISO())
  const thisWeek = weekly.find((w) => w.week === thisWeekKey)?.volume ?? 0

  if (sessions === 0) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>📊 Stats</h1>
        </div>
        <div className="empty">
          Log a few workouts to see your total and weekly volume trends here.
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>📊 Stats</h1>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="value">{sessions}</div>
          <div className="label">Workouts logged</div>
        </div>
        <div className="stat">
          <div className="value">{formatVolume(totalVol)}</div>
          <div className="label">All-time volume</div>
        </div>
        <div className="stat">
          <div className="value">{formatVolume(thisWeek)}</div>
          <div className="label">This week</div>
        </div>
        <div className="stat">
          <div className="value">{formatVolume(avg)}</div>
          <div className="label">Avg / workout</div>
        </div>
      </div>

      <LineChartCard
        title="Total volume per workout"
        seriesName="Volume"
        data={series}
        xKey="date"
        yKey="volume"
        unit=" kg"
        xFormatter={formatShortDate}
      />
      <BarChartCard
        title="Weekly volume"
        seriesName="Volume"
        data={weekly}
        xKey="week"
        yKey="volume"
        color="#818cf8"
        unit=" kg"
        xFormatter={formatWeek}
      />
    </div>
  )
}
