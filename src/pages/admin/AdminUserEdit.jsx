import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchUsers, syncStudentParents, syncTeacherSubjects, updateUser } from '../../api/admin'
import { fetchClasses, fetchSubjects } from '../../api/academics'
import {
  AdminIcon,
  CheckIcon,
  EyeIcon,
  ParentIcon,
  StudentIcon,
  SubjectsIcon,
  TeacherIcon,
} from '../../components/icons'
import { useEffectDeduped } from '../../hooks/useEffectDeduped'
import '../../styles/common.css'
import './admin.css'

const ROLES = ['admin', 'teacher', 'student', 'parent']

const ROLE_ICONS = { admin: AdminIcon, teacher: TeacherIcon, student: StudentIcon, parent: ParentIcon }

function roleLabel(role) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

function toForm(user) {
  return {
    name: user.name,
    email: user.email,
    password: '',
    role: user.role,
    classId: user.enrolled_class ? String(user.enrolled_class.id) : '',
    parentIds: (user.parents ?? []).map((parent) => parent.id),
    subjectIds: (user.subjects_taught ?? []).map((subject) => subject.id),
  }
}

export default function AdminUserEdit() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [parentOptions, setParentOptions] = useState([])
  const [classOptions, setClassOptions] = useState([])
  const [subjectOptions, setSubjectOptions] = useState([])
  const [form, setForm] = useState(location.state?.record ? toForm(location.state.record) : null)
  // The role filter the list page was showing when this user was opened —
  // restored on the way back so backing out doesn't dump the admin onto the
  // unfiltered "All roles" list.
  const backState = { roleFilter: location.state?.record?.role }
  const [parentSearch, setParentSearch] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function refreshParentOptions() {
    fetchUsers({ role: 'parent', per_page: 100 })
      .then((page) => setParentOptions(page.data))
      .catch(() => {})
  }

  useEffectDeduped(() => {
    refreshParentOptions()
    fetchClasses()
      .then(setClassOptions)
      .catch(() => {})
    fetchSubjects()
      .then(setSubjectOptions)
      .catch(() => {})
  }, [])

  const filteredParents = parentOptions.filter((parent) =>
    parent.name.toLowerCase().includes(parentSearch.trim().toLowerCase())
  )

  useEffectDeduped(() => {
    if (form) return
    fetchUsers({ per_page: 200 })
      .then((page) => {
        const match = page.data.find((u) => String(u.id) === id)
        if (match) {
          setForm(toForm(match))
        } else {
          setLoadError('That user could not be found.')
        }
      })
      .catch(() => setLoadError('Could not load that user.'))
  }, [id])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function setRoleValue(r) {
    setForm((prev) => ({ ...prev, role: r }))
  }

  function toggleParentOption(parentId) {
    setForm((prev) => ({
      ...prev,
      parentIds: prev.parentIds.includes(parentId)
        ? prev.parentIds.filter((pid) => pid !== parentId)
        : [...prev.parentIds, parentId],
    }))
  }

  function toggleSubjectOption(subjectId) {
    setForm((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(subjectId)
        ? prev.subjectIds.filter((sid) => sid !== subjectId)
        : [...prev.subjectIds, subjectId],
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setIsSubmitting(true)

    try {
      const { parentIds, subjectIds, classId, ...fields } = form

      const payload = { ...fields }
      if (fields.role === 'student') {
        payload.class_id = classId ? Number(classId) : null
      }
      if (!payload.password) delete payload.password

      await updateUser(id, payload)

      if (fields.role === 'student') {
        await syncStudentParents(id, parentIds)
      } else if (fields.role === 'teacher') {
        await syncTeacherSubjects(id, subjectIds)
      }

      navigate('/admin/users', { state: backState })
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
      <Link to="/admin/users" state={backState} className="back-link">
        &larr; Back to users
      </Link>
      <h1>Edit user</h1>

      <div className="user-form-card user-form-card-rich">
        {loadError && <p className="auth-error">{loadError}</p>}

        {form && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field-group-label">Role</div>
            <div className="role-picker">
              {ROLES.map((r) => {
                const Icon = ROLE_ICONS[r]
                const selected = form.role === r
                return (
                  <button
                    key={r}
                    type="button"
                    className={`role-pill${selected ? ' role-pill-selected' : ''}`}
                    onClick={() => setRoleValue(r)}
                    aria-pressed={selected}
                  >
                    <Icon />
                    {roleLabel(r)}
                  </button>
                )
              })}
            </div>

            <div className="field-row">
              <label>
                Full name
                <input type="text" name="name" value={form.name} onChange={handleChange} required />
              </label>

              <label>
                Email
                <input type="email" name="email" value={form.email} onChange={handleChange} required />
              </label>
            </div>

            {form.role === 'student' && (
              <>
                <label>
                  Class
                  <select name="classId" value={form.classId} onChange={handleChange}>
                    <option value="">No class</option>
                    {classOptions.map((schoolClass) => (
                      <option key={schoolClass.id} value={schoolClass.id}>
                        {schoolClass.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="guardian-picker">
                  <div className="guardian-picker-header">
                    <span className="guardian-picker-label">Parents / guardians</span>
                    <button type="button" className="guardian-picker-refresh" onClick={refreshParentOptions}>
                      Refresh list
                    </button>
                  </div>

                  {form.parentIds.length > 0 && (
                    <div className="guardian-chip-row">
                      {form.parentIds.map((id) => {
                        const parent = parentOptions.find((p) => p.id === id)
                        if (!parent) return null
                        return (
                          <span key={id} className="guardian-chip">
                            {parent.name}
                            <button
                              type="button"
                              className="guardian-chip-remove"
                              onClick={() => toggleParentOption(id)}
                              aria-label={`Remove ${parent.name}`}
                            >
                              &times;
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  )}

                  {parentOptions.length === 0 ? (
                    <p className="guardian-picker-empty">No parent accounts yet — create one first.</p>
                  ) : (
                    <>
                      <input
                        type="search"
                        className="guardian-picker-search"
                        placeholder="Search parents by name..."
                        value={parentSearch}
                        onChange={(e) => setParentSearch(e.target.value)}
                      />
                      {filteredParents.length === 0 ? (
                        <p className="guardian-picker-empty">No parents match "{parentSearch}".</p>
                      ) : (
                        <div className="guardian-picker-list">
                          {filteredParents.map((parent) => {
                            const selected = form.parentIds.includes(parent.id)
                            return (
                              <button
                                type="button"
                                key={parent.id}
                                className={`guardian-option-row${selected ? ' guardian-option-row-selected' : ''}`}
                                onClick={() => toggleParentOption(parent.id)}
                                aria-pressed={selected}
                              >
                                <span className="guardian-option-avatar">{initials(parent.name)}</span>
                                <span className="guardian-option-name">{parent.name}</span>
                                <span className="guardian-option-check">{selected && <CheckIcon />}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {form.role === 'teacher' && (
              <div className="guardian-picker">
                <span className="guardian-picker-label">Subjects taught</span>
                {subjectOptions.length === 0 ? (
                  <p className="guardian-picker-empty">No subjects yet — create one first.</p>
                ) : (
                  <div className="guardian-picker-list">
                    {subjectOptions.map((subject) => {
                      const selected = form.subjectIds.includes(subject.id)
                      return (
                        <button
                          type="button"
                          key={subject.id}
                          className={`guardian-option-row${selected ? ' guardian-option-row-selected' : ''}`}
                          onClick={() => toggleSubjectOption(subject.id)}
                          aria-pressed={selected}
                        >
                          <span className="guardian-option-icon">
                            <SubjectsIcon />
                          </span>
                          <span className="guardian-option-name">
                            {subject.name}{' '}
                            <span className="guardian-option-meta">— {subject.school_class?.name}</span>
                          </span>
                          <span className="guardian-option-check">{selected && <CheckIcon />}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <label>
              New password (optional)
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  minLength={8}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </label>

            {formError && <p className="auth-error">{formError}</p>}

            <div className="user-form-actions">
              <button type="submit" className="auth-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save changes'}
              </button>
              <Link to="/admin/users" state={backState} className="cancel-button">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
