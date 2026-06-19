import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

const AXIS = '#94a3b8'
const GRID = '#334155'
const ACCENT = '#38bdf8'

function compact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return String(Math.round(n))
}

const tooltipStyle = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 8,
  color: '#e2e8f0',
  fontSize: 13,
}

interface SeriesProps {
  title: string
  // Recharts consumes plain row objects; our typed series arrays satisfy this.
  data: unknown[]
  xKey: string
  yKey: string
  /** Label shown in the tooltip (defaults to the title). */
  seriesName?: string
  color?: string
  unit?: string
  xFormatter?: (v: string) => string
}

export function LineChartCard({
  title,
  data,
  xKey,
  yKey,
  seriesName,
  color = ACCENT,
  unit = '',
  xFormatter,
}: SeriesProps) {
  if (data.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-title">{title}</div>
        <div className="empty">No data yet.</div>
      </div>
    )
  }
  return (
    <div className="chart-card">
      <div className="chart-title">{title}</div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
          <XAxis
            dataKey={xKey}
            stroke={AXIS}
            fontSize={11}
            tickFormatter={xFormatter}
            minTickGap={24}
          />
          <YAxis stroke={AXIS} fontSize={11} width={40} tickFormatter={compact} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(l) => (xFormatter ? xFormatter(String(l)) : String(l))}
            formatter={(v) => `${Math.round(Number(v)).toLocaleString()}${unit}`}
          />
          <Line
            name={seriesName ?? title}
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2.5}
            dot={{ r: 2.5, fill: color }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function BarChartCard({
  title,
  data,
  xKey,
  yKey,
  seriesName,
  color = ACCENT,
  unit = '',
  xFormatter,
}: SeriesProps) {
  if (data.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-title">{title}</div>
        <div className="empty">No data yet.</div>
      </div>
    )
  }
  return (
    <div className="chart-card">
      <div className="chart-title">{title}</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey={xKey}
            stroke={AXIS}
            fontSize={11}
            tickFormatter={xFormatter}
            minTickGap={8}
          />
          <YAxis stroke={AXIS} fontSize={11} width={40} tickFormatter={compact} />
          <Tooltip
            cursor={{ fill: 'rgba(148,163,184,0.12)' }}
            contentStyle={tooltipStyle}
            labelFormatter={(l) => (xFormatter ? xFormatter(String(l)) : String(l))}
            formatter={(v) => `${Math.round(Number(v)).toLocaleString()}${unit}`}
          />
          <Bar name={seriesName ?? title} dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
