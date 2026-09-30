import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { EyeIcon, TeacherIcon } from '../../components/icons'
import { fetchAdminExam } from '../../api/adminExams'
import ExamContextBar from '../../components/ExamContextBar'
import { useEffectDeduped } from '../../hooks/useEffectDeduped'
import '../../styles/common.css'
import '../TeacherAssessmentEditor.css'
import '../TeacherSubjectExam.css'
import './admin.css'

function teacherSummary(teachers) {
  if (!teachers || teachers.length === 0) return 'No teacher assigned'
  return teachers.map((t) => `${t.name} (${t.email})`).join(', ')
}

export default function AdminExamSubjectStatus() {
  const { examId } = useParams()
  const location = useLocation()

  // Reached directly from the exams list's status pill, so "back" returns
  // there — preserving whichever class filter (including "All classes") the
  // admin had selected, rather than the exam's own class.
  const backTo = '/admin/exams'
  const backState = { classId: location.state?.classId }

  const [exam, setExam] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffectDeduped(() => {
    load()
  }, [examId])

  async function load() {
    setIsLoading(true)
    setError('')
    try {
      setExam(await fetchAdminExam(examId))
    } catch {
      setError('That exam could not be found.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <p className="student-status">Loading...</p>
  }

  if (!exam) {
    return <p className="student-status auth-error">{error}</p>
  }

  const submittedCount = exam.subject_exams.filter((se) => se.submitted_at !== null).length

  return (
    <div className="admin-page">
      <Link to={backTo} state={backState} className="back-link">
        &larr; Back to exams
      </Link>
      <h1>{exam.title} — subject status</h1>
      <ExamContextBar className={exam.school_class?.name} />

      <section className="admin-panel admin-panel-single">
        <div className="user-list">
          <div className="user-list-header">
            <h2>Subjects</h2>
            <span className="grading-option-count">
              {submittedCount}/{exam.subject_exams.length} submitted
            </span>
          </div>
          <p className="mode-hint exam-publish-hint">
            Each subject's teacher(s) add its sections and questions from their own dashboard, then submit them when
            ready — this is a read-only summary of where each subject stands.
          </p>

          <div className="assessment-list">
            {exam.subject_exams.map((subjectExam) => {
              const totalQuestions = subjectExam.sections.reduce((sum, s) => sum + s.questions.length, 0)
              const submitted = subjectExam.submitted_at !== null
              const status = submitted ? 'submitted' : subjectExam.sections.length > 0 ? 'in_progress' : 'not_started'
              return (
                <div className="assessment-card" key={subjectExam.id}>
                  <div className="assessment-card-top">
                    <div className="assessment-card-info">
                      <div className="assessment-card-title-row">
                        <p className="assessment-card-title">{subjectExam.subject.name}</p>
                        {status === 'submitted' ? (
                          <span className="exam-status-pill exam-status-live">Submitted</span>
                        ) : status === 'in_progress' ? (
                          <span className="exam-status-pill exam-status-scheduled">In Progress</span>
                        ) : (
                          <span className="exam-status-pill exam-status-draft">Not started</span>
                        )}
                      </div>
                      <p className="assessment-card-meta">
                        {subjectExam.sections.length} section{subjectExam.sections.length === 1 ? '' : 's'} ·{' '}
                        {totalQuestions} question{totalQuestions === 1 ? '' : 's'}
                      </p>
                      <p className="assessment-card-meta assessment-card-teacher">
                        <TeacherIcon />
                        {teacherSummary(subjectExam.subject.teachers)}
                      </p>
                    </div>
                    {submitted && (
                      <div className="assessment-card-actions">
                        <Link
                          to={`/admin/exams/${examId}/subjects/${subjectExam.id}`}
                          state={backState}
                          className="icon-button"
                          aria-label={`View ${subjectExam.subject.name} questions and answers`}
                        >
                          <EyeIcon open />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
