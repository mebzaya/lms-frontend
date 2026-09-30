import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchCurrentUser, updateProfile } from '../api/auth'
import { ClassesIcon, LockIcon, ParentIcon, PencilIcon, StudentIcon, SubjectsIcon } from '../components/icons'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import '../styles/common.css'
import './Profile.css'

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export default function Profile() {
  const { user: authUser, updateUserName } = useAuth()
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)
  const [nameError, setNameError] = useState('')
  const basePath = authUser?.role === 'admin' ? '/admin' : '/dashboard'

  useEffectDeduped(() => {
    fetchCurrentUser()
      .then(setUser)
      .catch(() => setError('Could not load your profile right now.'))
  }, [])

  if (error) {
    return <p className="student-status auth-error">{error}</p>
  }

  if (!user) {
    return <p className="student-status">Loading...</p>
  }

  function startEditingName() {
    setNameValue(user.name)
    setNameError('')
    setIsEditingName(true)
  }

  function cancelEditingName() {
    setIsEditingName(false)
    setNameValue('')
    setNameError('')
  }

  async function saveName() {
    const name = nameValue.trim()
    if (!name) return
    setIsSavingName(true)
    setNameError('')
    try {
      const updated = await updateProfile(name)
      setUser(updated)
      updateUserName(updated.name)
      setIsEditingName(false)
    } catch (err) {
      const message =
        err.response?.data?.message ??
        Object.values(err.response?.data?.errors ?? {})[0]?.[0] ??
        'Could not update your name. Please try again.'
      setNameError(message)
    } finally {
      setIsSavingName(false)
    }
  }

  return (
    <div className="profile-page">
      <h1>My Profile</h1>

      <section className="profile-card">
        <div className="profile-avatar-block">
          <span className="profile-avatar">{initials(user.name)}</span>
          <div>
            {isEditingName ? (
              <span className="profile-name-edit">
                <input
                  type="text"
                  className="profile-name-input"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveName()
                    if (e.key === 'Escape') cancelEditingName()
                  }}
                  autoFocus
                  disabled={isSavingName}
                />
                <button
                  type="button"
                  className="auth-submit profile-name-save"
                  onClick={saveName}
                  disabled={isSavingName || !nameValue.trim()}
                >
                  {isSavingName ? 'Saving...' : 'Save'}
                </button>
                <button type="button" className="cancel-button" onClick={cancelEditingName} disabled={isSavingName}>
                  Cancel
                </button>
              </span>
            ) : (
              <span className="profile-name-display">
                <p className="profile-name">{user.name}</p>
                <button
                  type="button"
                  className="icon-button"
                  onClick={startEditingName}
                  aria-label="Edit your name"
                >
                  <PencilIcon />
                </button>
              </span>
            )}
            {nameError && <p className="auth-error profile-name-error">{nameError}</p>}
            <span className={`role-badge role-${user.role}`}>{user.role}</span>
          </div>
        </div>

        <dl className="profile-fields">
          <div className="profile-field">
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="profile-field">
            <dt>Member since</dt>
            <dd>{new Date(user.created_at).toLocaleDateString()}</dd>
          </div>
        </dl>

        <Link to={`${basePath}/profile/password`} className="auth-submit profile-password-link">
          <LockIcon />
          Change Password
        </Link>
      </section>

      {user.role === 'student' && (
        <section className="profile-card">
          <h2 className="profile-section-title">
            <ClassesIcon /> Class
          </h2>
          <p className="profile-plain">{user.enrolled_class ? user.enrolled_class.name : 'Not assigned to a class yet.'}</p>

          <h2 className="profile-section-title">
            <ParentIcon /> Guardians
          </h2>
          {user.parents?.length > 0 ? (
            <ul className="profile-list">
              {user.parents.map((p) => (
                <li key={p.id}>
                  {p.name} <span className="profile-list-meta">{p.email}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="profile-plain">No guardians linked yet.</p>
          )}
        </section>
      )}

      {user.role === 'teacher' && (
        <section className="profile-card">
          <h2 className="profile-section-title">
            <SubjectsIcon /> Subjects taught
          </h2>
          {user.subjects_taught?.length > 0 ? (
            <ul className="profile-list">
              {user.subjects_taught.map((s) => (
                <li key={s.id}>
                  {s.name} <span className="profile-list-meta">{s.school_class?.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="profile-plain">No subjects assigned yet.</p>
          )}
        </section>
      )}

      {user.role === 'parent' && (
        <section className="profile-card">
          <h2 className="profile-section-title">
            <StudentIcon /> Children
          </h2>
          {user.children?.length > 0 ? (
            <ul className="profile-list">
              {user.children.map((c) => (
                <li key={c.id}>
                  {c.name} <span className="profile-list-meta">{c.enrolled_class?.name ?? 'No class'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="profile-plain">No children linked yet.</p>
          )}
        </section>
      )}
    </div>
  )
}
