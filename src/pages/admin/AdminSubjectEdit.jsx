import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchClasses, fetchSubjects, syncSubjectTeachers, updateSubject } from '../../api/academics'
import { fetchUsers } from '../../api/admin'
import { useEffectDeduped } from '../../hooks/useEffectDeduped'
import '../../styles/common.css'
import './admin.css'

function toForm(subject) {
  return {
    name: subject.name,
    class_id: String(subject.class_id),
    position: String(subject.position),
    teacherIds: (subject.teachers ?? []).map((teacher) => teacher.id),
  }
}

export default function AdminSubjectEdit() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [classes, setClasses] = useState([])
  const [teacherOptions, setTeacherOptions] = useState([])
  const [form, setForm] = useState(location.state?.record ? toForm(location.state.record) : null)
  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffectDeduped(() => {
    fetchClasses()
      .then(setClasses)
      .catch(() => {})
    fetchUsers({ role: 'teacher', per_page: 100 })
      .then((page) => setTeacherOptions(page.data))
      .catch(() => {})
  }, [])

  useEffectDeduped(() => {
    if (form) return
    fetchSubjects()
      .then((subjects) => {
        const match = subjects.find((s) => String(s.id) === id)
        if (match) {
          setForm(toForm(match))
        } else {
          setLoadError('That subject could not be found.')
        }
      })
      .catch(() => setLoadError('Could not load that subject.'))
  }, [id])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function toggleTeacherOption(teacherId) {
    setForm((prev) => ({
      ...prev,
      teacherIds: prev.teacherIds.includes(teacherId)
        ? prev.teacherIds.filter((tid) => tid !== teacherId)
        : [...prev.teacherIds, teacherId],
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setIsSubmitting(true)

    try {
      const payload = { name: form.name, class_id: Number(form.class_id) }
      if (form.position) payload.position = Number(form.position)

      await updateSubject(id, payload)
      await syncSubjectTeachers(id, form.teacherIds)

      navigate('/admin/subjects')
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
      <h1>Edit subject</h1>

      <div className="user-form-card">
        {loadError && <p className="auth-error">{loadError}</p>}

        {form && (
          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Class
              <select name="class_id" value={form.class_id} onChange={handleChange} required>
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
              <input type="text" name="name" value={form.name} onChange={handleChange} required />
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
                        checked={form.teacherIds.includes(teacher.id)}
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
                value={form.position}
                onChange={handleChange}
                min={1}
                placeholder="Auto"
              />
            </label>

            {formError && <p className="auth-error">{formError}</p>}

            <div className="user-form-actions">
              <button type="submit" className="auth-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save changes'}
              </button>
              <Link to="/admin/subjects" className="cancel-button">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
