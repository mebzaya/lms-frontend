import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchSubjectExams } from '../api/student'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import '../styles/common.css'
import '../styles/modeBadge.css'
import './StudentDashboard.css'

const EXAM_WINDOW_LABEL = { scheduled: 'Opens soon', live: 'Open now', ended: 'Closed' }

function examSummary(exam) {
  if (exam.attempt_status === 'graded') return `Scored ${exam.score}/${exam.max_score}`
  if (exam.attempt_status === 'submitted') return 'Awaiting grading'
  if (exam.attempt_status === 'in_progress') return 'In progress'
  return EXAM_WINDOW_LABEL[exam.window_status] ?? 'Not attempted'
}

// Every subject's exam is one paper of the same class-wide Exam (e.g.
// "First-Term"), so exams are grouped by that shared exam — not by subject —
// with each subject's paper listed underneath it.
function groupByExam(exams) {
  const groups = new Map()
  exams.forEach((exam) => {
    if (!groups.has(exam.exam_id)) {
      groups.set(exam.exam_id, { title: exam.title, exams: [] })
    }
    groups.get(exam.exam_id).exams.push(exam)
  })
  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      exams: [...group.exams].sort((a, b) => a.subject.name.localeCompare(b.subject.name)),
    }))
    .sort((a, b) => a.title.localeCompare(b.title))
}

export default function StudentExams() {
  const [exams, setExams] = useState(null)
  const [error, setError] = useState('')

  useEffectDeduped(() => {
    fetchSubjectExams()
      .then(setExams)
      .catch(() => setError('Could not load your exams right now.'))
  }, [])

  const grouped = useMemo(() => (exams ? groupByExam(exams) : []), [exams])

  if (error) {
    return <p className="student-status auth-error">{error}</p>
  }

  if (!exams) {
    return <p className="student-status">Loading...</p>
  }

  return (
    <div className="student-dashboard">
      <h1>Exams</h1>

      {exams.length === 0 ? (
        <p className="student-status">No exams have been scheduled yet.</p>
      ) : (
        grouped.map((group) => (
          <section className="subject-exams-panel" key={group.exams[0].exam_id}>
            <h3 className="subject-exams-heading">{group.title}</h3>
            <ul className="assessment-mini-list">
              {group.exams.map((exam) => (
                <li key={exam.id}>
                  <Link to={`/dashboard/subject-exams/${exam.id}`} className="assessment-mini-link">
                    <span className="assessment-mini-row">
                      <span className="assessment-mini-title">{exam.subject.name}</span>
                      <span className={`mode-badge mode-badge-exam exam-window-badge-${exam.window_status}`}>
                        {EXAM_WINDOW_LABEL[exam.window_status]}
                      </span>
                    </span>
                    <span className="assessment-mini-summary">{examSummary(exam)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
