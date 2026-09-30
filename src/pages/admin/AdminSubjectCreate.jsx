import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createSubject, fetchClasses, syncSubjectTeachers } from '../../api/academics'
import { fetchUsers } from '../../api/admin'
import { useEffectDeduped } from '../../hooks/useEffectDeduped'
import '../../styles/common.css'
import './admin.css'

const EMPTY_FIELDS = { name: '', position: '', teacherIds: [] }

export default function AdminSubjectCreate() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  const [teacherOptions, setTeacherOptions] = useState([])
  const [classId, setClassId] = useState('')
  const [fields, setFields] = useState(EMPTY_FIELDS)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffectDeduped(() => {
    fetchClasses()
      .then((data) => {
        setClasses(data)
        setClassId((prev) => prev || String(data[0]?.id ?? ''))
      })
      .catch(() => {})
    fetchUsers({ role: 'teacher', per_page: 100 })
      .then((page) => setTeacherOptions(page.data))
      .catch(() => {})
  }, [])

  function handleFieldChange(event) {
    const { name, value } = event.target
    setFields((prev) => ({ ...prev, [name]: value }))
    setSuccessMessage('')
  }

  function toggleTeacherOption(teacherId) {
    setFields((prev) => ({
      ...prev,
      teacherIds: prev.teacherIds.includes(teacherId)
        ? prev.teacherIds.filter((id) => id !== teacherId)
        : [...prev.teacherIds, teacherId],
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setIsSubmitting(true)
    const createAnother = event.nativeEvent.submitter?.value === 'save-new'

    try {
      const payload = { name: fields.name, class_id: Number(classId) }
      if (fields.position) payload.position = Number(fields.position)

      const created = await createSubject(payload)
      await syncSubjectTeachers(created.id, fields.teacherIds)

      if (createAnother) {
        setFields(EMPTY_FIELDS)
        setSuccessMessage('Subject created — add another below.')
      } else {
        navigate('/admin/subjects')
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
      <Link to="/admin/subjects" className="back-link">
        &larr; Back to subjects
      </Link>
      <h1>Add subject</h1>

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
                Select a class
              </option>
              {classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Name
            <input type="text" name="name" value={fields.name} onChange={handleFieldChange} required />
          </label>

          <div className="guardian-picker">
            <span className="guardian-picker-label">Teachers</span>
            {teacherOptions.length === 0 ? (
              <p className="guardian-picker-empty">No teacher accounts yet — create one first.</p>
            ) : (
              <div className="guardian-picker-list">
                {teacherOptions.map((teacher) => (
                  <label key={teacher.id} className="guardian-picker-option">
                    <input
                      type="checkbox"
                      checked={fields.teacherIds.includes(teacher.id)}
                      onChange={() => toggleTeacherOption(teacher.id)}
                    />
                    {teacher.name}
                  </label>
                ))}
              </div>
            )}
          </div>

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
            <Link to="/admin/subjects" className="cancel-button">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
