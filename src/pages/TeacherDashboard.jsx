import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { createLesson, endLesson, fetchTeacherDashboard, startLesson, updateLesson } from '../api/teacher'
import { ClassesIcon, PencilIcon, PlayIcon, StopIcon, SubjectsIcon } from '../components/icons'
import { LESSON_STATUS_LABEL, lessonStatus } from '../utils/lessonStatus'
import { CONTENT_STATUS_LABEL, contentStatus } from '../utils/contentStatus'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import '../styles/lessonStatus.css'
import './TeacherDashboard.css'

export default function TeacherDashboard() {
  const location = useLocation()

  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingLessonId, setPendingLessonId] = useState(null)
  // Restored from location.state when a teacher navigates back from a
  // lesson's content/assessments editor, so "back" lands them on that
  // subject's lesson list instead of resetting to the class picker.
  const [selectedClassId, setSelectedClassId] = useState(location.state?.classId ?? null)
  const [selectedSubjectId, setSelectedSubjectId] = useState(location.state?.subjectId ?? null)

  useEffectDeduped(() => {
    load()
  }, [])

  async function load() {
    setIsLoading(true)
    setError('')
    try {
      setData(await fetchTeacherDashboard())
    } catch {
      setError('Could not load your subjects right now.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStart(lessonId) {
    setPendingLessonId(lessonId)
    setError('')
    try {
      await startLesson(lessonId)
      await load()
    } catch {
      setError('Could not start that lesson.')
    } finally {
      setPendingLessonId(null)
    }
  }

  async function handleEnd(lessonId) {
    setPendingLessonId(lessonId)
    setError('')
    try {
      await endLesson(lessonId)
      await load()
    } catch {
      setError('Could not end that lesson.')
    } finally {
      setPendingLessonId(null)
    }
  }

  async function handleRename(lessonId, title) {
    setError('')
    try {
      await updateLesson(lessonId, { title })
      await load()
    } catch {
      setError('Could not rename that lesson.')
      throw new Error('rename-failed')
    }
  }

  async function handleCreateLesson(subjectId, { title, description }) {
    await createLesson({ subject_id: subjectId, title, description: description || null })
    await load()
  }

  const classes = useMemo(() => {
    if (!data) return []
    const byClass = new Map()
    data.subjects.forEach((subject) => {
      if (!subject.class) return
      if (!byClass.has(subject.class.id)) {
        byClass.set(subject.class.id, { id: subject.class.id, name: subject.class.name, subjects: [] })
      }
      byClass.get(subject.class.id).subjects.push(subject)
    })
    // numeric: true so "Class 9" sorts before "Class 10" (plain string
    // comparison would put "Class 10" first, since '1' < '9' as characters).
    return Array.from(byClass.values()).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true })
    )
  }, [data])

  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null
  const selectedSubject = selectedClass?.subjects.find((s) => s.id === selectedSubjectId) ?? null

  if (isLoading) {
    return <p className="student-status">Loading...</p>
  }

  if (!data) {
    return <p className="student-status auth-error">{error}</p>
  }

  if (classes.length === 0) {
    return <p className="student-status">You haven't been assigned any subjects yet.</p>
  }

  return (
    <div className="teacher-dashboard">
      {error && <p className="auth-error">{error}</p>}

      {!selectedClass ? (
        <ClassPicker classes={classes} onSelect={setSelectedClassId} />
      ) : !selectedSubject ? (
        <SubjectPicker
          schoolClass={selectedClass}
          onBack={() => setSelectedClassId(null)}
          onSelect={setSelectedSubjectId}
        />
      ) : (
        <LessonPlanner
          subject={selectedSubject}
          schoolClass={selectedClass}
          onBack={() => setSelectedSubjectId(null)}
          pendingLessonId={pendingLessonId}
          onStart={handleStart}
          onEnd={handleEnd}
          onRename={handleRename}
          onCreateLesson={handleCreateLesson}
        />
      )}
    </div>
  )
}

