import { useMemo, useState } from 'react'
import { ArrowDownIcon } from './icons'
import './AttendanceCalendar.css'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// All dates here are plain YYYY-MM-DD strings with no time component, so
// every Date built from one is deliberately constructed and read in UTC —
// mixing in the browser's local timezone would shift a date parsed near
// midnight onto the wrong calendar day.
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

// A month grid: leading/trailing nulls pad the first and last week out to
// full 7-day rows, so the grid always renders complete rows.
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
 * A month-view calendar for picking an attendance date, with days that
 * already have a recorded attendance highlighted green — consecutive
 * recorded days in the same week merge into one continuous bar instead of
 * separate pills, so a run of taught days reads as a single group at a
 * glance.
 */
export default function AttendanceCalendar({ selectedDate, recordedDates, maxDate, onSelectDate }) {
  const recordedSet = useMemo(() => new Set(recordedDates), [recordedDates])
  const selected = parseDateUTC(selectedDate)
  const max = maxDate ? parseDateUTC(maxDate) : null

  const [viewYear, setViewYear] = useState(selected.getUTCFullYear())
  const [viewMonth, setViewMonth] = useState(selected.getUTCMonth())

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
    <div className="attendance-calendar">
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
          if (!dateStr) return <span className="attendance-calendar-cell attendance-calendar-cell-blank" key={index} />

          const isRecorded = recordedSet.has(dateStr)
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === todayStr
          const isFuture = max !== null && parseDateUTC(dateStr) > max

          const dayOfWeek = index % 7
          const joinLeft = isRecorded && dayOfWeek > 0 && recordedSet.has(cells[index - 1])
          const joinRight = isRecorded && dayOfWeek < 6 && recordedSet.has(cells[index + 1])

          const classes = ['attendance-calendar-cell']
          if (isRecorded) classes.push('attendance-calendar-cell-recorded')
          if (joinLeft) classes.push('attendance-calendar-cell-join-left')
          if (joinRight) classes.push('attendance-calendar-cell-join-right')
          if (isSelected) classes.push('attendance-calendar-cell-selected')
          if (isToday) classes.push('attendance-calendar-cell-today')
          if (isFuture) classes.push('attendance-calendar-cell-future')

          return (
            <button
              type="button"
              className={classes.join(' ')}
              key={dateStr}
              disabled={isFuture}
              onClick={() => onSelectDate(dateStr)}
              aria-current={isSelected ? 'date' : undefined}
              aria-label={`${dateStr}${isRecorded ? ' — attendance recorded' : ''}`}
            >
              {parseDateUTC(dateStr).getUTCDate()}
            </button>
          )
        })}
      </div>

      <div className="attendance-calendar-legend">
        <span className="attendance-calendar-legend-item">
          <span className="attendance-calendar-legend-swatch attendance-calendar-legend-swatch-recorded" />
          Attendance recorded
        </span>
      </div>
    </div>
  )
}
