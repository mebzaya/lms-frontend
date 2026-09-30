import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { deleteUser, fetchUsers } from '../../api/admin'
import { AdminIcon, ParentIcon, PencilIcon, StudentIcon, TeacherIcon, TrashIcon } from '../../components/icons'
import SortableHeader from '../../components/SortableHeader'
import { sortRows } from '../../utils/sortRows'
import { useEffectDeduped } from '../../hooks/useEffectDeduped'
import './admin.css'

const ROLES = ['admin', 'teacher', 'student', 'parent']

const ROLE_ICONS = { admin: AdminIcon, teacher: TeacherIcon, student: StudentIcon, parent: ParentIcon }

function roleLabel(role) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

// A student belongs to one class; a teacher may teach several — shown as
// its own sortable column, separate from "Linked to" below, instead of
// buried inside a single combined sentence.
function classLabel(user) {
  if (user.role === 'student') {
    return user.enrolled_class?.name ?? null
  }
  if (user.role === 'teacher') {
    const names = [...new Set((user.subjects_taught ?? []).map((s) => s.school_class?.name).filter(Boolean))]
    return names.length ? names.join(', ') : null
  }
  return null
}

function linkedToText(user) {
  if (user.role === 'teacher') {
    return user.subjects_taught?.map((s) => s.name).join(', ') || '—'
  }
  if (user.role === 'student') {
    return user.parents?.map((p) => p.name).join(', ') || 'No parent linked'
  }
  if (user.role === 'parent') {
    return user.children?.map((c) => c.name).join(', ') || '—'
  }
  return '—'
}

const COLUMNS = {
  name: (u) => u.name,
  email: (u) => u.email,
  role: (u) => u.role,
  class: (u) => classLabel(u),
}

export default function AdminUsers() {
  const location = useLocation()

  const [users, setUsers] = useState([])
  // Restored when returning from editing a user, so backing out doesn't
  // dump the admin back to the unfiltered "All roles" list.
  const [roleFilter, setRoleFilter] = useState(location.state?.roleFilter ?? '')
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [listError, setListError] = useState('')
  const [sortKey, setSortKey] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')

  useEffectDeduped(() => {
    loadUsers()
  }, [roleFilter])

  const sortedUsers = useMemo(
    () => (sortKey ? sortRows(users, COLUMNS[sortKey], sortDirection) : users),
    [users, sortKey, sortDirection]
  )

  function handleSort(key) {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  async function loadUsers() {
    setIsLoadingUsers(true)
    setListError('')
    try {
      const page = await fetchUsers(roleFilter ? { role: roleFilter } : {})
      setUsers(page.data)
    } catch {
      setListError('Could not load users.')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Delete ${user.name}? This can't be undone.`)) return

    try {
      await deleteUser(user.id)
      await loadUsers()
    } catch (err) {
      setListError(err.response?.data?.message ?? 'Could not delete that user.')
    }
  }

  return (
    <div className="admin-page">
      <h1>Users</h1>

      <section className="admin-panel admin-panel-single">
        <div className="user-list">
          <div className="user-list-header">
            <h2>Users</h2>
            <Link to="/admin/users/new" className="auth-submit add-button">
              + Add user
            </Link>
          </div>

          <div className="role-filter-row">
            <button
              type="button"
              className={`role-pill${roleFilter === '' ? ' role-pill-selected' : ''}`}
              onClick={() => setRoleFilter('')}
            >
              All
            </button>
            {ROLES.map((role) => {
              const Icon = ROLE_ICONS[role]
              return (
                <button
                  type="button"
                  key={role}
                  className={`role-pill${roleFilter === role ? ' role-pill-selected' : ''}`}
                  onClick={() => setRoleFilter(role)}
                >
                  <Icon />
                  {roleLabel(role)}
                </button>
              )
            })}
          </div>

          {listError && <p className="auth-error">{listError}</p>}

          <div className="user-table-wrap">
            <table className="user-table">
              <thead>
                <tr>
                  <SortableHeader
                    label="Name"
                    sortKey="name"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Email"
                    sortKey="email"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Role"
                    sortKey="role"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Class"
                    sortKey="class"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <th>Linked to</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {isLoadingUsers ? (
                  <tr>
                    <td colSpan={6} className="user-table-status">
                      Loading...
                    </td>
                  </tr>
                ) : sortedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="user-table-status">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  sortedUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge role-${user.role}`}>{roleLabel(user.role)}</span>
                      </td>
                      <td>{classLabel(user) ?? '—'}</td>
                      <td className="user-linked">{linkedToText(user)}</td>
                      <td className="user-actions">
                        <Link
                          to={`/admin/users/${user.id}/edit`}
                          state={{ record: user }}
                          className="icon-button"
                          aria-label={`Edit ${user.name}`}
                        >
                          <PencilIcon />
                        </Link>
                        <button
                          type="button"
                          className="icon-button icon-button-danger"
                          onClick={() => handleDelete(user)}
                          aria-label={`Delete ${user.name}`}
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
