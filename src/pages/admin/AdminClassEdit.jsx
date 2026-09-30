import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchClasses, updateClass } from '../../api/academics'
import { useEffectDeduped } from '../../hooks/useEffectDeduped'
import '../../styles/common.css'
import './admin.css'

function toForm(schoolClass) {
  return {
    name: schoolClass.name,
    level: String(schoolClass.level),
    position: String(schoolClass.position),
  }
}

export default function AdminClassEdit() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [form, setForm] = useState(location.state?.record ? toForm(location.state.record) : null)
  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffectDeduped(() => {
    if (form) return
    fetchClasses()
      .then((classes) => {
        const match = classes.find((c) => String(c.id) === id)
        if (match) {
          setForm(toForm(match))
        } else {
          setLoadError('That class could not be found.')
        }
      })
      .catch(() => setLoadError('Could not load that class.'))
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
      const payload = { name: form.name, level: Number(form.level) }
      if (form.position) payload.position = Number(form.position)

      await updateClass(id, payload)
      navigate('/admin/classes')
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
      <Link to="/admin/classes" className="back-link">
        &larr; Back to classes
      </Link>
      <h1>Edit class</h1>

      <div className="user-form-card">
        {loadError && <p className="auth-error">{loadError}</p>}

        {form && (
          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Name
              <input type="text" name="name" value={form.name} onChange={handleChange} required />
            </label>

            <label>
              Level
              <input
                type="number"
                name="level"
                value={form.level}
                onChange={handleChange}
                required
                min={1}
                max={255}
              />
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
              <Link to="/admin/classes" className="cancel-button">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
