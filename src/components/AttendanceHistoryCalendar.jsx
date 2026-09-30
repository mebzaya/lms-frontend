import { useMemo, useState } from 'react'
import { ArrowDownIcon } from './icons'
import './AttendanceHistoryCalendar.css'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Same UTC-safe date handling as AttendanceCalendar.jsx — every date here is
// a plain YYYY-MM-DD string with no time component, so it's always built and
// read in UTC to avoid shifting onto the wrong calendar day.
function parseDateUTC(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function toDateStr(date) {
  return date.toISOString().slice(0, 10)
}

function monthLabel(year, month) {
  return new Date(Date.UTC(year, month, 1)).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  })
}

function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(Date.UTC(year, month, 1))
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const leadingBlanks = firstOfMonth.getUTCDay()

  const cells = []
  for (let i = 0; i < leadingBlanks; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toDateStr(new Date(Date.UTC(year, month, day))))
  }
  while (cells.length % 7 !== 0) cells.push(null)

  return cells
}

/**
 * A read-only month-view calendar for reviewing a student's attendance
 * history: present days green, absent days red, un-recorded days plain.
 * Consecutive same-status days in the same week merge into one rounded-rect
 * group instead of separate pills, mirroring AttendanceCalendar.jsx's
 * "recorded day" highlight.
 */
export default function AttendanceHistoryCalendar({ records }) {
  const statusByDate = useMemo(() => new Map(records.map((r) => [r.date, r.status])), [records])

  const initial = records.length > 0 ? parseDateUTC(records[0].date) : new Date()
  const [viewYear, setViewYear] = useState(initial.getUTCFullYear())
  const [viewMonth, setViewMonth] = useState(initial.getUTCMonth())

  const cells = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])
  const todayStr = toDateStr(new Date())

  function goToPrevMonth() {
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1)
        return 11
      }
      return prev - 1
    })
  }

  function goToNextMonth() {
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1)
        return 0
      }
      return prev + 1
    })
  }

  return (
    <div className="attendance-history-calendar">
      <div className="attendance-calendar-header">
        <button type="button" className="attendance-calendar-nav" onClick={goToPrevMonth} aria-label="Previous month">
          <span className="attendance-calendar-nav-arrow attendance-calendar-nav-prev">
            <ArrowDownIcon />
          </span>
        </button>
        <span className="attendance-calendar-month-label">{monthLabel(viewYear, viewMonth)}</span>
        <button type="button" className="attendance-calendar-nav" onClick={goToNextMonth} aria-label="Next month">
          <span className="attendance-calendar-nav-arrow attendance-calendar-nav-next">
            <ArrowDownIcon />
          </span>
        </button>
      </div>

      <div className="attendance-calendar-weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="attendance-calendar-grid">
        {cells.map((dateStr, index) => {
          if (!dateStr) return <span className="attendance-history-cell attendance-history-cell-blank" key={index} />

          const status = statusByDate.get(dateStr)
          const isToday = dateStr === todayStr

          const dayOfWeek = index % 7
          const joinLeft = status && dayOfWeek > 0 && statusByDate.get(cells[index - 1]) === status
          const joinRight = status && dayOfWeek < 6 && statusByDate.get(cells[index + 1]) === status

          const classes = ['attendance-history-cell']
          if (status) classes.push(`attendance-history-cell-${status}`)
          if (joinLeft) classes.push('attendance-history-cell-join-left')
          if (joinRight) classes.push('attendance-history-cell-join-right')
          if (isToday) classes.push('attendance-history-cell-today')

          return (
            <span
              className={classes.join(' ')}
              key={dateStr}
              aria-label={`${dateStr}${status ? ` — ${status}` : ''}`}
            >
              {parseDateUTC(dateStr).getUTCDate()}
            </span>
          )
        })}
      </div>

      <div className="attendance-calendar-legend">
        <span className="attendance-calendar-legend-item">
          <span className="attendance-calendar-legend-swatch attendance-history-legend-swatch-present" />
          Present
        </span>
        <span className="attendance-calendar-legend-item">
          <span className="attendance-calendar-legend-swatch attendance-history-legend-swatch-absent" />
          Absent
        </span>
        <span className="attendance-calendar-legend-item">
          <span className="attendance-calendar-legend-swatch attendance-history-legend-swatch-none" />
          Not recorded
        </span>
      </div>
    </div>
  )
}
