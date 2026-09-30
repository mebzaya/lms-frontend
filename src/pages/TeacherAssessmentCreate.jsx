import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { createAssessment } from '../api/assessments'
import '../styles/common.css'
import './TeacherAssessmentEditor.css'

const EMPTY_FIELDS = {
  title: '',
  instructions: '',
  passage: '',
  prompt: '',
  time_limit_minutes: '',
  max_attempts: '',
}

export default function TeacherAssessmentCreate() {
  const { lessonId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [type, setType] = useState('reading')
  const [fields, setFields] = useState(EMPTY_FIELDS)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const backTo = `/dashboard/lessons/${lessonId}/assessments`
  const backState = {
    lessonTitle: location.state?.lessonTitle,
    classId: location.state?.classId,
    subjectId: location.state?.subjectId,
  }

  function handleFieldChange(event) {
    const { name, value } = event.target
    setFields((prev) => ({ ...prev, [name]: value }))
    setSuccessMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setIsSubmitting(true)
    const createAnother = event.nativeEvent.submitter?.value === 'save-new'

    try {
      const payload = {
        lesson_id: Number(lessonId),
        type,
        title: fields.title,
        instructions: fields.instructions || null,
      }
      if (type === 'reading') {
        payload.passage = fields.passage
      } else if (fields.prompt) {
        payload.prompt = fields.prompt
      }
      if (fields.time_limit_minutes) payload.time_limit_minutes = Number(fields.time_limit_minutes)
      if (fields.max_attempts) payload.max_attempts = Number(fields.max_attempts)

      const created = await createAssessment(payload)

      if (createAnother) {
        setFields(EMPTY_FIELDS)
        setSuccessMessage('Assessment created — add another below.')
      } else {
        // Nothing else to fill in here — go straight to adding the first
        // question (with its correct answer, or the written-response prompt
        // for writing) instead of dropping the teacher back on the plain list.
        navigate(`/dashboard/lessons/${lessonId}/assessments/${created.id}/questions/new`, {
          state: {
            ...backState,
            assessmentTitle: created.title,
            assessmentType: created.type,
          },
        })
      }
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
      <h1>Add assessment for {location.state?.lessonTitle ?? `lesson #${lessonId}`}</h1>

      <div className="user-form-card">
        {successMessage && <p className="form-success">{successMessage}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <p className="form-section-label">Basics</p>

          <label>
            Type
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value)
                setSuccessMessage('')
              }}
            >
              <option value="reading">Reading</option>
              <option value="fill_in_blank">Fill in the blank</option>
              <option value="true_false">True / False</option>
              <option value="writing">Writing</option>
            </select>
          </label>

          <label>
            Title
            <input type="text" name="title" value={fields.title} onChange={handleFieldChange} required />
          </label>

          <label>
            Instructions (optional)
            <input type="text" name="instructions" value={fields.instructions} onChange={handleFieldChange} />
          </label>

          <p className="form-section-label">Content</p>

          {type === 'reading' ? (
            <label>
              Passage
              <textarea name="passage" value={fields.passage} onChange={handleFieldChange} rows={5} required />
              <span className="mode-hint">
                Each question's expected answer language (English or Nepali) is set when you add it.
              </span>
            </label>
          ) : (
            <label>
              Shared prompt (optional)
              <textarea
                name="prompt"
                value={fields.prompt}
                onChange={handleFieldChange}
                rows={3}
                placeholder="Shared context shown above this assessment's questions, e.g. a short scenario or set of statements."
              />
              <span className="mode-hint">
                {type === 'fill_in_blank' && 'Add standalone fill-in-the-blank questions to this assessment after creating it.'}
                {type === 'true_false' && 'Add standalone true/false statements to this assessment after creating it.'}
                {type === 'writing' && 'Add one or more written-response questions to this assessment after creating it.'}
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
                value={fields.time_limit_minutes}
                onChange={handleFieldChange}
                min={1}
                placeholder="No limit"
              />
            </label>
            <label>
              Max attempts
              <input
                type="number"
                name="max_attempts"
                value={fields.max_attempts}
                onChange={handleFieldChange}
                min={1}
                placeholder="Unlimited"
              />
            </label>
          </div>

          {formError && <p className="auth-error">{formError}</p>}

          <div className="user-form-actions">
            <button type="submit" name="intent" value="save" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save & add questions'}
            </button>
            <button
              type="submit"
              name="intent"
              value="save-new"
              className="save-new-button"
              disabled={isSubmitting}
            >
              Save &amp; create new
            </button>
            <Link to={backTo} state={backState} className="cancel-button">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
