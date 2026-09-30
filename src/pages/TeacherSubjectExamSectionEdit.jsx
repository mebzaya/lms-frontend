import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { updateExamSection } from '../api/subjectExams'
import ExamContextBar from '../components/ExamContextBar'
import '../styles/common.css'
import './TeacherAssessmentEditor.css'

const NON_READING_HINT = {
  writing: "Manage this section's written questions from the exam page — each gets its own marks and word-count limit.",
  fill_in_blank: "Manage this section's fill-in-the-blank questions from the exam page.",
  true_false: "Manage this section's true/false statements from the exam page.",
}

function toForm(section) {
  return {
    type: section.type,
    title: section.title,
    instructions: section.instructions ?? '',
    passage: section.passage ?? '',
    prompt: section.prompt ?? '',
  }
}

export default function TeacherSubjectExamSectionEdit() {
  const { subjectId, examId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [form, setForm] = useState(location.state?.record ? toForm(location.state.record) : null)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const backTo = `/dashboard/subjects/${subjectId}/exams/${examId}`
  const backState = {
    subjectName: location.state?.subjectName,
    examTitle: location.state?.examTitle,
    classId: location.state?.classId,
    backTo: location.state?.backTo,
  }

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
      } else {
        payload.prompt = form.prompt || null
      }

      await updateExamSection(location.state.record.id, payload)
      navigate(backTo, { state: backState })
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

  if (!form) {
    return <p className="student-status auth-error">That section could not be found.</p>
  }

  return (
    <div className="admin-page form-page">
      <Link to={backTo} state={backState} className="back-link">
        &larr; Back to exam
      </Link>
      <h1>Edit section</h1>
      <ExamContextBar
        subjectName={location.state?.subjectName}
        className={location.state?.className}
        examTitle={location.state?.examTitle}
      />

      <div className="user-form-card">
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Type
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="reading">Reading</option>
              <option value="fill_in_blank">Fill in the Blanks</option>
              <option value="true_false">True / False</option>
              <option value="writing">Writing</option>
            </select>
          </label>

          <label>
            Section title
            <input type="text" name="title" value={form.title} onChange={handleChange} required />
          </label>

          <label>
            Instructions (optional)
            <input type="text" name="instructions" value={form.instructions} onChange={handleChange} />
          </label>

          {form.type === 'reading' ? (
            <label>
              Passage
              <textarea name="passage" value={form.passage} onChange={handleChange} rows={5} required />
            </label>
          ) : (
            <label>
              Prompt (optional)
              <textarea
                name="prompt"
                value={form.prompt}
                onChange={handleChange}
                rows={3}
                placeholder="Shared context shown above this section's questions, e.g. a short scenario or set of statements."
              />
              <span className="mode-hint">{NON_READING_HINT[form.type]}</span>
            </label>
          )}

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
      </div>
    </div>
  )
}