function ClassPicker({ classes, onSelect }) {
  return (
    <div>
      <p className="teacher-step-label">Step 1 · Choose a class</p>
      <div className="teacher-picker-grid">
        {classes.map((schoolClass) => (
          <button
            type="button"
            className="teacher-picker-card"
            key={schoolClass.id}
            onClick={() => onSelect(schoolClass.id)}
          >
            <span className="teacher-picker-icon">
              <ClassesIcon />
            </span>
            <span className="teacher-picker-name">{schoolClass.name}</span>
            <span className="teacher-picker-meta">
              {schoolClass.subjects.length} subject{schoolClass.subjects.length === 1 ? '' : 's'}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function SubjectPicker({ schoolClass, onBack, onSelect }) {
  return (
    <div>
      <button type="button" className="teacher-back-link" onClick={onBack}>
        &larr; Classes
      </button>
      <p className="teacher-step-label">
        Step 2 · Choose a subject in <strong>{schoolClass.name}</strong>
      </p>
      <div className="teacher-picker-grid">
        {schoolClass.subjects.map((subject) => (
          <button
            type="button"
            className="teacher-picker-card"
            key={subject.id}
            onClick={() => onSelect(subject.id)}
          >
            <span className="teacher-picker-icon">
              <SubjectsIcon />
            </span>
            <span className="teacher-picker-name">{subject.name}</span>
            <span className="teacher-picker-meta">
              {subject.lessons.length} lesson{subject.lessons.length === 1 ? '' : 's'}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function LessonPlanner({ subject, schoolClass, onBack, pendingLessonId, onStart, onEnd, onRename, onCreateLesson }) {
  const [editingLessonId, setEditingLessonId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [isSavingTitle, setIsSavingTitle] = useState(false)

  const [showAddForm, setShowAddForm] = useState(false)
  const [newLessonTitle, setNewLessonTitle] = useState('')
  const [newLessonDescription, setNewLessonDescription] = useState('')
  const [isAddingLesson, setIsAddingLesson] = useState(false)
  const [addError, setAddError] = useState('')

  function startEditing(lesson) {
    setEditingLessonId(lesson.id)
    setEditValue(lesson.title)
  }

  function cancelEditing() {
    setEditingLessonId(null)
    setEditValue('')
  }

  async function saveTitle(lessonId) {
    const title = editValue.trim()
    if (!title) return
    setIsSavingTitle(true)
    try {
      await onRename(lessonId, title)
      setEditingLessonId(null)
      setEditValue('')
    } catch {
      // error is surfaced by the parent's error banner
    } finally {
      setIsSavingTitle(false)
    }
  }

  function cancelAddLesson() {
    setShowAddForm(false)
    setNewLessonTitle('')
    setNewLessonDescription('')
    setAddError('')
  }

  async function handleAddLesson(event) {
    event.preventDefault()
    setAddError('')
    setIsAddingLesson(true)
    try {
      await onCreateLesson(subject.id, { title: newLessonTitle.trim(), description: newLessonDescription.trim() })
      cancelAddLesson()
    } catch (err) {
      setAddError(
        err.response?.data?.message ??
          Object.values(err.response?.data?.errors ?? {})[0]?.[0] ??
          'Could not add that lesson.'
      )
    } finally {
      setIsAddingLesson(false)
    }
  }

  return (
    <div>
      <button type="button" className="teacher-back-link" onClick={onBack}>
        &larr; {schoolClass.name} subjects
      </button>

      <section className="teacher-subject-card">
        <header className="teacher-subject-header">
          <span className="subject-icon">
            <SubjectsIcon />
          </span>
          <div>
            <h3>{subject.name}</h3>
            <p className="teacher-subject-class">{schoolClass.name}</p>
          </div>
          <button
            type="button"
            className="auth-submit add-button teacher-add-lesson-button"
            onClick={() => setShowAddForm((prev) => !prev)}
          >
            {showAddForm ? 'Cancel' : '+ Add lesson'}
          </button>
        </header>

        {showAddForm && (
          <form onSubmit={handleAddLesson} className="auth-form teacher-add-lesson-form">
            <label>
              Title
              <input
                type="text"
                value={newLessonTitle}
                onChange={(e) => setNewLessonTitle(e.target.value)}
                autoFocus
                required
              />
            </label>
            <label>
              Description (optional)
              <input
                type="text"
                value={newLessonDescription}
                onChange={(e) => setNewLessonDescription(e.target.value)}
              />
            </label>

            {addError && <p className="auth-error">{addError}</p>}

            <div className="user-form-actions">
              <button type="submit" className="auth-submit" disabled={isAddingLesson || !newLessonTitle.trim()}>
                {isAddingLesson ? 'Adding...' : 'Add lesson'}
              </button>
              <button type="button" className="cancel-button" onClick={cancelAddLesson} disabled={isAddingLesson}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {!showAddForm && (subject.lessons.length === 0 ? (
          <p className="student-status">No lessons yet for this subject.</p>
        ) : (
          <ul className="teacher-lesson-list">
            {subject.lessons.map((lesson) => {
              const status = lessonStatus(lesson)
              const cStatus = contentStatus(lesson)
              const isPending = pendingLessonId === lesson.id
              const isEditing = editingLessonId === lesson.id

              return (
                <li className={`teacher-lesson-card${status === 'live' ? ' teacher-lesson-card-live' : ''}`} key={lesson.id}>
                  <div className="teacher-lesson-top">
                    <div className="teacher-lesson-identity">
                      {isEditing ? (
                        <span className="teacher-lesson-title-edit">
                          <input
                            type="text"
                            className="teacher-lesson-title-input"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveTitle(lesson.id)
                              if (e.key === 'Escape') cancelEditing()
                            }}
                            autoFocus
                            disabled={isSavingTitle}
                          />
                          <button
                            type="button"
                            className="lesson-action-button lesson-start-button"
                            onClick={() => saveTitle(lesson.id)}
                            disabled={isSavingTitle || !editValue.trim()}
                          >
                            {isSavingTitle ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            className="cancel-button"
                            onClick={cancelEditing}
                            disabled={isSavingTitle}
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <>
                          <span className="teacher-lesson-title">{lesson.title}</span>
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => startEditing(lesson)}
                            aria-label={`Edit ${lesson.title}`}
                          >
                            <PencilIcon />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="teacher-lesson-badges">
                      <span className={`lesson-status lesson-status-${status}`}>
                        {LESSON_STATUS_LABEL[status]}
                      </span>
                      <span className={`content-status content-status-${cStatus}`}>
                        {CONTENT_STATUS_LABEL[cStatus]}
                      </span>
                    </div>
                  </div>

                  <div className="teacher-lesson-bottom">
                    <div className="teacher-lesson-links">
                      <Link
                        to={`/dashboard/lessons/${lesson.id}/content`}
                        state={{
                          lessonTitle: `${subject.name} — ${lesson.title}`,
                          classId: schoolClass.id,
                          subjectId: subject.id,
                        }}
                        className="teacher-lesson-link"
                      >
                        Content
                      </Link>

                      <Link
                        to={`/dashboard/lessons/${lesson.id}/assessments`}
                        state={{
                          lessonTitle: `${subject.name} — ${lesson.title}`,
                          classId: schoolClass.id,
                          subjectId: subject.id,
                        }}
                        className="teacher-lesson-link"
                      >
                        Assessments
                      </Link>
                    </div>

                    {status === 'live' ? (
                      <button
                        type="button"
                        className="lesson-action-button lesson-end-button"
                        disabled={isPending}
                        onClick={() => onEnd(lesson.id)}
                      >
                        <StopIcon />
                        {isPending ? 'Ending...' : 'End'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="lesson-action-button lesson-start-button"
                        disabled={isPending}
                        onClick={() => onStart(lesson.id)}
                      >
                        <PlayIcon />
                        {isPending ? 'Starting...' : status === 'ended' ? 'Restart' : 'Start'}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        ))}
      </section>
    </div>
  )
}
