import './ReportCard.css'

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

// A student's per-subject exam breakdown, formatted like a physical report
// card — shared by the student's own results page, the class ranking's
// per-student drill-down, and the admin's exam results view, so all three
// present the exact same thing.
export default function ReportCard({ studentName, examTitle, rank, subjects }) {
  const totalScore = subjects.reduce((sum, s) => sum + (s.score ?? 0), 0)
  const totalMax = subjects.reduce((sum, s) => sum + s.max_score, 0)
  const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 1000) / 10 : 0

  return (
    <div className="report-card">
      <div className="report-card-header">
        <span className="report-card-avatar">{initials(studentName)}</span>
        <div className="report-card-heading-text">
          <p className="report-card-name">{studentName}</p>
          <p className="report-card-exam">{examTitle} &middot; Report Card</p>
        </div>
        {rank != null && (
          <span className={`rank-badge report-card-rank${rank <= 3 ? ` rank-badge-${rank}` : ''}`}>#{rank}</span>
        )}
      </div>

      <div className="user-table-wrap">
        <table className="report-card-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Full Marks</th>
              <th>Marks Obtained</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject) => (
              <tr key={subject.subject}>
                <td>{subject.subject}</td>
                <td>{subject.max_score}</td>
                <td>{subject.score === null ? <span className="report-card-absent">Absent</span> : subject.score}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="report-card-total-row">
              <td>Total</td>
              <td>{totalMax}</td>
              <td>{totalScore}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="report-card-footer">
        <div className="report-card-stat">
          <span className="report-card-stat-value">{percentage}%</span>
          <span className="report-card-stat-label">Percentage</span>
        </div>
        <div className="report-card-stat">
          <span className="report-card-stat-value">
            {totalScore}/{totalMax}
          </span>
          <span className="report-card-stat-label">Total marks</span>
        </div>
      </div>
    </div>
  )
}
