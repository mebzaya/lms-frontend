import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMyAttendance } from '../api/attendance'
import AttendanceHistoryCalendar from '../components/AttendanceHistoryCalendar'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import { formatNepaliDate } from '../utils/nepaliDateTime'
import '../styles/common.css'
import '../components/ReportCard.css'
import './TeacherAttendance.css'
import './StudentAttendance.css'

export default function StudentAttendance() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffectDeduped(() => {
    fetchMyAttendance()
      .then(setData)
      .catch(() => setError('Could not load your attendance right now.'))
  }, [])

  if (error) {
    return <p className="student-status auth-error">{error}</p>
  }

  if (!data) {
    return <p className="student-status">Loading...</p>
  }

  return (
    <div className="student-dashboard">
      <Link to="/dashboard" className="back-link">
        &larr; Back to dashboard
      </Link>

      <h1>My attendance</h1>

      <AttendanceHistoryPanel data={data} />
    </div>
  )
}

export function AttendanceSummaryCard({ summary }) {
  return (
    <div className="report-card attendance-summary-card">
      <div className="report-card-footer">
        <div className="report-card-stat">
          <span className="report-card-stat-value">{summary.percentage === null ? '—' : `${summary.percentage}%`}</span>
          <span className="report-card-stat-label">Attendance</span>
        </div>
        <div className="report-card-stat">
          <span className="report-card-stat-value">{summary.present_count}</span>
          <span className="report-card-stat-label">Present</span>
        </div>
        <div className="report-card-stat">
          <span className="report-card-stat-value">{summary.absent_count}</span>
          <span className="report-card-stat-label">Absent</span>
        </div>
        <div className="report-card-stat">
          <span className="report-card-stat-value">{summary.total_days}</span>
          <span className="report-card-stat-label">Total days</span>
        </div>
      </div>
    </div>
  )
}

// The summary card + tabular history + calendar, together — shared by the
// student's own attendance page and the parent's per-child attendance view.
export function AttendanceHistoryPanel({ data }) {
  return (
    <>
      <AttendanceSummaryCard summary={data} />

      {data.records.length === 0 ? (
        <p className="student-status">No attendance has been recorded yet.</p>
      ) : (
        <div className="attendance-history-layout">
          <div className="user-table-wrap attendance-history-table-wrap">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.records.map((record) => (
                  <tr key={record.date}>
                    <td>{formatNepaliDate(record.date)}</td>
                    <td>
                      <span className={`attendance-status-badge attendance-status-badge-${record.status}`}>
                        {record.status === 'present' ? 'Present' : 'Absent'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AttendanceHistoryCalendar records={data.records} />
        </div>
      )}
    </>
  )
}
