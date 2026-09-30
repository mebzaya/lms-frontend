import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { fetchTeacherSubjectExams } from '../api/subjectExams'
import { PencilIcon } from '../components/icons'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import { EXAM_STATUS_LABEL, examStatus } from '../utils/examStatus'
import { formatNepaliDateTime } from '../utils/nepaliDateTime'
import '../styles/common.css'
import './TeacherAssessmentEditor.css'
import './TeacherSubjectExam.css'

export default function TeacherSubjectExamList() {
  const { subjectId } = useParams()
  const location = useLocation()

  const [exams, setExams] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [listError, setListError] = useState('')

  useEffectDeduped(() => {
    load()
  }, [])

  async function load() {
    setIsLoading(true)
    setListError('')
    try {
      setExams(await fetchTeacherSubjectExams(subjectId))
    } catch {
      setListError('Could not load exams for this subject.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="admin-page">
      <Link
        to="/dashboard"
        state={{ classId: location.state?.classId, subjectId: Number(subjectId) }}
        className="back-link"
      >
        &larr; Back to dashboard
      </Link>
      <h1>Subject exams for {location.state?.subjectName ?? `subject #${subjectId}`}</h1>

      <section className="admin-panel admin-panel-single">
        <div className="user-list">
          <div className="user-list-header">
            <h2>Exams</h2>
          </div>
          <p className="mode-hint exam-publish-hint">
            Exams are scheduled by an admin. Once one exists here, add its sections and questions below.
          </p>

          {listError && <p className="auth-error">{listError}</p>}

          {isLoading ? (
            <p className="student-status">Loading...</p>
          ) : exams.length === 0 ? (
            <p className="student-status">No exams have been scheduled for this subject yet.</p>
          ) : (
            <div className="assessment-list">
              {exams.map((exam) => {
                const status = examStatus(exam)
                return (
                  <div className="assessment-card" key={exam.id}>
                    <div className="assessment-card-top">
                      <div className="assessment-card-info">
                        <div className="assessment-card-title-row">
                          <p className="assessment-card-title">{exam.title}</p>
                          <span className={`exam-status-pill exam-status-${status}`}>
                            {EXAM_STATUS_LABEL[status]}
                          </span>
                        </div>
                        <p className="assessment-card-meta">
                          {exam.sections.length} section{exam.sections.length === 1 ? '' : 's'}
                          {exam.starts_at &&
                            ` · ${formatNepaliDateTime(exam.starts_at)} → ${formatNepaliDateTime(exam.ends_at)}`}
                        </p>
                      </div>
                      <div className="assessment-card-actions">
                        <Link
                          to={`/dashboard/subjects/${subjectId}/exams/${exam.id}`}
                          state={{ subjectName: location.state?.subjectName }}
                          className="icon-button"
                          aria-label={`Manage ${exam.title}`}
                        >
                          <PencilIcon />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
