import { useEffect, useRef, useState } from 'react'
import AttendanceCalendar from './AttendanceCalendar'
import { formatNepaliDate } from '../utils/nepaliDateTime'
import './AttendanceDatePicker.css'

/**
 * The compact date field a teacher/admin actually clicks — opens the
 * highlighted-days calendar as a dropdown right under it (like a native
 * date input's picker popup), instead of a calendar permanently taking up
 * page space. Picking a day, clicking outside, or pressing Escape closes it.
 */
export default function AttendanceDatePicker({ selectedDate, recordedDates, maxDate, onSelectDate }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function handleSelectDate(date) {
    onSelectDate(date)
    setIsOpen(false)
  }

  return (
    <div className="attendance-date-picker" ref={containerRef}>
      <label className="attendance-date-picker-label">Date</label>
      <button
        type="button"
        className="attendance-date-picker-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {formatNepaliDate(selectedDate)}
      </button>

      {isOpen && (
        <div className="attendance-date-picker-popover">
          <AttendanceCalendar
            selectedDate={selectedDate}
            recordedDates={recordedDates}
            maxDate={maxDate}
            onSelectDate={handleSelectDate}
          />
        </div>
      )}
    </div>
  )
}
