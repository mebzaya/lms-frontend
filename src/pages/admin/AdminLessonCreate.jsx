import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createLesson, fetchClasses, fetchSubjects } from '../../api/academics'
import { useEffectDeduped } from '../../hooks/useEffectDeduped'
import '../../styles/common.css'
import './admin.css'

const EMPTY_FIELDS = { title: '', description: '', position: '' }

export default function AdminLessonCreate() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [fields, setFields] = useState(EMPTY_FIELDS)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffectDeduped(() => {
    fetchClasses()
      .then(setClasses)
      .catch(() => {})
  }, [])

  useEffectDeduped(() => {
    fetchSubjects(classId ? { class_id: classId } : {})
      .then((data) => {
        setSubjects(data)
        setSubjectId((prev) => (data.some((s) => String(s.id) === prev) ? prev : ''))
      })
      .catch(() => setSubjects([]))
  }, [classId])

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
        subject_id: Number(subjectId),
        title: fields.title,
        description: fields.description || null,
      }
      if (fields.position) payload.position = Number(fields.position)

      await createLesson(payload)

      if (createAnother) {
        setFields(EMPTY_FIELDS)
        setSuccessMessage('Lesson created — add another below.')
      } else {
        navigate('/admin/lessons')
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
      <Link to="/admin/lessons" className="back-link">
        &larr; Back to lessons
      </Link>
      <h1>Add lesson</h1>

      <div className="user-form-card">
        {successMessage && <p className="form-success">{successMessage}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-row">
            <label>
              Class
              <select
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value)
                  setSuccessMessage('')
                }}
              >
                <option value="">All classes</option>
                {classes.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Subject
              <select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value)
                  setSuccessMessage('')
                }}
                required
              >
                <option value="" disabled>
                  Select a subject…
                </option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Title
            <input type="text" name="title" value={fields.title} onChange={handleFieldChange} required />
          </label>

          <label>
            Description
            <input type="text" name="description" value={fields.description} onChange={handleFieldChange} />
          </label>

          <label>
            Position
            <input
              type="number"
              name="position"
              value={fields.position}
              onChange={handleFieldChange}
              min={1}
              placeholder="Auto"
            />
          </label>

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
            <Link to="/admin/lessons" className="cancel-button">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
