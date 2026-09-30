import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteSubject, fetchClasses, fetchSubjects } from '../../api/academics'
import { PencilIcon, TrashIcon } from '../../components/icons'
import SortableHeader from '../../components/SortableHeader'
import { sortRows } from '../../utils/sortRows'
import { useEffectDeduped } from '../../hooks/useEffectDeduped'
import './admin.css'

const COLUMNS = {
  name: (s) => s.name,
  class: (s) => s.school_class?.name,
  lessons_count: (s) => s.lessons_count,
}

export default function AdminSubjects() {
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [classFilter, setClassFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [sortKey, setSortKey] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')

  useEffectDeduped(() => {
    fetchClasses()
      .then(setClasses)
      .catch(() => {})
  }, [])

  useEffectDeduped(() => {
    loadSubjects()
  }, [classFilter])

  const sortedSubjects = useMemo(
    () => (sortKey ? sortRows(subjects, COLUMNS[sortKey], sortDirection) : subjects),
    [subjects, sortKey, sortDirection]
  )

  function handleSort(key) {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  async function loadSubjects() {
    setIsLoading(true)
    setListError('')
    try {
      setSubjects(await fetchSubjects(classFilter ? { class_id: classFilter } : {}))
    } catch {
      setListError('Could not load subjects.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(subject) {
    if (!window.confirm(`Delete ${subject.name}? This also deletes its lessons. This can't be undone.`))
      return

    try {
      await deleteSubject(subject.id)
      await loadSubjects()
    } catch (err) {
      setListError(err.response?.data?.message ?? 'Could not delete that subject.')
    }
  }

  return (
    <div className="admin-page">
      <h1>Subjects</h1>

      <section className="admin-panel admin-panel-single">
        <div className="user-list">
          <div className="user-list-header">
            <div className="user-list-header-left">
              <h2>Subjects</h2>
              <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                <option value="">All classes</option>
                {classes.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name}
                  </option>
                ))}
              </select>
            </div>
            <Link to="/admin/subjects/new" className="auth-submit add-button">
              + Add subject
            </Link>
          </div>

          {listError && <p className="auth-error">{listError}</p>}

          <div className="user-table-wrap">
            <table className="user-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <SortableHeader
                    label="Name"
                    sortKey="name"
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
                  <th>Teachers</th>
                  <SortableHeader
                    label="Lessons"
                    sortKey="lessons_count"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="user-table-status">
                      Loading...
                    </td>
                  </tr>
                ) : sortedSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="user-table-status">
                      No subjects found.
                    </td>
                  </tr>
                ) : (
                  sortedSubjects.map((subject, index) => (
                    <tr key={subject.id}>
                      <td>{index + 1}</td>
                      <td>{subject.name}</td>
                      <td>{subject.school_class?.name}</td>
                      <td className="user-linked">
                        {subject.teachers?.map((t) => t.name).join(', ') || '—'}
                      </td>
                      <td>{subject.lessons_count}</td>
                      <td className="user-actions">
                        <Link
                          to={`/admin/subjects/${subject.id}/edit`}
                          state={{ record: subject }}
                          className="icon-button"
                          aria-label={`Edit ${subject.name}`}
                        >
                          <PencilIcon />
                        </Link>
                        <button
                          type="button"
                          className="icon-button icon-button-danger"
                          onClick={() => handleDelete(subject)}
                          aria-label={`Delete ${subject.name}`}
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
