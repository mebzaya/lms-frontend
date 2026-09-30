import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUser, fetchUsers, syncStudentParents, syncTeacherSubjects } from '../../api/admin'
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
const EMPTY_FIELDS = { name: '', email: '', password: '', classId: '', parentIds: [], subjectIds: [] }

const ROLE_ICONS = { admin: AdminIcon, teacher: TeacherIcon, student: StudentIcon, parent: ParentIcon }

function roleLabel(role) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export default function AdminUserCreate() {
  const navigate = useNavigate()
  const [parentOptions, setParentOptions] = useState([])
  const [classOptions, setClassOptions] = useState([])
  const [subjectOptions, setSubjectOptions] = useState([])
  const [role, setRole] = useState('student')
  const [fields, setFields] = useState(EMPTY_FIELDS)
  const [parentSearch, setParentSearch] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function loadOptions() {
    fetchUsers({ role: 'parent', per_page: 100 })
      .then((page) => setParentOptions(page.data))
      .catch(() => {})
    fetchClasses()
      .then(setClassOptions)
      .catch(() => {})
    fetchSubjects()
      .then(setSubjectOptions)
      .catch(() => {})
  }

  useEffectDeduped(() => {
    loadOptions()
  }, [])

  const filteredParents = parentOptions.filter((parent) =>
    parent.name.toLowerCase().includes(parentSearch.trim().toLowerCase())
  )

  function handleFieldChange(event) {
    const { name, value } = event.target
    setFields((prev) => ({ ...prev, [name]: value }))
    setSuccessMessage('')
  }

  function toggleParentOption(parentId) {
    setFields((prev) => ({
      ...prev,
      parentIds: prev.parentIds.includes(parentId)
        ? prev.parentIds.filter((id) => id !== parentId)
        : [...prev.parentIds, parentId],
    }))
  }

  function toggleSubjectOption(subjectId) {
    setFields((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(subjectId)
        ? prev.subjectIds.filter((id) => id !== subjectId)
        : [...prev.subjectIds, subjectId],
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setIsSubmitting(true)
    const createAnother = event.nativeEvent.submitter?.value === 'save-new'

    try {
      const payload = { name: fields.name, email: fields.email, password: fields.password, role }
      if (role === 'student') {
        payload.class_id = fields.classId ? Number(fields.classId) : null
      }

      const created = await createUser(payload)

      if (role === 'student') {
        await syncStudentParents(created.id, fields.parentIds)
      } else if (role === 'teacher') {
        await syncTeacherSubjects(created.id, fields.subjectIds)
      }

      if (createAnother) {
        setFields((prev) => ({ ...EMPTY_FIELDS, classId: role === 'student' ? prev.classId : '' }))
        setParentSearch('')
        setShowPassword(false)
        setSuccessMessage('User created — add another below.')
        loadOptions()
      } else {
        navigate('/admin/users')
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
      <Link to="/admin/users" className="back-link">
        &larr; Back to users
      </Link>
      <h1>Add user</h1>

      <div className="user-form-card user-form-card-rich">
        {successMessage && <p className="form-success">{successMessage}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-group-label">Role</div>
          <div className="role-picker">
            {ROLES.map((r) => {
              const Icon = ROLE_ICONS[r]
              const selected = role === r
              return (
                <button
                  key={r}
                  type="button"
                  className={`role-pill${selected ? ' role-pill-selected' : ''}`}
                  onClick={() => {
                    setRole(r)
                    setSuccessMessage('')
                  }}
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
              <input type="text" name="name" value={fields.name} onChange={handleFieldChange} required />
            </label>

            <label>
              Email
              <input type="email" name="email" value={fields.email} onChange={handleFieldChange} required />
            </label>
          </div>

          {role === 'student' && (
            <>
              <label>
                Class
                <select name="classId" value={fields.classId} onChange={handleFieldChange}>
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
                  <button
                    type="button"
                    className="guardian-picker-refresh"
                    onClick={() =>
                      fetchUsers({ role: 'parent', per_page: 100 })
                        .then((page) => setParentOptions(page.data))
                        .catch(() => {})
                    }
                  >
                    Refresh list
                  </button>
                </div>

                {fields.parentIds.length > 0 && (
                  <div className="guardian-chip-row">
                    {fields.parentIds.map((id) => {
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
                          const selected = fields.parentIds.includes(parent.id)
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
                              <span className="guardian-option-check">
                                {selected && <CheckIcon />}
                              </span>
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

          {role === 'teacher' && (
            <div className="guardian-picker">
              <span className="guardian-picker-label">Subjects taught</span>
              {subjectOptions.length === 0 ? (
                <p className="guardian-picker-empty">No subjects yet — create one first.</p>
              ) : (
                <div className="guardian-picker-list">
                  {subjectOptions.map((subject) => {
                    const selected = fields.subjectIds.includes(subject.id)
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
                          {subject.name} <span className="guardian-option-meta">— {subject.school_class?.name}</span>
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
            Password
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={fields.password}
                onChange={handleFieldChange}
                required
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
            <Link to="/admin/users" className="cancel-button">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
