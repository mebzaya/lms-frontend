import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { fetchClasses } from '../../api/academics'
import { createAdminExam } from '../../api/adminExams'
import { useEffectDeduped } from '../../hooks/useEffectDeduped'
import '../../styles/common.css'
import './admin.css'

const EMPTY_FIELDS = { title: '', instructions: '' }

export default function AdminExamCreate() {
  const navigate = useNavigate()
  const location = useLocation()

  const [classes, setClasses] = useState([])
  const [classId, setClassId] = useState(location.state?.classId ? String(location.state.classId) : '')
  const [fields, setFields] = useState(EMPTY_FIELDS)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffectDeduped(() => {
    fetchClasses()
      .then(setClasses)
      .catch(() => {})
  }, [])

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
      const created = await createAdminExam({
        class_id: Number(classId),
        title: fields.title,
        instructions: fields.instructions || null,
      })

      if (createAnother) {
        setFields(EMPTY_FIELDS)
        setSuccessMessage('Exam scheduled — add another below.')
      } else {
        navigate(`/admin/exams/${created.id}`, { state: { classId } })
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
      <Link to="/admin/exams" state={{ classId }} className="back-link">
        &larr; Back to exams
      </Link>
      <h1>Schedule an exam</h1>
      <p className="auth-card-subtitle">
        This creates a paper for every subject in the class, for each subject's teacher(s) to add sections and
        questions to. You'll set the opening/closing window when you publish it, once every subject has content.
      </p>

      <div className="user-form-card">
        {successMessage && <p className="form-success">{successMessage}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Class
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value)
                setSuccessMessage('')
              }}
              required
            >
              <option value="" disabled>
                Select a class…
              </option>
              {classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Title
            <input
              type="text"
              name="title"
              value={fields.title}
              onChange={handleFieldChange}
              placeholder="e.g. First-Term"
              required
            />
          </label>

          <label>
            Instructions (optional)
            <textarea name="instructions" value={fields.instructions} onChange={handleFieldChange} rows={3} />
          </label>

          {formError && <p className="auth-error">{formError}</p>}

          <div className="user-form-actions">
            <button
              type="submit"
              name="intent"
              value="save"
              className="auth-submit"
              disabled={isSubmitting || !classId}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
            <button
              type="submit"
              name="intent"
              value="save-new"
              className="save-new-button"
              disabled={isSubmitting || !classId}
            >
              Save &amp; create new
            </button>
            <Link to="/admin/exams" state={{ classId }} className="cancel-button">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
