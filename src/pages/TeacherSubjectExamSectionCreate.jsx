import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { createExamSection } from '../api/subjectExams'
import ExamContextBar from '../components/ExamContextBar'
import '../styles/common.css'
import './TeacherAssessmentEditor.css'

const EMPTY_FIELDS = {
  title: '',
  instructions: '',
  passage: '',
  prompt: '',
}

const SECTION_TITLE_PLACEHOLDER = {
  reading: 'Reading Comprehension',
  writing: 'Written Responses',
  fill_in_blank: 'Fill in the Blanks',
  true_false: 'True or False',
}

const NON_READING_HINT = {
  writing: 'Add each written question (short answer or essay) to this section after creating it — every question gets its own marks and word-count limit.',
  fill_in_blank: 'Add standalone fill-in-the-blank questions to this section after creating it.',
  true_false: 'Add standalone true/false statements to this section after creating it.',
}

export default function TeacherSubjectExamSectionCreate() {
  const { subjectId, examId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [type, setType] = useState('reading')
  const [fields, setFields] = useState(EMPTY_FIELDS)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const backTo = `/dashboard/subjects/${subjectId}/exams/${examId}`
  const backState = {
    subjectName: location.state?.subjectName,
    examTitle: location.state?.examTitle,
    classId: location.state?.classId,
    backTo: location.state?.backTo,
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
        type,
        title: fields.title,
        instructions: fields.instructions || null,
      }
      if (type === 'reading') {
        payload.passage = fields.passage
      } else if (fields.prompt) {
        payload.prompt = fields.prompt
      }

      await createExamSection(examId, payload)

      if (createAnother) {
        setFields(EMPTY_FIELDS)
        setSuccessMessage('Section created — add another below.')
      } else {
        navigate(backTo, { state: backState })
      }
    } catch (err) {
      setFormError(
        err.response?.data?.message ??
          Object.values(err.response?.data?.errors ?? {})[0]?.[0] ??
          'Something went wrong. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="admin-page form-page">
      <Link to={backTo} state={backState} className="back-link">
        &larr; Back to exam
      </Link>
      <h1>Add section</h1>
      <ExamContextBar
        subjectName={location.state?.subjectName}
        className={location.state?.className}
        examTitle={location.state?.examTitle}
      />

      <div className="user-form-card">
        {successMessage && <p className="form-success">{successMessage}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
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
              <option value="fill_in_blank">Fill in the Blanks</option>
              <option value="true_false">True / False</option>
              <option value="writing">Writing</option>
            </select>
          </label>

          <label>
            Section title
            <input
              type="text"
              name="title"
              value={fields.title}
              onChange={handleFieldChange}
              placeholder={SECTION_TITLE_PLACEHOLDER[type]}
              required
            />
          </label>

          <label>
            Instructions (optional)
            <input type="text" name="instructions" value={fields.instructions} onChange={handleFieldChange} />
          </label>

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
              Prompt (optional)
              <textarea
                name="prompt"
                value={fields.prompt}
                onChange={handleFieldChange}
                rows={3}
                placeholder="Shared context shown above this section's questions, e.g. a short scenario or set of statements."
              />
              <span className="mode-hint">{NON_READING_HINT[type]}</span>
            </label>
          )}

          {formError && <p className="auth-error">{formError}</p>}

          <div className="user-form-actions">
            <button type="submit" name="intent" value="save" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
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
