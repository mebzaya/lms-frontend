import { useMemo, useState } from 'react'
import { fetchClasses } from '../../api/academics'
import { fetchAdminAttendanceDates, fetchAdminAttendanceRoster, fetchAdminAttendanceSummary } from '../../api/attendance'
import AttendanceDatePicker from '../../components/AttendanceDatePicker'
import SortableHeader from '../../components/SortableHeader'
import { useEffectDeduped } from '../../hooks/useEffectDeduped'
import { sortRows } from '../../utils/sortRows'
import { todayNepaliDate } from '../../utils/nepaliDateTime'
import '../../styles/common.css'
import '../TeacherAttendance.css'
import './admin.css'

export default function AdminAttendance() {
  const [classes, setClasses] = useState([])
  const [classFilter, setClassFilter] = useState('')
  const [tab, setTab] = useState('mark')
  const [date, setDate] = useState(todayNepaliDate())

  useEffectDeduped(() => {
    fetchClasses()
      .then(setClasses)
      .catch(() => {})
  }, [])

  return (
    <div className="admin-page">
      <h1>Attendance</h1>

      <section className="admin-panel admin-panel-single">
        <div className="user-list">
          <div className="user-list-header">
            <h2>Classes</h2>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option value="">Select a class…</option>
              {classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.name}
                </option>
              ))}
            </select>
          </div>

          {!classFilter ? (
            <p className="guardian-picker-empty">Choose a class above to view its attendance.</p>
          ) : (
            <>
              <div className="attendance-tabs">
                <button
                  type="button"
                  className={`attendance-tab${tab === 'mark' ? ' attendance-tab-active' : ''}`}
                  onClick={() => setTab('mark')}
                >
                  By date
                </button>
                <button
                  type="button"
                  className={`attendance-tab${tab === 'report' ? ' attendance-tab-active' : ''}`}
                  onClick={() => setTab('report')}
                >
                  Report
                </button>
              </div>

              {tab === 'mark' ? (
                <DateRegister classId={classFilter} date={date} onDateChange={setDate} />
              ) : (
                <AttendanceReport
                  classId={classFilter}
                  schoolClassName={classes.find((c) => String(c.id) === classFilter)?.name}
                />
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

function DateRegister({ classId, date, onDateChange }) {
  const [recordedDates, setRecordedDates] = useState([])
  const [roster, setRoster] = useState(null)
  const [error, setError] = useState('')

  useEffectDeduped(() => {
    fetchAdminAttendanceDates(classId)
      .then(setRecordedDates)
      .catch(() => {})
  }, [classId])

  useEffectDeduped(() => {
    setRoster(null)
    fetchAdminAttendanceRoster(classId, date)
      .then((data) => setRoster(data.students))
      .catch(() => setError('Could not load this class’s roster.'))
  }, [classId, date])

  return (
    <div className="attendance-mark">
      <AttendanceDatePicker
        selectedDate={date}
        recordedDates={recordedDates}
        maxDate={todayNepaliDate()}
        onSelectDate={onDateChange}
      />

      {error && <p className="auth-error">{error}</p>}

      {!roster ? (
        <p className="student-status">Loading...</p>
      ) : (
        <ul className="attendance-roster">
          {roster.map((student) => (
            <li className="attendance-roster-row" key={student.student_id}>
              <span className="attendance-student-name">{student.name}</span>
              {student.status === null ? (
                <span className="attendance-status-badge">Not marked</span>
              ) : (
                <span className={`attendance-status-badge attendance-status-badge-${student.status}`}>
                  {student.status === 'present' ? 'Present' : 'Absent'}
                </span>
              )}
            </li>
          ))}
        </ul>
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
    fetchAdminAttendanceSummary(classId)
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
