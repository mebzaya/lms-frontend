import { useState } from 'react'
import { publishAdminExam, unpublishAdminExam } from '../api/adminExams'
import { EXAM_STATUS_LABEL, examStatus } from '../utils/examStatus'
import { formatNepaliDateTime, fromNepaliInputValue, toNepaliInputValue } from '../utils/nepaliDateTime'

/**
 * The exam-wide publish control: status pill, and either a "Publish exam"
 * button (which reveals the opening/closing deadline fields) or an
 * "Unpublish" button once it's live. Only enabled once every subject has
 * submitted its questions. Shared by the exam's own manage page and the
 * subject-status page, so publishing is reachable from wherever the admin
 * happens to be confirming submissions.
 */
export default function ExamPublishPanel({ exam, onChange }) {
  const [showPublishForm, setShowPublishForm] = useState(false)
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState('')

  const status = examStatus(exam)
  const isPublished = Boolean(exam.published_at)
  const readyCount = exam.subject_exams.filter((se) => se.submitted_at !== null).length
  const totalCount = exam.subject_exams.length

  async function handlePublish(event) {
    event.preventDefault()
    setIsPublishing(true)
    setError('')
    try {
      const updated = await publishAdminExam(exam.id, {
        starts_at: fromNepaliInputValue(startsAt),
        ends_at: fromNepaliInputValue(endsAt),
      })
      setShowPublishForm(false)
      onChange(updated)
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
      const updated = await unpublishAdminExam(exam.id)
      onChange(updated)
    } catch {
      setError('Could not unpublish this exam.')
    }
  }

  return (
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
            disabled={readyCount < totalCount}
          >
            Publish exam
          </button>
        )}
      </div>

      {error && <p className="auth-error">{error}</p>}

      {!isPublished && readyCount < totalCount && (
        <p className="mode-hint exam-publish-hint">
          {readyCount}/{totalCount} subjects have submitted their questions — every subject needs to submit before
          this exam can be published.
        </p>
      )}
      {!isPublished && readyCount === totalCount && (
        <p className="mode-hint exam-publish-hint">
          All subjects have submitted their questions — set a deadline above to publish this exam for students.
        </p>
      )}
    </section>
  )
}
