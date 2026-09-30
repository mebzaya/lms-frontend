import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { fetchClasses } from '../../api/academics'
import {
  deleteAdminExam,
  fetchAdminExams,
  publishExamResults,
  unpublishExamResults,
} from '../../api/adminExams'
import { PencilIcon, TrashIcon } from '../../components/icons'
import { useEffectDeduped } from '../../hooks/useEffectDeduped'
import { ADMIN_EXAM_STATUS_LABEL, adminExamStatus } from '../../utils/examStatus'
import { formatNepaliDateTime } from '../../utils/nepaliDateTime'
import '../TeacherSubjectExam.css'
import './admin.css'

export default function AdminExams() {
  const location = useLocation()

  const [classes, setClasses] = useState([])
  // Restored when returning from an exam's manage/create page, so backing
  // out of one doesn't dump the admin back to an empty, unfiltered list.
  const [classFilter, setClassFilter] = useState(
    location.state?.classId != null ? String(location.state.classId) : ''
  )

  const [exams, setExams] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [listError, setListError] = useState('')

  useEffectDeduped(() => {
    fetchClasses()
      .then(setClasses)
      .catch(() => {})
  }, [])

  useEffectDeduped(() => {
    loadExams()
  }, [classFilter])

  async function loadExams() {
    setIsLoading(true)
    setListError('')
    try {
      setExams(await fetchAdminExams(classFilter))
    } catch {
      setListError('Could not load exams.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(exam) {
    if (!window.confirm(`Delete "${exam.title}"? This can't be undone.`)) return

    try {
      await deleteAdminExam(exam.id)
      await loadExams()
    } catch (err) {
      setListError(err.response?.data?.message ?? 'Could not delete that exam.')
    }
  }

  async function handleToggleResults(exam) {
    setListError('')

    if (exam.results_published_at) {
      if (!window.confirm('Unpublish results? Students will no longer be able to see the class ranking.')) return
      try {
        await unpublishExamResults(exam.id)
        await loadExams()
      } catch {
        setListError('Could not unpublish results.')
      }
      return
    }

    try {
      await publishExamResults(exam.id)
      await loadExams()
    } catch (err) {
      setListError(err.response?.data?.message ?? 'Could not publish results for this exam.')
    }
  }

  return (
    <div className="admin-page">
      <h1>Exams</h1>

      <section className="admin-panel admin-panel-single">
        <div className="user-list">
          <div className="user-list-header">
            <h2>Exams</h2>
            <div className="user-form-actions">
              <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                <option value="">All classes</option>
                {classes.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name}
                  </option>
                ))}
              </select>
              {classFilter && (
                <Link
                  to="/admin/exams/new"
                  state={{ classId: classFilter, className: classes.find((c) => String(c.id) === classFilter)?.name }}
                  className="auth-submit add-button"
                >
                  + Schedule exam
                </Link>
              )}
            </div>
          </div>

          {!classFilter && (
            <p className="mode-hint exam-publish-hint">
              Showing every exam across every class. Pick a class above to schedule a new exam for it.
            </p>
          )}

          {listError && <p className="auth-error">{listError}</p>}

          {isLoading ? (
            <p className="student-status">Loading...</p>
          ) : exams.length === 0 ? (
            <p className="student-status">
              {classFilter ? 'No exams yet — click "Schedule exam" to create one.' : 'No exams have been scheduled yet.'}
            </p>
          ) : (
            <div className="assessment-list">
              {exams.map((exam) => {
                const status = adminExamStatus(exam)
                const totalSections = exam.subject_exams.reduce((sum, se) => sum + se.sections.length, 0)
                const readySubjects = exam.subject_exams.filter((se) => se.submitted_at !== null).length
                const statusLink =
                  status === 'result_published'
                    ? `/admin/exams/${exam.id}/results`
                    : `/admin/exams/${exam.id}/subjects`
                const hasAttempts = exam.subject_exams.some((se) => se.attempts.length > 0)
                return (
                  <div className="assessment-card" key={exam.id}>
                    <div className="assessment-card-top">
                      <div className="assessment-card-info">
                        <div className="assessment-card-title-row">
                          <p className="assessment-card-title">
                            {exam.title}
                            {exam.school_class && (
                              <span className="assessment-card-title-sub"> — {exam.school_class.name}</span>
                            )}
                          </p>
                          <Link
                            to={statusLink}
                            state={{ classId: classFilter }}
                            className={`exam-status-pill exam-status-pill-link exam-status-${status}`}
                            aria-label={
                              status === 'result_published'
                                ? `View class results for ${exam.title}`
                                : `View subject status for ${exam.title}`
                            }
                          >
                            {ADMIN_EXAM_STATUS_LABEL[status]}
                          </Link>
                        </div>
                        <p className="assessment-card-meta">
                          {exam.subject_exams.length} subject{exam.subject_exams.length === 1 ? '' : 's'} ·{' '}
                          {readySubjects}/{exam.subject_exams.length} submitted · {totalSections} section
                          {totalSections === 1 ? '' : 's'} total
                          {exam.starts_at &&
                            ` · ${formatNepaliDateTime(exam.starts_at)} → ${formatNepaliDateTime(exam.ends_at)}`}
                        </p>
                      </div>
                      <div className="assessment-card-actions">
                        {status === 'result_pending' && (
                          <button type="button" className="cancel-button" onClick={() => handleToggleResults(exam)}>
                            Publish results
                          </button>
                        )}
                        {status === 'result_published' && (
                          <button type="button" className="cancel-button" onClick={() => handleToggleResults(exam)}>
                            Unpublish results
                          </button>
                        )}
                        <Link
                          to={`/admin/exams/${exam.id}`}
                          state={{ classId: classFilter }}
                          className="icon-button"
                          aria-label={`Edit ${exam.title}`}
                        >
                          <PencilIcon />
                        </Link>
                        <button
                          type="button"
                          className="icon-button icon-button-danger"
                          onClick={() => handleDelete(exam)}
                          disabled={hasAttempts}
                          aria-label={`Delete ${exam.title}`}
                          title={hasAttempts ? "Can't delete — students have already started this exam" : undefined}
                        >
                          <TrashIcon />
                        </button>
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
