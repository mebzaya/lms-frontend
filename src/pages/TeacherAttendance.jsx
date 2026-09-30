import { useMemo, useState } from 'react'
import {
  fetchAttendanceClasses,
  fetchAttendanceDates,
  fetchAttendanceRoster,
  fetchAttendanceSummary,
  saveAttendance,
} from '../api/attendance'
import AttendanceDatePicker from '../components/AttendanceDatePicker'
import { ClassesIcon } from '../components/icons'
import SortableHeader from '../components/SortableHeader'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import { sortRows } from '../utils/sortRows'
import { todayNepaliDate } from '../utils/nepaliDateTime'
import '../styles/common.css'
import './TeacherDashboard.css'
import './TeacherAttendance.css'

export default function TeacherAttendance() {
  const [classes, setClasses] = useState(null)
  const [selectedClassId, setSelectedClassId] = useState(null)
  const [error, setError] = useState('')

  useEffectDeduped(() => {
    fetchAttendanceClasses()
      .then(setClasses)
      .catch(() => setError('Could not load your classes right now.'))
  }, [])

  if (error) {
    return <p className="student-status auth-error">{error}</p>
  }

  if (!classes) {
    return <p className="student-status">Loading...</p>
  }

  if (classes.length === 0) {
    return <p className="student-status">You haven't been assigned any subjects yet.</p>
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null

  return (
    <div className="teacher-dashboard">
      {!selectedClass ? (
        <div>
          <p className="teacher-step-label">Choose a class</p>
          <div className="teacher-picker-grid">
            {classes.map((schoolClass) => (
              <button
                type="button"
                className="teacher-picker-card"
                key={schoolClass.id}
                onClick={() => setSelectedClassId(schoolClass.id)}
              >
                <span className="teacher-picker-icon">
                  <ClassesIcon />
                </span>
                <span className="teacher-picker-name">{schoolClass.name}</span>
                <span className="teacher-picker-meta">
                  {schoolClass.student_count} student{schoolClass.student_count === 1 ? '' : 's'}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ClassAttendance schoolClass={selectedClass} onBack={() => setSelectedClassId(null)} />
      )}
    </div>
  )
}

function ClassAttendance({ schoolClass, onBack }) {
  const [tab, setTab] = useState('mark')

  return (
    <div>
      <button type="button" className="teacher-back-link" onClick={onBack}>
        &larr; Classes
      </button>

      <div className="attendance-header">
        <h2 className="attendance-class-title">{schoolClass.name}</h2>
        <div className="attendance-tabs">
          <button
            type="button"
            className={`attendance-tab${tab === 'mark' ? ' attendance-tab-active' : ''}`}
            onClick={() => setTab('mark')}
          >
            Mark attendance
          </button>
          <button
            type="button"
            className={`attendance-tab${tab === 'report' ? ' attendance-tab-active' : ''}`}
            onClick={() => setTab('report')}
          >
            Report
          </button>
        </div>
      </div>

      {tab === 'mark' ? (
        <MarkAttendance classId={schoolClass.id} />
      ) : (
        <AttendanceReport classId={schoolClass.id} schoolClassName={schoolClass.name} />
      )}
    </div>
  )
}

function MarkAttendance({ classId }) {
  const [date, setDate] = useState(todayNepaliDate())
  const [recordedDates, setRecordedDates] = useState([])
  const [roster, setRoster] = useState(null)
  const [statuses, setStatuses] = useState({})
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffectDeduped(() => {
    fetchAttendanceDates(classId)
      .then(setRecordedDates)
      .catch(() => {})
  }, [classId])

  useEffectDeduped(() => {
    setRoster(null)
    setSuccessMessage('')
    fetchAttendanceRoster(classId, date)
      .then((data) => {
        setRoster(data.students)
        // Unmarked students default to present — a teacher only has to flip
        // the exceptions to absent, instead of clicking every single name.
        setStatuses(Object.fromEntries(data.students.map((s) => [s.student_id, s.status ?? 'present'])))
      })
      .catch(() => setError('Could not load this class’s roster.'))
  }, [classId, date])

  const presentCount = Object.values(statuses).filter((s) => s === 'present').length

  async function handleSave() {
    setIsSaving(true)
    setError('')
    setSuccessMessage('')
    try {
      const records = Object.entries(statuses).map(([studentId, status]) => ({
        student_id: Number(studentId),
        status,
      }))
      const data = await saveAttendance(classId, date, records)
      setRoster(data.students)
      setSuccessMessage('Attendance saved.')
      // This date is now recorded too — reflect it on the calendar right
      // away instead of waiting for the next full reload of this page.
      setRecordedDates((prev) => (prev.includes(date) ? prev : [...prev, date].sort()))
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not save attendance.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="attendance-mark">
      <AttendanceDatePicker
        selectedDate={date}
        recordedDates={recordedDates}
        maxDate={todayNepaliDate()}
        onSelectDate={setDate}
      />

      {error && <p className="auth-error">{error}</p>}
      {successMessage && <p className="form-success">{successMessage}</p>}

      {!roster ? (
        <p className="student-status">Loading...</p>
      ) : (
        <>
          <p className="attendance-summary-line">
            {presentCount} of {roster.length} marked present
          </p>
          <ul className="attendance-roster">
            {roster.map((student) => {
              const status = statuses[student.student_id]
              return (
                <li className="attendance-roster-row" key={student.student_id}>
                  <span className="attendance-student-name">{student.name}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={status === 'present'}
                    aria-label={`Mark ${student.name} ${status === 'present' ? 'absent' : 'present'}`}
                    className={`attendance-toggle attendance-toggle-${status}`}
                    onClick={() =>
                      setStatuses((prev) => ({
                        ...prev,
                        [student.student_id]: prev[student.student_id] === 'present' ? 'absent' : 'present',
                      }))
                    }
                  >
                    <span className="attendance-toggle-track">
                      <span className="attendance-toggle-thumb" />
                    </span>
                    <span className="attendance-toggle-label">{status === 'present' ? 'Present' : 'Absent'}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          <button type="button" className="auth-submit" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save attendance'}
          </button>
        </>
      )}
    </div>
  )
}

const REPORT_COLUMNS = {
  name: (s) => s.name,
  present_count: (s) => s.present_count,
  absent_count: (s) => s.absent_count,
  percentage: (s) => s.percentage,
}

function attendanceTier(percentage) {
  if (percentage === null) return 'none'
  if (percentage >= 90) return 'good'
  if (percentage >= 75) return 'okay'
  return 'low'
}

function AttendanceReport({ classId, schoolClassName }) {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [sortKey, setSortKey] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')

  useEffectDeduped(() => {
    fetchAttendanceSummary(classId)
      .then(setSummary)
      .catch(() => setError('Could not load the attendance report.'))
  }, [classId])

  const sortedStudents = useMemo(
    () => (summary && sortKey ? sortRows(summary.students, REPORT_COLUMNS[sortKey], sortDirection) : (summary?.students ?? [])),
    [summary, sortKey, sortDirection]
  )

  function handleSort(key) {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  if (error) {
    return <p className="auth-error">{error}</p>
  }

  if (!summary) {
    return <p className="student-status">Loading...</p>
  }

  const classAverage = summary.students.length
    ? Math.round(
        (summary.students.reduce((sum, s) => sum + (s.percentage ?? 0), 0) / summary.students.length) * 10
      ) / 10
    : null

  return (
    <div className="attendance-report">
      <div className="attendance-report-header">
        <h3 className="attendance-report-title">{schoolClassName} — Attendance Report</h3>
        <div className="attendance-report-stats">
          <span className="attendance-report-stat">
            <strong>{summary.total_days_recorded}</strong> day{summary.total_days_recorded === 1 ? '' : 's'} recorded
          </span>
          {classAverage !== null && (
            <span className="attendance-report-stat">
              <strong>{classAverage}%</strong> class average
            </span>
          )}
        </div>
      </div>

      {summary.total_days_recorded === 0 ? (
        <p className="student-status">No attendance has been recorded for this class yet.</p>
      ) : (
        <div className="user-table-wrap">
          <table className="user-table">
            <thead>
              <tr>
                <SortableHeader
                  label="Student"
                  sortKey="name"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Present"
                  sortKey="present_count"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Absent"
                  sortKey="absent_count"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Attendance"
                  sortKey="percentage"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onSort={handleSort}
                />
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((student) => (
                <tr key={student.student_id}>
                  <td>{student.name}</td>
                  <td>{student.present_count}</td>
                  <td>{student.absent_count}</td>
                  <td>
                    <span className={`attendance-percentage-badge attendance-percentage-${attendanceTier(student.percentage)}`}>
                      {student.percentage === null ? 'Not marked' : `${student.percentage}%`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
