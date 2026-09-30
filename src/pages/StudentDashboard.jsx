import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchStudentDashboard } from '../api/student'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import { ArrowDownIcon, ClassesIcon, LessonsIcon, SubjectsIcon } from '../components/icons'
import '../styles/lessonStatus.css'
import './StudentDashboard.css'

export default function StudentDashboard() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffectDeduped(() => {
    fetchStudentDashboard()
      .then(setData)
      .catch(() => setError('Could not load your class right now.'))
      .finally(() => setIsLoading(false))
  }, [])

  const totals = useMemo(() => {
    if (!data?.subjects) return { subjects: 0, lessons: 0 }
    return {
      subjects: data.subjects.length,
      lessons: data.subjects.reduce((sum, s) => sum + s.lessons.length, 0),
    }
  }, [data])

  if (isLoading) {
    return <p className="student-status">Loading...</p>
  }

  if (error) {
    return <p className="student-status auth-error">{error}</p>
  }

  if (!data.class) {
    return (
      <p className="student-status">
        You're not assigned to a class yet. Contact your school admin.
      </p>
    )
  }

  return (
    <div className="student-dashboard">
      <section className="class-summary">
        <div className="class-summary-identity">
          <span className="class-summary-icon">
            <ClassesIcon />
          </span>
          <div>
            <p className="class-summary-label">Your class</p>
            <h2 className="class-summary-name">{data.class.name}</h2>
          </div>
        </div>

        <div className="class-summary-stats">
          <div className="mini-stat">
            <SubjectsIcon />
            <span>
              {totals.subjects} subject{totals.subjects === 1 ? '' : 's'}
            </span>
          </div>
          <div className="mini-stat">
            <LessonsIcon />
            <span>
              {totals.lessons} lesson{totals.lessons === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </section>

      <div className="subject-list">
        {data.subjects.map((subject) => {
          const liveLesson = subject.lessons.find((l) => l.is_active)
          return (
            <Link
              to={`/dashboard/subjects/${subject.id}/lessons`}
              state={{ subjectName: subject.name }}
              className="subject-row"
              key={subject.id}
            >
              <span className="subject-icon">
                <SubjectsIcon />
              </span>

              <span className="subject-row-info">
                <span className="subject-row-name">{subject.name}</span>
                <span className="subject-row-teacher">
                  {subject.teachers.length > 0
                    ? subject.teachers.map((t) => t.name).join(', ')
                    : 'Teacher not assigned yet'}
                </span>
              </span>

              <span className="subject-row-status">
                {liveLesson ? (
                  <>
                    <span className="lesson-status lesson-status-live">Live</span>
                    {liveLesson.title}
                  </>
                ) : (
                  <span className="subject-row-muted">No live lesson</span>
                )}
              </span>

              <span className="subject-row-arrow">
                <ArrowDownIcon />
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
