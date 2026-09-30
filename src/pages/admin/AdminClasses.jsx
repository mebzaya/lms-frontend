import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteClass, fetchClasses } from '../../api/academics'
import { PencilIcon, StudentIcon, SubjectsIcon, TeacherIcon, TrashIcon } from '../../components/icons'
import SortableHeader from '../../components/SortableHeader'
import { sortRows } from '../../utils/sortRows'
import { useEffectDeduped } from '../../hooks/useEffectDeduped'
import './admin.css'

const COLUMNS = {
  level: (c) => c.level,
  name: (c) => c.name,
  subjects_count: (c) => c.subjects_count,
  students_count: (c) => c.students_count,
  teachers_count: (c) => c.teachers_count,
}

export default function AdminClasses() {
  const [classes, setClasses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [sortKey, setSortKey] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')

  useEffectDeduped(() => {
    loadClasses()
  }, [])

  const sortedClasses = useMemo(
    () => (sortKey ? sortRows(classes, COLUMNS[sortKey], sortDirection) : classes),
    [classes, sortKey, sortDirection]
  )

  function handleSort(key) {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  async function loadClasses() {
    setIsLoading(true)
    setListError('')
    try {
      setClasses(await fetchClasses())
    } catch {
      setListError('Could not load classes.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(schoolClass) {
    if (
      !window.confirm(
        `Delete ${schoolClass.name}? This also deletes its subjects and lessons. This can't be undone.`
      )
    )
      return

    try {
      await deleteClass(schoolClass.id)
      await loadClasses()
    } catch (err) {
      setListError(err.response?.data?.message ?? 'Could not delete that class.')
    }
  }

  return (
    <div className="admin-page">
      <h1>Classes</h1>

      <section className="admin-panel admin-panel-single">
        <div className="user-list">
          <div className="user-list-header">
            <h2>Classes</h2>
            <Link to="/admin/classes/new" className="auth-submit add-button">
              + Add class
            </Link>
          </div>

          {listError && <p className="auth-error">{listError}</p>}

          <div className="user-table-wrap">
            <table className="user-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <SortableHeader
                    label="Level"
                    sortKey="level"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Name"
                    sortKey="name"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Subjects"
                    sortKey="subjects_count"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Students"
                    sortKey="students_count"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Teachers"
                    sortKey="teachers_count"
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
                    <td colSpan={7} className="user-table-status">
                      Loading...
                    </td>
                  </tr>
                ) : sortedClasses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="user-table-status">
                      No classes found.
                    </td>
                  </tr>
                ) : (
                  sortedClasses.map((schoolClass, index) => (
                    <tr key={schoolClass.id}>
                      <td>{index + 1}</td>
                      <td>{schoolClass.level}</td>
                      <td>{schoolClass.name}</td>
                      <td>
                        <span className="stat-pill">
                          <SubjectsIcon />
                          {schoolClass.subjects_count}
                        </span>
                      </td>
                      <td>
                        <span className="stat-pill">
                          <StudentIcon />
                          {schoolClass.students_count}
                        </span>
                      </td>
                      <td>
                        <span className="stat-pill">
                          <TeacherIcon />
                          {schoolClass.teachers_count}
                        </span>
                      </td>
                      <td className="user-actions">
                        <Link
                          to={`/admin/classes/${schoolClass.id}/edit`}
                          state={{ record: schoolClass }}
                          className="icon-button"
                          aria-label={`Edit ${schoolClass.name}`}
                        >
                          <PencilIcon />
                        </Link>
                        <button
                          type="button"
                          className="icon-button icon-button-danger"
                          onClick={() => handleDelete(schoolClass)}
                          aria-label={`Delete ${schoolClass.name}`}
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
