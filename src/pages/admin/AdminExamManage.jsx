import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  deleteAdminExam,
  fetchAdminExam,
  publishAdminExam,
  unpublishAdminExam,
  updateAdminExam,
} from '../../api/adminExams'
import { TrashIcon } from '../../components/icons'
import { useEffectDeduped } from '../../hooks/useEffectDeduped'
import { EXAM_STATUS_LABEL, examStatus } from '../../utils/examStatus'
import { formatNepaliDateTime, fromNepaliInputValue, toNepaliInputValue } from '../../utils/nepaliDateTime'
import '../../styles/common.css'
import '../TeacherAssessmentEditor.css'
import '../TeacherSubjectExam.css'
import './admin.css'

export default function AdminExamManage() {
  const { examId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const backTo = '/admin/exams'

  const [exam, setExam] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [detailsForm, setDetailsForm] = useState(null)
  const [isSavingDetails, setIsSavingDetails] = useState(false)

  const [showPublishForm, setShowPublishForm] = useState(false)
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)

  // Preserves whatever class filter the admin had selected on the exams
  // list (including "All classes", i.e. no filter) so backing out lands
  // where they were, not wherever this exam happens to belong.
  const backState = { classId: location.state?.classId }

  useEffectDeduped(() => {
    load()
  }, [examId])

  async function load() {
    setIsLoading(true)
    setError('')
    try {
      const match = await fetchAdminExam(examId)
      setExam(match)
      setDetailsForm({ title: match.title, instructions: match.instructions ?? '' })
    } catch {
      setError('That exam could not be found.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveDetails(event) {
    event.preventDefault()
    setIsSavingDetails(true)
    setError('')
    try {
      await updateAdminExam(examId, {
        title: detailsForm.title,
        instructions: detailsForm.instructions || null,
      })
      await load()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not save exam details.')
    } finally {
      setIsSavingDetails(false)
    }
  }

  async function handlePublish(event) {
    event.preventDefault()
    setIsPublishing(true)
    setError('')
    try {
      await publishAdminExam(examId, {
        starts_at: fromNepaliInputValue(startsAt),
        ends_at: fromNepaliInputValue(endsAt),
      })
      setShowPublishForm(false)
      await load()
    } catch (err) {
      setError(
        err.response?.data?.message ??
          Object.values(err.response?.data?.errors ?? {})[0]?.[0] ??
          'Could not publish this exam.'
      )
    } finally {
      setIsPublishing(false)
    }
  }

  async function handleUnpublish() {
    if (!window.confirm('Unpublish this exam? Students will lose access until you publish it again.')) return

    setError('')
    try {
      await unpublishAdminExam(examId)
      await load()
    } catch {
      setError('Could not unpublish this exam.')
    }
  }

  async function handleDeleteExam() {
    if (!window.confirm(`Delete "${exam.title}"? This can't be undone.`)) return

    try {
      await deleteAdminExam(examId)
      navigate(backTo, { state: backState })
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not delete that exam.')
    }
  }

  if (isLoading) {
    return <p className="student-status">Loading...</p>
  }

  if (!exam) {
    return <p className="student-status auth-error">{error}</p>
  }

  const status = examStatus(exam)
  const isPublished = Boolean(exam.published_at)
  const readyCount = exam.subject_exams.filter((se) => se.submitted_at !== null).length
  const hasAttempts = exam.subject_exams.some((se) => se.attempts.length > 0)

  return (
    <div className="admin-page">
      <Link to={backTo} state={backState} className="back-link">
        &larr; Back to exams
      </Link>
      <h1>
        {exam.title}
        {exam.school_class ? ` — ${exam.school_class.name}` : ''}
      </h1>

      {error && <p className="auth-error">{error}</p>}

      <section className="admin-panel admin-panel-single">
        <div className={`exam-publish-panel exam-publish-panel-${status}`}>
          <div className="exam-publish-status">
            <span className={`exam-status-pill exam-status-${status}`}>{EXAM_STATUS_LABEL[status]}</span>
            {isPublished && (
              <span className="exam-publish-window">
                {formatNepaliDateTime(exam.starts_at)} &rarr; {formatNepaliDateTime(exam.ends_at)}
              </span>
            )}
          </div>

          {isPublished ? (
            <button type="button" className="cancel-button" onClick={handleUnpublish}>
              Unpublish
            </button>
          ) : showPublishForm ? (
            <form onSubmit={handlePublish} className="exam-publish-form">
              <label>
                Opens at (Nepal time)
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  required
                />
              </label>
              <label>
                Closes at (Nepal time)
                <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
              </label>
              <button type="submit" className="auth-submit" disabled={isPublishing}>
                {isPublishing ? 'Publishing...' : 'Confirm publish'}
              </button>
              <button type="button" className="cancel-button" onClick={() => setShowPublishForm(false)}>
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="auth-submit"
              onClick={() => {
                const inHourFromNow = new Date(Date.now() + 60 * 60 * 1000)
                const inThreeHours = new Date(Date.now() + 3 * 60 * 60 * 1000)
                setStartsAt(toNepaliInputValue(inHourFromNow.toISOString()))
                setEndsAt(toNepaliInputValue(inThreeHours.toISOString()))
                setShowPublishForm(true)
              }}
              disabled={readyCount < exam.subject_exams.length}
            >
              Publish exam
            </button>
          )}
        </div>
        {!isPublished && readyCount < exam.subject_exams.length && (
          <p className="mode-hint exam-publish-hint">
            {readyCount}/{exam.subject_exams.length} subjects have submitted their questions — every subject needs
            to submit before this exam can be published.
          </p>
        )}
      </section>

      <section className="admin-panel admin-panel-single">
        <h2>Exam details</h2>
        <form onSubmit={handleSaveDetails} className="auth-form">
          <label>
            Title
            <input
              type="text"
              value={detailsForm.title}
              onChange={(e) => setDetailsForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </label>
          <label>
            Instructions (optional)
            <textarea
              value={detailsForm.instructions}
              onChange={(e) => setDetailsForm((prev) => ({ ...prev, instructions: e.target.value }))}
              rows={3}
            />
          </label>
          <div className="user-form-actions">
            <button type="submit" className="auth-submit" disabled={isSavingDetails}>
              {isSavingDetails ? 'Saving...' : 'Save details'}
            </button>
            <button
              type="button"
              className="icon-button icon-button-danger"
              onClick={handleDeleteExam}
              disabled={hasAttempts}
              title={hasAttempts ? "Can't delete — students have already started this exam" : undefined}
            >
              <TrashIcon />
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
