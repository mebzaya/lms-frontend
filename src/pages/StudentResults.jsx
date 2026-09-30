import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchExamStudentResult, fetchPublishedClassResults } from '../api/student'
import ReportCard from '../components/ReportCard'
import { useAuth } from '../context/AuthContext'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import '../styles/common.css'
import '../styles/modeBadge.css'
import './ParentChildScores.css'
import './StudentResults.css'

export default function StudentResults() {
  const { user } = useAuth()

  const [classResults, setClassResults] = useState(null)
  const [reportCards, setReportCards] = useState({})
  const [error, setError] = useState('')

  useEffectDeduped(() => {
    fetchPublishedClassResults()
      .then(setClassResults)
      .catch(() => setError('Could not load your results right now.'))
  }, [])

  // One report card per published exam, fetched once the list of exams
  // (and this student's own id) is known — the same per-subject breakdown
  // shown when viewing a classmate's report card from the ranking page.
  useEffectDeduped(() => {
    if (!classResults || !user) return
    classResults.forEach((exam) => {
      fetchExamStudentResult(exam.id, user.id)
        .then((result) => setReportCards((prev) => ({ ...prev, [exam.id]: result.subjects })))
        .catch(() => {})
    })
  }, [classResults, user])

  if (error) {
    return <p className="student-status auth-error">{error}</p>
  }

  if (!classResults) {
    return <p className="student-status">Loading...</p>
  }

  return (
    <div className="results-page">
      <Link to="/dashboard" className="back-link">
        &larr; Back to dashboard
      </Link>

      <h1>My results</h1>

      {classResults.length === 0 ? (
        <p className="student-status">No results have been published yet.</p>
      ) : (
        <div className="report-card-list">
          {classResults.map((exam) =>
            reportCards[exam.id] ? (
              <div className="report-card-list-item" key={exam.id}>
                <ReportCard
                  studentName={user.name}
                  examTitle={exam.title}
                  rank={exam.your_rank}
                  subjects={reportCards[exam.id]}
                />
                <Link to={`/dashboard/exams/${exam.id}/ranking`} className="class-result-link">
                  View full class ranking (of {exam.student_count}) &rarr;
                </Link>
              </div>
            ) : (
              <p className="student-status" key={exam.id}>
                Loading {exam.title}...
              </p>
            )
          )}
        </div>
      )}
    </div>
  )
}
