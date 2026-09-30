import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createClass } from '../../api/academics'
import '../../styles/common.css'
import './admin.css'

const EMPTY_FORM = { name: '', level: '', position: '' }

export default function AdminClassCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setSuccessMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setIsSubmitting(true)
    const createAnother = event.nativeEvent.submitter?.value === 'save-new'

    try {
      const payload = { name: form.name, level: Number(form.level) }
      if (form.position) payload.position = Number(form.position)

      await createClass(payload)

      if (createAnother) {
        setForm(EMPTY_FORM)
        setSuccessMessage('Class created — add another below.')
      } else {
        navigate('/admin/classes')
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
      <Link to="/admin/classes" className="back-link">
        &larr; Back to classes
      </Link>
      <h1>Add class</h1>

      <div className="user-form-card">
        {successMessage && <p className="form-success">{successMessage}</p>}

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
            <Link to="/admin/classes" className="cancel-button">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
