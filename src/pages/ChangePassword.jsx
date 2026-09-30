import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { changePassword } from '../api/auth'
import { EyeIcon } from '../components/icons'
import '../styles/common.css'
import './Profile.css'

const EMPTY_FORM = { current_password: '', password: '', password_confirmation: '' }

export default function ChangePassword() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const basePath = user?.role === 'admin' ? '/admin' : '/dashboard'

  const [form, setForm] = useState(EMPTY_FORM)
  const [visibility, setVisibility] = useState({ current_password: false, password: false, password_confirmation: false })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function toggleVisibility(field) {
    setVisibility((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)

    try {
      await changePassword(form.current_password, form.password, form.password_confirmation)
      setSuccess('Your password has been updated.')
      setForm(EMPTY_FORM)
    } catch (err) {
      const message =
        err.response?.data?.message ??
        Object.values(err.response?.data?.errors ?? {})[0]?.[0] ??
        'Could not update your password. Please try again.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function renderPasswordField(name, label, autoComplete) {
    return (
      <label>
        {label}
        <div className="password-field">
          <input
            type={visibility[name] ? 'text' : 'password'}
            name={name}
            value={form[name]}
            onChange={handleChange}
            required
            minLength={name === 'current_password' ? undefined : 8}
            autoComplete={autoComplete}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => toggleVisibility(name)}
            aria-label={visibility[name] ? 'Hide password' : 'Show password'}
            aria-pressed={visibility[name]}
          >
            <EyeIcon open={visibility[name]} />
          </button>
        </div>
      </label>
    )
  }

  return (
    <div className="profile-page">
      <Link to={`${basePath}/profile`} className="back-link">
        &larr; My Profile
      </Link>
      <h1>Change Password</h1>

      <section className="profile-card">
        <form onSubmit={handleSubmit} className="auth-form">
          {renderPasswordField('current_password', 'Current password', 'current-password')}
          {renderPasswordField('password', 'New password', 'new-password')}
          {renderPasswordField('password_confirmation', 'Confirm new password', 'new-password')}

          {error && <p className="auth-error">{error}</p>}
          {success && (
            <p className="profile-success">
              {success}{' '}
              <button type="button" className="profile-success-link" onClick={() => navigate(`${basePath}/profile`)}>
                Back to profile
              </button>
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </section>
    </div>
  )
}
