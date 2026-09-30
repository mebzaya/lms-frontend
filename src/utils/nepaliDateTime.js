const NEPAL_TIME_ZONE = 'Asia/Kathmandu'

// Nepal Standard Time has been a fixed UTC+5:45 offset (no daylight saving)
// since 1986, so a plain offset is safe here — unlike most timezones, it
// will never silently drift on us.
const NEPAL_OFFSET_MINUTES = 5 * 60 + 45

function nepaliParts(date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: NEPAL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  return Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]))
}

// A UTC instant (ISO string) -> the value a <input type="datetime-local">
// needs to display that instant as Nepal wall-clock time. datetime-local
// has no timezone concept of its own — it just shows/returns digits — so
// this and fromNepaliInputValue are the only two places that convert
// between Nepal time and an absolute instant; every other place should just
// pass ISO strings straight through.
export function toNepaliInputValue(isoString) {
  if (!isoString) return ''
  const p = nepaliParts(new Date(isoString))
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

// The reverse: a <input type="datetime-local"> value, entered by the
// teacher meaning Nepal time, -> a proper UTC ISO instant to send to the
// backend.
export function fromNepaliInputValue(localValue) {
  if (!localValue) return ''
  const [datePart, timePart] = localValue.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  const utcMillis = Date.UTC(year, month - 1, day, hour, minute) - NEPAL_OFFSET_MINUTES * 60 * 1000
  return new Date(utcMillis).toISOString()
}

// Today's date in Nepal time, as a plain YYYY-MM-DD string — what a
// <input type="date"> needs, and what the backend's date-only attendance
// columns are compared against.
export function todayNepaliDate() {
  const p = nepaliParts(new Date())
  return `${p.year}-${p.month}-${p.day}`
}

// A YYYY-MM-DD date string (no time component, so no timezone conversion
// needed) -> a human-readable display like "Sep 29, 2026".
export function formatNepaliDate(dateString) {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Human-readable display, always in Nepal time regardless of the viewing
// device's own timezone setting.
export function formatNepaliDateTime(isoString) {
  if (!isoString) return ''
  return `${new Date(isoString).toLocaleString('en-US', {
    timeZone: NEPAL_TIME_ZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })} NPT`
}
