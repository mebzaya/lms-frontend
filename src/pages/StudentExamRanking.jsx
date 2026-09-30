import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchExamRanking, fetchExamStudentResult } from '../api/student'
import ReportCard from '../components/ReportCard'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import '../styles/common.css'
import '../styles/modeBadge.css'
import './StudentDashboard.css'
import './StudentExamRanking.css'

export default function StudentExamRanking() {
  const { examId } = useParams()
  const [ranking, setRanking] = useState(null)
  const [error, setError] = useState('')

  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentResult, setStudentResult] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  useEffectDeduped(() => {
    fetchExamRanking(examId)
      .then(setRanking)
      .catch(() => setError('Could not load the class ranking right now.'))
  }, [examId])

  function viewStudent(student) {
    setSelectedStudent(student)
    setStudentResult(null)
    setDetailError('')
    setDetailLoading(true)
    fetchExamStudentResult(examId, student.id)
      .then(setStudentResult)
      .catch(() => setDetailError("Could not load this student's results."))
      .finally(() => setDetailLoading(false))
  }

  function backToRanking() {
    setSelectedStudent(null)
    setStudentResult(null)
  }

  if (error) {
    return <p className="student-status auth-error">{error}</p>
  }

  if (!ranking) {
    return <p className="student-status">Loading...</p>
  }

  return (
    <div className="student-dashboard">
      {!selectedStudent && (
        <Link to="/dashboard/results" className="back-link">
          &larr; Back to results
        </Link>
      )}
      <h1>{ranking.exam.title} — class results</h1>

      {!selectedStudent ? (
        <div className="user-table-wrap">
          <table className="user-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Total score</th>
                <th aria-label="Report card" />
              </tr>
            </thead>
            <tbody>
              {ranking.students.map((student) => (
                <tr key={student.id} className={student.is_you ? 'ranking-row-you' : undefined}>
                  <td>
                    <span className={`rank-badge${student.rank <= 3 ? ` rank-badge-${student.rank}` : ''}`}>
                      {student.rank}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="ranking-student-link" onClick={() => viewStudent(student)}>
                      {student.name}
                    </button>
                    {student.is_you && <span className="mode-badge mode-badge-exam">You</span>}
                  </td>
                  <td>
                    {student.total_score}/{ranking.max_total}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="ranking-view-link"
                      onClick={() => viewStudent(student)}
                    >
                      Report card &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <button type="button" className="grading-back-button" onClick={backToRanking}>
            &larr; Back to ranking
          </button>

          {detailError && <p className="auth-error">{detailError}</p>}

          {detailLoading ? (
            <p className="student-status">Loading...</p>
          ) : (
            studentResult && (
              <ReportCard
                studentName={selectedStudent.name}
                examTitle={ranking.exam.title}
                rank={selectedStudent.rank}
                subjects={studentResult.subjects}
              />
            )
          )}
        </>
      )}
    </div>
  )
}
