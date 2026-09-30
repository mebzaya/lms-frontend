import { useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { deleteLesson, fetchClasses, fetchLessons, fetchSubjects } from '../../api/academics'
import { PencilIcon, TrashIcon } from '../../components/icons'
import SortableHeader from '../../components/SortableHeader'
import { sortRows } from '../../utils/sortRows'
import { useEffectDeduped } from '../../hooks/useEffectDeduped'
import './admin.css'

const COLUMNS = {
  title: (l) => l.title,
  description: (l) => l.description,
}

export default function AdminLessons() {
  const location = useLocation()

  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  // Restored when returning from editing a lesson, so backing out doesn't
  // dump the admin back to an empty, unfiltered list.
  const [classFilter, setClassFilter] = useState(
    location.state?.classId != null ? String(location.state.classId) : ''
  )
  const [subjectFilter, setSubjectFilter] = useState(
    location.state?.subjectId != null ? String(location.state.subjectId) : ''
  )
  // The class-filter effect below normally resets subjectFilter to '' any
  // time classFilter changes (a real class switch should clear the subject
  // choice) — but that would also wipe out the subjectFilter restored above
  // on the very first run, before its own subject list has even loaded.
  const isInitialSubjectsLoad = useRef(true)

  const [lessons, setLessons] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [sortKey, setSortKey] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')

  useEffectDeduped(() => {
    fetchClasses()
      .then(setClasses)
      .catch(() => {})
  }, [])

  useEffectDeduped(() => {
    if (isInitialSubjectsLoad.current) {
      isInitialSubjectsLoad.current = false
    } else {
      setSubjectFilter('')
    }
    fetchSubjects(classFilter ? { class_id: classFilter } : {})
      .then(setSubjects)
      .catch(() => setSubjects([]))
  }, [classFilter])

  useEffectDeduped(() => {
    if (!subjectFilter) {
      setLessons([])
      return
    }
    loadLessons()
  }, [subjectFilter])

  async function loadLessons() {
    setIsLoading(true)
    setListError('')
    try {
      setLessons(await fetchLessons({ subject_id: subjectFilter }))
    } catch {
      setListError('Could not load lessons.')
    } finally {
      setIsLoading(false)
    }
  }

  const sortedLessons = useMemo(
    () => (sortKey ? sortRows(lessons, COLUMNS[sortKey], sortDirection) : lessons),
    [lessons, sortKey, sortDirection]
  )

  function handleSort(key) {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  async function handleDelete(lesson) {
    if (!window.confirm(`Delete "${lesson.title}"? This can't be undone.`)) return

    try {
      await deleteLesson(lesson.id)
      await loadLessons()
    } catch (err) {
      setListError(err.response?.data?.message ?? 'Could not delete that lesson.')
    }
  }

  return (
    <div className="admin-page">
      <h1>Lessons</h1>

      <section className="admin-panel admin-panel-single">
        <div className="user-list">
          <div className="user-list-header">
            <h2>Lessons</h2>
            <div className="user-form-actions">
              <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                <option value="">All classes</option>
                {classes.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name}
                  </option>
                ))}
              </select>
              <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
                <option value="">Select a subject…</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <Link to="/admin/lessons/new" className="auth-submit add-button">
                + Add lesson
              </Link>
            </div>
          </div>

          {listError && <p className="auth-error">{listError}</p>}

          {!subjectFilter ? (
            <p className="guardian-picker-empty">Choose a class and subject above to see its lessons.</p>
          ) : (
            <div className="user-table-wrap">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <SortableHeader
                      label="Title"
                      sortKey="title"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Description"
                      sortKey="description"
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
                      <td colSpan={4} className="user-table-status">
                        Loading...
                      </td>
                    </tr>
                  ) : sortedLessons.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="user-table-status">
                        No lessons found.
                      </td>
                    </tr>
                  ) : (
                    sortedLessons.map((lesson, index) => (
                      <tr key={lesson.id}>
                        <td>{index + 1}</td>
                        <td>{lesson.title}</td>
                        <td className="user-linked">{lesson.description || '—'}</td>
                        <td className="user-actions">
                          <Link
                            to={`/admin/lessons/${lesson.id}/edit`}
                            state={{ record: lesson }}
                            className="icon-button"
                            aria-label={`Edit ${lesson.title}`}
                          >
                            <PencilIcon />
                          </Link>
                          <button
                            type="button"
                            className="icon-button icon-button-danger"
                            onClick={() => handleDelete(lesson)}
                            aria-label={`Delete ${lesson.title}`}
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
          )}
        </div>
      </section>
    </div>
  )
}
