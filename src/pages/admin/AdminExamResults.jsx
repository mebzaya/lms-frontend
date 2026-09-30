import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { fetchAdminExamRanking, fetchAdminExamStudentResult } from '../../api/adminExams'
import ReportCard from '../../components/ReportCard'
import { useEffectDeduped } from '../../hooks/useEffectDeduped'
import '../../styles/common.css'
import '../../styles/modeBadge.css'
import '../StudentDashboard.css'
import '../StudentExamRanking.css'
import './admin.css'

export default function AdminExamResults() {
  const { examId } = useParams()
  const location = useLocation()

  const [ranking, setRanking] = useState(null)
  const [error, setError] = useState('')

  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentResult, setStudentResult] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  // Reached directly from the exams list's status pill, so "back" returns
  // there — preserving whichever class filter (including "All classes") the
  // admin had selected.
  const backTo = '/admin/exams'
  const backState = { classId: location.state?.classId }

  useEffectDeduped(() => {
    fetchAdminExamRanking(examId)
      .then(setRanking)
      .catch(() => setError('Could not load the class ranking right now.'))
  }, [examId])

  function viewStudent(student) {
    setSelectedStudent(student)
    setStudentResult(null)
    setDetailError('')
    setDetailLoading(true)
    fetchAdminExamStudentResult(examId, student.id)
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
    <div className="admin-page">
      {!selectedStudent && (
        <Link to={backTo} state={backState} className="back-link">
          &larr; Back to exams
        </Link>
      )}
      <h1>{ranking.exam.title} — class results</h1>
      <p className="mode-hint">
        {ranking.results_published_at ? 'Results are published to students.' : 'Results are not published yet.'}
      </p>

      {!selectedStudent ? (
        ranking.students.length === 0 ? (
          <p className="student-status">No students are enrolled in this class yet.</p>
        ) : (
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
                  <tr key={student.id}>
                    <td>
                      <span className={`rank-badge${student.rank <= 3 ? ` rank-badge-${student.rank}` : ''}`}>
                        {student.rank}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="ranking-student-link" onClick={() => viewStudent(student)}>
                        {student.name}
                      </button>
                    </td>
                    <td>
                      {student.total_score}/{ranking.max_total}
                    </td>
                    <td>
                      <button type="button" className="ranking-view-link" onClick={() => viewStudent(student)}>
                        Report card &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
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
