import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchTeacherAssessments, updateAssessment } from '../api/assessments'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import '../styles/common.css'
import './TeacherAssessmentEditor.css'

function toForm(assessment) {
  return {
    type: assessment.type,
    title: assessment.title,
    instructions: assessment.instructions ?? '',
    passage: assessment.passage ?? '',
    prompt: assessment.prompt ?? '',
    time_limit_minutes: assessment.time_limit_minutes ?? '',
    max_attempts: assessment.max_attempts ?? '',
  }
}

export default function TeacherAssessmentEdit() {
  const { lessonId, assessmentId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [form, setForm] = useState(location.state?.record ? toForm(location.state.record) : null)
  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const backTo = `/dashboard/lessons/${lessonId}/assessments`
  const backState = {
    lessonTitle: location.state?.lessonTitle,
    classId: location.state?.classId,
    subjectId: location.state?.subjectId,
  }

  useEffectDeduped(() => {
    if (form) return
    fetchTeacherAssessments(lessonId)
      .then((assessments) => {
        const match = assessments.find((a) => String(a.id) === assessmentId)
        if (match) {
          setForm(toForm(match))
        } else {
          setLoadError('That assessment could not be found.')
        }
      })
      .catch(() => setLoadError('Could not load that assessment.'))
  }, [lessonId, assessmentId])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setIsSubmitting(true)

    try {
      const payload = {
        type: form.type,
        title: form.title,
        instructions: form.instructions || null,
      }
      if (form.type === 'reading') {
        payload.passage = form.passage
      } else if (form.prompt) {
        payload.prompt = form.prompt
      }
      if (form.time_limit_minutes) payload.time_limit_minutes = Number(form.time_limit_minutes)
      if (form.max_attempts) payload.max_attempts = Number(form.max_attempts)

      await updateAssessment(assessmentId, payload)
      navigate(backTo, { state: backState })
    } catch (err) {
      const message =
        err.response?.data?.message ??
        Object.values(err.response?.data?.errors ?? {})[0]?.[0] ??
        'Something went wrong. Please try again.'
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="admin-page form-page">
      <Link to={backTo} state={backState} className="back-link">
        &larr; Back to assessments
      </Link>
      <h1>Edit assessment</h1>

      <div className="user-form-card">
        {loadError && <p className="auth-error">{loadError}</p>}

        {form && (
          <form onSubmit={handleSubmit} className="auth-form">
            <p className="form-section-label">Basics</p>

            <label>
              Type
              <select name="type" value={form.type} onChange={handleChange}>
                <option value="reading">Reading</option>
                <option value="fill_in_blank">Fill in the blank</option>
                <option value="true_false">True / False</option>
                <option value="writing">Writing</option>
              </select>
            </label>

            <label>
              Title
              <input type="text" name="title" value={form.title} onChange={handleChange} required />
            </label>

            <label>
              Instructions (optional)
              <input type="text" name="instructions" value={form.instructions} onChange={handleChange} />
            </label>

            <p className="form-section-label">Content</p>

            {form.type === 'reading' ? (
              <label>
                Passage
                <textarea name="passage" value={form.passage} onChange={handleChange} rows={5} required />
                <span className="mode-hint">
                  Each question's expected answer language (English or Nepali) is set when you add it.
                </span>
              </label>
            ) : (
              <label>
                Shared prompt (optional)
                <textarea
                  name="prompt"
                  value={form.prompt}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Shared context shown above this assessment's questions, e.g. a short scenario or set of statements."
                />
                <span className="mode-hint">
                  {form.type === 'fill_in_blank' && 'Add standalone fill-in-the-blank questions to this assessment after creating it.'}
                  {form.type === 'true_false' && 'Add standalone true/false statements to this assessment after creating it.'}
                  {form.type === 'writing' && 'Add one or more written-response questions to this assessment after creating it.'}
                </span>
              </label>
            )}

            <p className="form-section-label">Rules</p>

            <div className="field-row">
              <label>
                Time limit (minutes)
                <input
                  type="number"
                  name="time_limit_minutes"
                  value={form.time_limit_minutes}
                  onChange={handleChange}
                  min={1}
                  placeholder="No limit"
                />
              </label>
              <label>
                Max attempts
                <input
                  type="number"
                  name="max_attempts"
                  value={form.max_attempts}
                  onChange={handleChange}
                  min={1}
                  placeholder="Unlimited"
                />
              </label>
            </div>

            {formError && <p className="auth-error">{formError}</p>}

            <div className="user-form-actions">
              <button type="submit" className="auth-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save changes'}
              </button>
              <Link to={backTo} state={backState} className="cancel-button">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
