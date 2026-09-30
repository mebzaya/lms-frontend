import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { fetchLesson, releaseLessonContent, saveLessonContent, unreleaseLessonContent } from '../api/teacher'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import '../styles/common.css'
import './LessonContent.css'

export default function TeacherLessonContent() {
  const { lessonId } = useParams()
  const location = useLocation()

  const [lesson, setLesson] = useState(null)
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffectDeduped(() => {
    load()
  }, [lessonId])

  async function load() {
    setIsLoading(true)
    setError('')
    try {
      const data = await fetchLesson(lessonId)
      setLesson(data)
      setContent(data.content ?? '')
    } catch {
      setError('Could not load this lesson.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave(event) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccessMessage('')
    try {
      const updated = await saveLessonContent(lessonId, content)
      setLesson(updated)
      setSuccessMessage(
        updated.content_released_at
          ? 'Saved — students see this update immediately.'
          : 'Draft saved. Students still can’t see it until you release it.'
      )
    } catch {
      setError('Could not save this content.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRelease() {
    setIsPublishing(true)
    setError('')
    setSuccessMessage('')
    try {
      const updated = await releaseLessonContent(lessonId)
      setLesson(updated)
      setSuccessMessage('Released — students can now read this lesson.')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not release this content.')
    } finally {
      setIsPublishing(false)
    }
  }

  async function handleUnrelease() {
    if (!window.confirm('Take this lesson back to draft? Students will no longer be able to read it.')) return

    setIsPublishing(true)
    setError('')
    setSuccessMessage('')
    try {
      const updated = await unreleaseLessonContent(lessonId)
      setLesson(updated)
      setSuccessMessage('Back to draft — hidden from students.')
    } catch {
      setError('Could not unpublish this content.')
    } finally {
      setIsPublishing(false)
    }
  }

  if (isLoading) {
    return <p className="student-status">Loading...</p>
  }

  if (!lesson) {
    return <p className="student-status auth-error">{error || 'Lesson not found.'}</p>
  }

  const isReleased = Boolean(lesson.content_released_at)
  const isDirty = content !== (lesson.content ?? '')

  return (
    <div className="lesson-content-page">
      <Link
        to="/dashboard"
        state={{ classId: location.state?.classId, subjectId: location.state?.subjectId }}
        className="back-link"
      >
        &larr; Back to lessons
      </Link>
      <h1>{location.state?.lessonTitle ?? lesson.title}</h1>

      <div className={`release-banner ${isReleased ? 'release-banner-live' : 'release-banner-draft'}`}>
        {isReleased ? (
          <>
            <span>✓ Released — students can read this lesson.</span>
            <button type="button" className="cancel-button" onClick={handleUnrelease} disabled={isPublishing}>
              {isPublishing ? 'Working...' : 'Unpublish'}
            </button>
          </>
        ) : (
          <>
            <span>Draft — students can't see this yet.</span>
            <button
              type="button"
              className="auth-submit"
              onClick={handleRelease}
              disabled={isPublishing || !content.trim()}
            >
              {isPublishing ? 'Working...' : 'Release to students'}
            </button>
          </>
        )}
      </div>

      {error && <p className="auth-error">{error}</p>}
      {successMessage && <p className="form-success">{successMessage}</p>}

      <form onSubmit={handleSave} className="lesson-content-form">
        <div className="lesson-content-split">
          <label className="lesson-content-editor">
            <span className="lesson-content-pane-label">Markdown</span>
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                setSuccessMessage('')
              }}
              placeholder={'# Lesson title\n\nWrite the lesson like a textbook page — headings, **bold**, lists, etc.'}
              rows={22}
            />
          </label>

          <div className="lesson-content-preview">
            <span className="lesson-content-pane-label">Preview</span>
            <div className="lesson-content-body">
              {content.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              ) : (
                <p className="student-status">Nothing written yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="user-form-actions">
          <button type="submit" className="auth-submit" disabled={isSaving || !isDirty}>
            {isSaving ? 'Saving...' : isReleased ? 'Save (goes live immediately)' : 'Save draft'}
          </button>
        </div>
      </form>
    </div>
  )
}
