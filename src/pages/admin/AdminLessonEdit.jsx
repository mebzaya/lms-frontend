import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchLessons, updateLesson } from '../../api/academics'
import { useEffectDeduped } from '../../hooks/useEffectDeduped'
import '../../styles/common.css'
import './admin.css'

function toForm(lesson) {
  return {
    title: lesson.title,
    description: lesson.description ?? '',
    position: String(lesson.position),
  }
}

export default function AdminLessonEdit() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [form, setForm] = useState(location.state?.record ? toForm(location.state.record) : null)
  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // The lesson record already carries its subject (and that subject's
  // class), so the class/subject filters on the list page can be restored
  // without the list needing to separately thread them through itself.
  const backState = {
    classId: location.state?.record?.subject?.class_id,
    subjectId: location.state?.record?.subject_id,
  }

  useEffectDeduped(() => {
    if (form) return
    fetchLessons()
      .then((lessons) => {
        const match = lessons.find((l) => String(l.id) === id)
        if (match) {
          setForm(toForm(match))
        } else {
          setLoadError('That lesson could not be found.')
        }
      })
      .catch(() => setLoadError('Could not load that lesson.'))
  }, [id])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setIsSubmitting(true)

    try {
      const payload = { title: form.title, description: form.description || null }
      if (form.position) payload.position = Number(form.position)

      await updateLesson(id, payload)
      navigate('/admin/lessons', { state: backState })
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
      <Link to="/admin/lessons" state={backState} className="back-link">
        &larr; Back to lessons
      </Link>
      <h1>Edit lesson</h1>

      <div className="user-form-card">
        {loadError && <p className="auth-error">{loadError}</p>}

        {form && (
          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Title
              <input type="text" name="title" value={form.title} onChange={handleChange} required />
            </label>

            <label>
              Description
              <input type="text" name="description" value={form.description} onChange={handleChange} />
            </label>

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
              <Link to="/admin/lessons" state={backState} className="cancel-button">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
